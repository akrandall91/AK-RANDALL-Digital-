(() => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const leadConfig = window.AKRD_LEAD_CONFIG || {};
  const isConnectPage = window.location.pathname.toLowerCase().endsWith('connect.html');
  const isPrivacyPage = window.location.pathname.toLowerCase().endsWith('privacy.html');
  const isAssessmentPage = window.location.pathname.toLowerCase().endsWith('assessment.html');
  const siteMetrics = window.AKRD_SITE_METRICS || {};

  document.querySelectorAll('[data-proof-metric]').forEach(node => {
    const metric = siteMetrics[node.dataset.proofMetric];
    if (metric?.display) node.textContent = metric.display;
  });

  const trackConversion = (eventName, detail = {}) => {
    window.dataLayer = window.dataLayer || [];
    const event = { event: eventName, ...detail };
    window.dataLayer.push(event);
    document.dispatchEvent(new CustomEvent('akrd:conversion', { detail: event }));
  };

  const bindAssessmentLink = link => {
    if (!link || link.dataset.assessmentTracked) return;
    link.dataset.assessmentTracked = 'true';
    link.addEventListener('click', () => trackConversion('assessment_open', {
      sourcePage: window.location.pathname,
      label: link.dataset.assessmentCta || (link.closest('.site-footer') ? 'footer' : link.textContent.trim())
    }));
  };

  document.querySelectorAll('a[href*="assessment.html"]').forEach(bindAssessmentLink);

  document.querySelectorAll('a[data-guide-download]').forEach(link => {
    link.addEventListener('click', () => trackConversion('guide_download', {
      sourcePage: window.location.pathname,
      guide: link.dataset.guideDownload || 'service-guide',
      depth: link.dataset.guideDepth || 'unspecified',
      file: link.getAttribute('href') || ''
    }));
  });

  document.querySelectorAll('a[href*="calendar.app.google"]').forEach(link => {
    if (link.hasAttribute('data-booking-fallback')) return;
    link.href = isConnectPage ? '#schedule' : 'connect.html#schedule';
    link.removeAttribute('target');
    link.removeAttribute('rel');
    if (link.classList.contains('nav-cta')) link.textContent = 'Book a free intro call';
    else if (link.closest('.site-footer')) link.textContent = 'Book a free intro call ↗';
    else if (link.classList.contains('button')) link.textContent = 'Book your free 30-minute intro call ↗';
  });

  document.querySelectorAll('a[href*="#schedule"]').forEach(link => {
    link.addEventListener('click', () => trackConversion('scheduler_open', {
      sourcePage: window.location.pathname,
      label: link.textContent.trim()
    }));
  });

  if (!isConnectPage && !isPrivacyPage && !isAssessmentPage) {
    const mobileConversionBar = document.createElement('div');
    mobileConversionBar.className = 'mobile-conversion-bar';
    mobileConversionBar.setAttribute('role', 'navigation');
    mobileConversionBar.setAttribute('aria-label', 'Quick actions');

    const mobileAssessmentLink = document.createElement('a');
    mobileAssessmentLink.href = 'assessment.html';
    mobileAssessmentLink.dataset.assessmentCta = 'mobile-sticky';
    mobileAssessmentLink.textContent = 'Free assessment';
    bindAssessmentLink(mobileAssessmentLink);

    const mobileBookingLink = document.createElement('a');
    mobileBookingLink.href = 'connect.html#schedule';
    mobileBookingLink.textContent = 'Book a free call';
    mobileBookingLink.addEventListener('click', () => trackConversion('scheduler_open', {
      sourcePage: window.location.pathname,
      label: 'Mobile conversion dock'
    }));

    mobileConversionBar.append(mobileAssessmentLink, mobileBookingLink);
    document.body.append(mobileConversionBar);

    const updateMobileConversionBar = () => {
      mobileConversionBar.classList.toggle('is-visible', window.scrollY > 560);
    };
    updateMobileConversionBar();
    window.addEventListener('scroll', updateMobileConversionBar, { passive: true });
  }

  const bookingFrame = document.querySelector('[data-booking-frame]');
  const bookingFallback = document.querySelector('[data-booking-fallback]');
  if (bookingFrame && leadConfig.calendarEmbedUrl) bookingFrame.src = leadConfig.calendarEmbedUrl;
  if (bookingFallback && leadConfig.calendarFallbackUrl) bookingFallback.href = leadConfig.calendarFallbackUrl;

  const footerNav = document.querySelector('.footer-links[aria-label="Footer"]');
  const primaryNav = document.querySelector('.site-nav');
  if (primaryNav && !primaryNav.querySelector('a[href="resources.html"]')) {
    const resourcesLink = document.createElement('a');
    resourcesLink.href = 'resources.html';
    resourcesLink.textContent = 'Resources';
    const aboutLink = primaryNav.querySelector('a[href="about.html"]');
    primaryNav.insertBefore(resourcesLink, aboutLink || primaryNav.firstChild);
  }
  if (footerNav && !footerNav.querySelector('a[href="resources.html"]')) {
    const resourcesLink = document.createElement('a');
    resourcesLink.href = 'resources.html';
    resourcesLink.textContent = 'Resources';
    const proofLink = footerNav.querySelector('a[href="work.html"]');
    footerNav.insertBefore(resourcesLink, proofLink || footerNav.firstChild);
  }
  if (footerNav && !footerNav.querySelector('a[href="assessment.html"]')) {
    const assessmentLink = document.createElement('a');
    assessmentLink.href = 'assessment.html';
    assessmentLink.textContent = 'Free assessment';
    bindAssessmentLink(assessmentLink);
    footerNav.append(assessmentLink);
  }
  if (footerNav && !footerNav.querySelector('a[href="privacy.html"]')) {
    const privacyLink = document.createElement('a');
    privacyLink.href = 'privacy.html';
    privacyLink.textContent = 'Privacy';
    footerNav.append(privacyLink);
  }

  const footerBottom = document.querySelector('.footer-bottom');
  if (footerBottom && !footerBottom.querySelector('.footer-media-credit')) {
    const mediaCredit = document.createElement('span');
    mediaCredit.className = 'footer-media-credit';
    mediaCredit.textContent = 'Original field photography + video by Andrew Randall';
    footerBottom.classList.add('footer-bottom--with-credit');
    footerBottom.insertBefore(mediaCredit, footerBottom.lastElementChild);
  }

  const assessmentFrame = document.getElementById('growth-assessment');
  window.addEventListener('message', event => {
    if (!assessmentFrame || event.source !== assessmentFrame.contentWindow || !event.data) return;
    if (event.data.type === 'akrd-assessment-height') {
      const height = Math.max(720, Math.min(1500, Number(event.data.height) || 0));
      assessmentFrame.style.height = `${height}px`;
    }
    if (event.data.type === 'akrd-assessment-event' && typeof event.data.eventName === 'string') {
      trackConversion(event.data.eventName, {
        sourcePage: window.location.pathname,
        ...(event.data.detail || {})
      });
    }
  });

  const setHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 20);
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  const closeNav = () => {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  };

  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeNav(); });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.toggle('motion-reduced', reduceMotion);

  document.querySelectorAll('.problem-grid, .service-grid, .values-grid, .chain, .case-grid, .recognition-grid, .tier-grid, .audience-grid, .home-diagnostic-grid, .home-paths-grid, .home-industry-grid, .home-method-grid, .home-proof-story-metrics').forEach(group => {
    [...group.children].forEach((item, index) => item.style.setProperty('--reveal-delay', `${Math.min(index * 85, 340)}ms`));
  });

  const revealItems = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    revealItems.forEach(item => observer.observe(item));
  }

  document.querySelectorAll('[data-video-control]').forEach(button => {
    const video = document.getElementById(button.dataset.videoControl);
    if (!video) return;
    if (reduceMotion) video.pause();
    button.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        button.textContent = 'Pause film';
      } else {
        video.pause();
        button.textContent = 'Play film';
      }
    });
  });

  document.querySelectorAll('video[data-autoplay-visible]').forEach(video => {
    const control = document.querySelector(`[data-video-control="${video.id}"]`);
    const saveData = navigator.connection?.saveData;
    if (reduceMotion || saveData || !('IntersectionObserver' in window)) return;
    const videoObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          video.play().then(() => { if (control) control.textContent = 'Pause film'; }).catch(() => {});
        } else {
          video.pause();
          if (control) control.textContent = 'Play film';
        }
      });
    }, { threshold: .35 });
    videoObserver.observe(video);
  });

  if (document.body.classList.contains('case-story-page')) {
    trackConversion('case_story_open', {
      sourcePage: window.location.pathname,
      label: document.body.dataset.caseStory || 'case-story'
    });
  }

  document.querySelectorAll('[data-case-event]').forEach(link => {
    link.addEventListener('click', () => trackConversion(link.dataset.caseEvent, {
      sourcePage: window.location.pathname,
      label: link.dataset.caseLabel || document.body.dataset.caseStory || 'case-story'
    }));
  });

  document.querySelectorAll('[data-case-video]').forEach(caseFilm => {
    caseFilm.addEventListener('play', () => {
      if (caseFilm.dataset.playTracked) return;
      caseFilm.dataset.playTracked = 'true';
      trackConversion('case_story_video_play', {
        sourcePage: window.location.pathname,
        label: caseFilm.dataset.caseVideo || document.body.dataset.caseStory || 'case-story'
      });
    });
  });

  document.querySelectorAll('[data-case-compare]').forEach(comparison => {
    const range = comparison.querySelector('[data-case-compare-range]');
    if (!range) return;
    const updateComparison = () => {
      const value = Math.max(0, Math.min(100, Number(range.value) || 0));
      comparison.style.setProperty('--case-position', `${value}%`);
      range.setAttribute('aria-valuetext', `${value} percent of redesigned view revealed`);
    };
    range.addEventListener('input', updateComparison);
    updateComparison();
  });

  const filterButtons = document.querySelectorAll('[data-filter]');
  const caseCards = document.querySelectorAll('[data-category]');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    caseCards.forEach(card => { card.hidden = filter !== 'all' && card.dataset.category !== filter; });
  }));

  const form = document.querySelector('[data-inquiry-form]');
  const requestedFocus = new URLSearchParams(window.location.search).get('focus');
  const focusSelect = form?.querySelector('[name="focus"]');
  if (requestedFocus && focusSelect) {
    const matchingOption = [...focusSelect.options].find(option => option.textContent.toLowerCase().includes(requestedFocus.toLowerCase().split(' ')[0]));
    if (matchingOption) focusSelect.value = matchingOption.value;
  }
  const attributionKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const attribution = {};
  const query = new URLSearchParams(window.location.search);
  attributionKeys.forEach(key => {
    const value = query.get(key);
    if (value) attribution[key] = value.slice(0, 180);
  });
  try {
    const saved = JSON.parse(sessionStorage.getItem('akrd-attribution') || '{}');
    const currentAttribution = { ...attribution };
    Object.assign(attribution, saved, currentAttribution);
    sessionStorage.setItem('akrd-attribution', JSON.stringify(attribution));
  } catch (error) {}

  const setFormValue = (name, value) => {
    const input = form?.querySelector(`[name="${name}"]`);
    if (input) input.value = value || '';
  };
  setFormValue('sourcePage', window.location.href);
  setFormValue('referrer', document.referrer);
  setFormValue('utmSource', attribution.utm_source);
  setFormValue('utmMedium', attribution.utm_medium);
  setFormValue('utmCampaign', attribution.utm_campaign);
  setFormValue('utmContent', attribution.utm_content);
  setFormValue('utmTerm', attribution.utm_term);
  setFormValue('submittedAt', new Date().toISOString());

  form?.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('focus', () => {
      if (form.dataset.started) return;
      form.dataset.started = 'true';
      trackConversion('form_start', { sourcePage: window.location.pathname });
    }, { once: true });
  });

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get('name') || '';
    const email = data.get('email') || '';
    const company = data.get('company') || '';
    const focus = data.get('focus') || 'Strategy inquiry';
    const message = data.get('message') || '';
    const endpoint = String(leadConfig.appsScriptUrl || '').trim();
    const status = form.querySelector('.form-status');
    const submitButton = form.querySelector('[type="submit"]');
    const originalLabel = submitButton?.textContent;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.textContent = 'Sending…';
    }
    if (status) {
      status.dataset.state = 'working';
      status.textContent = 'Sending your message securely…';
    }
    trackConversion('form_submit', { sourcePage: window.location.pathname, focus: String(focus) });

    try {
      if (!endpoint) throw new Error('Lead endpoint is not configured.');
      const payload = new URLSearchParams();
      data.forEach((value, key) => payload.append(key, String(value)));
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: payload.toString()
      });
      form.classList.add('is-complete');
      const success = form.querySelector('[data-lead-success]');
      if (success) success.hidden = false;
      if (status) {
        status.dataset.state = 'success';
        status.textContent = 'Your message was sent.';
      }
      trackConversion('form_success', { sourcePage: window.location.pathname, focus: String(focus) });
    } catch (error) {
      const subject = encodeURIComponent(`Strategy inquiry: ${focus}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nCompany: ${company}\nFocus: ${focus}\n\n${message}`);
      if (status) {
        status.dataset.state = 'fallback';
        status.textContent = 'The form is temporarily unavailable, so your email app is opening with your message prepared.';
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        submitButton.textContent = originalLabel || 'Send my inquiry ↗';
      }
      trackConversion('form_fallback', { sourcePage: window.location.pathname, focus: String(focus) });
      window.location.href = `mailto:Andrew@AKRandall.com?subject=${subject}&body=${body}`;
    }
  });

  const emailCapture = document.querySelector('[data-email-capture]');
  emailCapture?.querySelectorAll('input').forEach(field => {
    field.addEventListener('focus', () => {
      if (emailCapture.dataset.started) return;
      emailCapture.dataset.started = 'true';
      trackConversion('form_start', { sourcePage: window.location.pathname, formType: 'email-only' });
    }, { once: true });
  });

  emailCapture?.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(emailCapture);
    const email = String(data.get('email') || '').trim();
    const endpoint = String(leadConfig.appsScriptUrl || '').trim();
    const status = emailCapture.querySelector('.form-status');
    const submitButton = emailCapture.querySelector('[type="submit"]');
    const originalLabel = submitButton?.textContent;
    if (!email || !emailCapture.reportValidity()) return;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.textContent = 'Sending…';
    }
    if (status) {
      status.dataset.state = 'working';
      status.textContent = 'Sending securely…';
    }
    trackConversion('form_submit', { sourcePage: window.location.pathname, formType: 'email-only' });

    try {
      if (!endpoint) throw new Error('Lead endpoint is not configured.');
      const payload = new URLSearchParams({
        email,
        website: String(data.get('website') || ''),
        source: 'home-email-capture',
        captureSource: 'home-email-capture',
        focus: 'Growth starting point',
        message: 'Requested a low-friction follow-up from the home page.',
        sourcePage: window.location.href,
        referrer: document.referrer,
        submittedAt: new Date().toISOString(),
        utmSource: attribution.utm_source || '',
        utmMedium: attribution.utm_medium || '',
        utmCampaign: attribution.utm_campaign || '',
        utmContent: attribution.utm_content || '',
        utmTerm: attribution.utm_term || ''
      });
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: payload.toString()
      });
      emailCapture.classList.add('is-complete');
      const success = emailCapture.querySelector('[data-lead-success]');
      if (success) success.hidden = false;
      trackConversion('form_success', { sourcePage: window.location.pathname, formType: 'email-only' });
    } catch (error) {
      if (status) {
        status.dataset.state = 'fallback';
        status.textContent = 'The form is temporarily unavailable. Email Andrew directly at Andrew@AKRandall.com.';
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        submitButton.textContent = originalLabel || 'Send my starting point';
      }
      trackConversion('form_fallback', { sourcePage: window.location.pathname, formType: 'email-only' });
    }
  });

  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.append(progressBar);

  const chapters = [...document.querySelectorAll('main > section')].filter(section => !section.hidden && !section.classList.contains('proof-strip'));
  let chapterButtons = [];
  if (chapters.length > 2) {
    const chapterRail = document.createElement('nav');
    chapterRail.className = 'chapter-rail';
    chapterRail.setAttribute('aria-label', 'Page chapters');
    chapterButtons = chapters.map((section, index) => {
      const button = document.createElement('button');
      const label = section.querySelector('.eyebrow, .page-index')?.textContent.trim() || `Section ${index + 1}`;
      button.type = 'button';
      button.textContent = String(index + 1).padStart(2, '0');
      button.setAttribute('aria-label', label);
      button.title = label;
      button.addEventListener('click', () => section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }));
      chapterRail.append(button);
      return button;
    });
    document.body.append(chapterRail);
  }

  const parallaxItems = reduceMotion ? [] : [...document.querySelectorAll('.hero-photo img, .case-media img, .compare-panel img, .recognition-card img, .bio-photo img, .media-feature-visual video')];
  const story = document.querySelector('[data-scroll-story]');
  const storySteps = story ? [...story.querySelectorAll('.chain-step')] : [];
  const careerTimeline = document.querySelector('.timeline');
  const careerSteps = careerTimeline ? [...careerTimeline.querySelectorAll('.timeline-item')] : [];
  const heroPhoto = document.querySelector('.hero-photo');
  const homeScrollSection = document.querySelector('[data-scroll-video-section]');
  const homeScrollVideo = homeScrollSection?.querySelector('[data-scroll-video]');
  const homeScrollChapters = homeScrollSection ? [...homeScrollSection.querySelectorAll('[data-scroll-chapter]')] : [];
  const homeScrollLabel = homeScrollSection?.querySelector('[data-scroll-progress-label]');
  const homeScrollLabels = ['See the market', 'Build the system', 'Win with proof'];
  const saveData = Boolean(navigator.connection?.saveData);
  let homeVideoDuration = homeScrollVideo?.readyState >= 1 ? homeScrollVideo.duration : 0;
  let motionFrame = 0;

  if (homeScrollVideo) {
    homeScrollVideo.pause();
    homeScrollVideo.addEventListener('loadedmetadata', () => {
      homeVideoDuration = Number.isFinite(homeScrollVideo.duration) ? homeScrollVideo.duration : 0;
      requestScrollMotion();
    }, { once: true });
  }

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const updateScrollMotion = () => {
    motionFrame = 0;
    const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pageProgress = clamp(window.scrollY / scrollRange);
    progressBar.style.setProperty('--scroll-progress', pageProgress.toFixed(4));

    if (chapterButtons.length) {
      const focusLine = window.innerHeight * .46;
      let activeIndex = 0;
      chapters.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= focusLine && rect.bottom > focusLine) activeIndex = index;
        else if (rect.top <= focusLine) activeIndex = index;
      });
      chapterButtons.forEach((button, index) => {
        button.classList.toggle('is-active', index === activeIndex);
        if (index === activeIndex) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
    }

    if (!reduceMotion) {
      const viewportCenter = window.innerHeight / 2;
      parallaxItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > window.innerHeight + 120) return;
        const distance = (rect.top + rect.height / 2 - viewportCenter) / Math.max(window.innerHeight, rect.height);
        item.style.setProperty('--parallax-y', `${Math.round(clamp(distance, -.8, .8) * -28)}px`);
      });
      if (heroPhoto) heroPhoto.style.setProperty('--hero-shift', `${Math.min(window.scrollY * .055, 34)}px`);
    }

    if (homeScrollSection) {
      const rect = homeScrollSection.getBoundingClientRect();
      const travel = Math.max(1, homeScrollSection.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / travel);
      const active = Math.min(homeScrollChapters.length - 1, Math.floor(progress * Math.max(1, homeScrollChapters.length)));
      const fade = clamp((progress - .72) / .24);
      homeScrollSection.style.setProperty('--home-scroll-progress', progress.toFixed(4));
      homeScrollSection.style.setProperty('--home-video-scale', (1.02 + progress * .035).toFixed(4));
      homeScrollSection.style.setProperty('--home-copy-opacity', (1 - fade * .58).toFixed(3));
      homeScrollSection.style.setProperty('--home-copy-shift', `${Math.round(fade * -18)}px`);
      homeScrollChapters.forEach((chapter, index) => {
        chapter.classList.toggle('is-active', index === active);
        if (index === active) chapter.setAttribute('aria-current', 'step');
        else chapter.removeAttribute('aria-current');
      });
      if (homeScrollLabel && homeScrollLabels[active]) homeScrollLabel.textContent = homeScrollLabels[active];

      const liveVideoDuration = homeScrollVideo && Number.isFinite(homeScrollVideo.duration) ? homeScrollVideo.duration : homeVideoDuration;
      if (homeScrollVideo && liveVideoDuration > 0 && !reduceMotion && !saveData) {
        const targetTime = Math.min(liveVideoDuration - .04, progress * liveVideoDuration);
        if (Math.abs(homeScrollVideo.currentTime - targetTime) > .04) {
          try { homeScrollVideo.currentTime = targetTime; } catch (error) {}
        }
      }
    }

    if (story && storySteps.length) {
      const rect = story.getBoundingClientRect();
      const travel = Math.max(1, story.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / travel);
      const active = Math.min(storySteps.length - 1, Math.floor(progress * storySteps.length));
      story.style.setProperty('--story-progress', progress.toFixed(3));
      story.style.setProperty('--story-position', `${(progress * 100).toFixed(2)}%`);
      storySteps.forEach((step, index) => {
        step.classList.toggle('is-active', index === active);
        step.classList.toggle('is-past', index < active);
      });
    }

    if (careerTimeline && careerSteps.length) {
      const rect = careerTimeline.getBoundingClientRect();
      const progress = clamp((window.innerHeight * .72 - rect.top) / Math.max(1, rect.height));
      const active = Math.min(careerSteps.length - 1, Math.floor(progress * careerSteps.length));
      careerTimeline.style.setProperty('--timeline-progress', progress.toFixed(3));
      careerSteps.forEach((step, index) => step.classList.toggle('is-active', index === active));
    }
  };

  const requestScrollMotion = () => {
    if (!motionFrame) motionFrame = window.requestAnimationFrame(updateScrollMotion);
  };
  updateScrollMotion();
  window.addEventListener('scroll', requestScrollMotion, { passive: true });
  window.addEventListener('resize', requestScrollMotion, { passive: true });

  const proofNumbers = document.querySelectorAll('.proof-strip .proof-item strong');
  const animateNumber = item => {
    const original = item.textContent.trim();
    const match = original.match(/^([0-9]+)(.*)$/);
    if (!match || reduceMotion) return;
    const target = Number(match[1]);
    const suffix = match[2];
    const start = performance.now();
    const duration = 1050;
    const tick = now => {
      const progress = clamp((now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      item.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  };
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateNumber(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: .55 });
    proofNumbers.forEach(item => countObserver.observe(item));
  }

  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!reduceMotion && finePointer) {
    document.body.classList.add('has-pointer-ambient');
    document.addEventListener('pointermove', event => {
      document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
    }, { passive: true });

    document.querySelectorAll('.audience-card, .case-card, .recognition-card, .tier-card, .system-card, .industry-card, .proof-v2-transfer-grid article').forEach(card => {
      card.classList.add('tilt-card');
      const glare = document.createElement('span');
      glare.className = 'tilt-glare';
      glare.setAttribute('aria-hidden', 'true');
      card.append(glare);
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width);
        const y = clamp((event.clientY - rect.top) / rect.height);
        card.style.setProperty('--tilt-x', `${((.5 - y) * 5).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${((x - .5) * 6).toFixed(2)}deg`);
        card.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });

    document.querySelectorAll('.button, .nav-cta').forEach(button => {
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        button.style.setProperty('--mag-x', `${((event.clientX - rect.left - rect.width / 2) * .11).toFixed(1)}px`);
        button.style.setProperty('--mag-y', `${((event.clientY - rect.top - rect.height / 2) * .16).toFixed(1)}px`);
      }, { passive: true });
      button.addEventListener('pointerleave', () => {
        button.style.setProperty('--mag-x', '0px');
        button.style.setProperty('--mag-y', '0px');
      });
    });
  }

  const signalCanvas = document.querySelector('[data-signal-field]');
  if (signalCanvas) {
    const context = signalCanvas.getContext('2d');
    const host = signalCanvas.parentElement;
    const colors = ['#B7E33F', '#00B8D4', '#2457FF', '#FF6B2C'];
    let seed = 24681357;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const points = Array.from({ length: 30 }, (_, index) => {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const radius = .58 + random() * .42;
      return {
        x: Math.sin(phi) * Math.cos(theta) * radius,
        y: Math.cos(phi) * radius,
        z: Math.sin(phi) * Math.sin(theta) * radius,
        color: colors[index % colors.length]
      };
    });
    let fieldWidth = 0;
    let fieldHeight = 0;
    let fieldVisible = true;
    let pointerX = 0;
    let pointerY = 0;
    let fieldFrame = 0;

    const sizeField = () => {
      const rect = host.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      fieldWidth = Math.max(1, rect.width);
      fieldHeight = Math.max(1, rect.height);
      signalCanvas.width = Math.round(fieldWidth * ratio);
      signalCanvas.height = Math.round(fieldHeight * ratio);
      signalCanvas.style.width = `${fieldWidth}px`;
      signalCanvas.style.height = `${fieldHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const renderField = time => {
      fieldFrame = 0;
      if (!context || !fieldWidth || !fieldHeight) return;
      context.clearRect(0, 0, fieldWidth, fieldHeight);
      const rotationY = (reduceMotion ? .25 : time * .00009) + pointerX * .32 + window.scrollY * .00022;
      const rotationX = -.12 + pointerY * .2;
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const projected = points.map(point => {
        const x1 = point.x * cosY - point.z * sinY;
        const z1 = point.x * sinY + point.z * cosY;
        const y1 = point.y * cosX - z1 * sinX;
        const z2 = point.y * sinX + z1 * cosX;
        const scale = 1.65 / (2.35 + z2);
        return {
          x: fieldWidth * .52 + x1 * fieldWidth * .42 * scale,
          y: fieldHeight * .48 + y1 * fieldHeight * .42 * scale,
          z: z2,
          scale,
          color: point.color
        };
      });

      projected.forEach((point, index) => {
        for (let next = index + 1; next < projected.length; next += 1) {
          const other = projected[next];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance > 92) continue;
          context.globalAlpha = Math.max(0, (1 - distance / 92) * .22);
          context.strokeStyle = point.color;
          context.lineWidth = .7;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }
      });
      projected.sort((a, b) => b.z - a.z).forEach(point => {
        const radius = 1.4 + point.scale * 3.1;
        context.globalAlpha = clamp(.42 + (1 - point.z) * .22, .35, .9);
        context.shadowBlur = 14;
        context.shadowColor = point.color;
        context.fillStyle = point.color;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;
      context.shadowBlur = 0;
      if (!reduceMotion && fieldVisible) fieldFrame = window.requestAnimationFrame(renderField);
    };

    host.addEventListener('pointermove', event => {
      const rect = host.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width) - .5;
      pointerY = ((event.clientY - rect.top) / rect.height) - .5;
    }, { passive: true });
    host.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
    if ('ResizeObserver' in window) new ResizeObserver(sizeField).observe(host);
    else window.addEventListener('resize', sizeField, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        fieldVisible = entries[0]?.isIntersecting ?? true;
        if (fieldVisible && !fieldFrame) fieldFrame = window.requestAnimationFrame(renderField);
      }, { rootMargin: '120px' }).observe(host);
    }
    sizeField();
    fieldFrame = window.requestAnimationFrame(renderField);
  }

  document.querySelectorAll('[data-year]').forEach(item => item.textContent = new Date().getFullYear());
})();
