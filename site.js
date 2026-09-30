(() => {
  const config = window.AKRD_LEAD_CONFIG || {};
  const path = window.location.pathname.toLowerCase();

  // Tell analytics.js about meaningful actions.
  const track = (event, detail = {}) => {
    document.dispatchEvent(new CustomEvent('akrd:conversion', { detail: { event, sourcePage: window.location.pathname, ...detail } }));
  };

  // Mobile menu
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('is-open', open);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    toggle?.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }));

  // Booking links
  document.querySelectorAll('a[href*="#schedule"]').forEach(link => {
    link.addEventListener('click', () => track('scheduler_open', { label: link.textContent.trim().slice(0, 80) }));
  });

  // Booking calendar
  const frame = document.querySelector('[data-booking-frame]');
  if (frame && config.calendarEmbedUrl) frame.src = config.calendarEmbedUrl;
  const fallback = document.querySelector('[data-booking-fallback]');
  if (fallback && config.calendarFallbackUrl) fallback.href = config.calendarFallbackUrl;

  // Google Review Kit: use a Square payment link when one is configured,
  // otherwise start the order through the contact form.
  const kitLinks = config.reviewKitCheckout || {};
  document.querySelectorAll('[data-kit]').forEach(link => {
    const url = kitLinks[link.dataset.kit];
    if (url) link.href = url;
  });

  // Contact form
  const form = document.querySelector('[data-inquiry-form]');
  if (form) {
    const pageLoadedAt = Date.now();
    let interacted = false;
    ['pointerdown', 'keydown', 'touchstart'].forEach(type => document.addEventListener(type, () => { interacted = true; }, { passive: true, once: true }));

    const params = new URLSearchParams(window.location.search);
    const focus = form.querySelector('[name="focus"]');
    const requested = (params.get('focus') || '').toLowerCase();
    if (requested && focus) {
      const match = [...focus.options].find(option => option.value && option.value.toLowerCase().includes(requested));
      if (match) focus.value = match.value;
    }

    const kit = { starter: 'Starter ($49)', counter: 'Counter ($99)', multi: 'multi-location' }[params.get('kit')];
    const messageBox = form.querySelector('[name="message"]');
    if (kit && messageBox && !messageBox.value) messageBox.value = `I’d like the ${kit} Google Review Kit.`;

    const set = (name, value) => { const input = form.querySelector(`[name="${name}"]`); if (input) input.value = value || ''; };
    set('sourcePage', window.location.href);
    set('referrer', document.referrer);
    Object.entries({ utm_source: 'utmSource', utm_medium: 'utmMedium', utm_campaign: 'utmCampaign', utm_content: 'utmContent', utm_term: 'utmTerm' })
      .forEach(([key, field]) => set(field, (params.get(key) || '').slice(0, 180)));

    let startedAt = 0;
    form.addEventListener('focusin', () => {
      if (startedAt) return;
      startedAt = Date.now();
      track('form_start');
    });

    const status = form.querySelector('.form-status');
    const submit = form.querySelector('[type="submit"]');
    const showSent = () => {
      form.querySelectorAll('.field, .form-actions').forEach(node => { node.hidden = true; });
      if (status) {
        status.dataset.state = 'success';
        status.textContent = 'Thanks — your message was sent. Andrew will get back to you soon.';
      }
    };

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);

      // Bots fill and send forms within seconds of loading, without typing.
      const now = Date.now();
      const looksAutomated = String(data.get('website') || '').trim() || now - pageLoadedAt < 4000 || !interacted || !startedAt || now - startedAt < 2500;
      if (looksAutomated) { showSent(); return; }

      const phone = String(data.get('phone') || '').trim();
      const message = String(data.get('message') || '').trim();
      data.set('message', phone ? `Phone: ${phone}\n\n${message}` : message);
      data.delete('phone');
      data.set('submittedAt', new Date().toISOString());
      data.set('formElapsedMs', String(now - pageLoadedAt));

      if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }
      track('form_submit', { focus: String(data.get('focus') || '') });
      try {
        if (!config.appsScriptUrl) throw new Error('No form endpoint');
        await fetch(config.appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: new URLSearchParams([...data.entries()].map(([k, v]) => [k, String(v)])).toString()
        });
        showSent();
        track('form_success', { focus: String(data.get('focus') || '') });
      } catch (error) {
        const subject = encodeURIComponent(`Website inquiry: ${data.get('focus') || 'General'}`);
        const body = encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\nBusiness: ${data.get('company') || ''}\n\n${data.get('message')}`);
        if (status) {
          status.dataset.state = 'fallback';
          status.textContent = 'The form is not available right now, so your email app is opening with your message.';
        }
        if (submit) { submit.disabled = false; submit.textContent = 'Send message'; }
        track('form_fallback');
        window.location.href = `mailto:Andrew@AKRandall.com?subject=${subject}&body=${body}`;
      }
    });
  }

  document.querySelectorAll('[data-year]').forEach(node => { node.textContent = new Date().getFullYear(); });
  if (path.endsWith('/') || path.endsWith('index.html')) document.documentElement.dataset.page = 'home';
})();
