(() => {
  const config = window.AKRD_LEAD_CONFIG || {};
  const measurementId = String(config.analyticsMeasurementId || '').trim().toUpperCase();
  const analyticsEnabled = config.analyticsEnabled !== false;
  const firstPartyEnabled = config.firstPartyAnalytics !== false;
  const endpoint = getAppsScriptEndpoint(config.appsScriptUrl);
  const hasGoogleAnalytics = analyticsEnabled && /^G-[A-Z0-9]{6,}$/.test(measurementId);
  const allowedEvents = new Set([
    'scheduler_open',
    'form_start',
    'form_submit',
    'form_success',
    'form_fallback',
    'assessment_start',
    'assessment_open',
    'assessment_step',
    'assessment_complete',
    'assessment_booking_click',
    'guide_download',
    'case_story_open',
    'case_story_video_play',
    'case_story_assessment_click',
    'case_story_intro_call_click',
    'generate_lead',
    'scroll_depth'
  ]);

  const pagePath = cleanPath(window.location.pathname);
  const attribution = getAttribution();
  const acquisition = getAcquisition(attribution);
  const sessionId = getSessionId();
  const basePayload = {
    sessionId,
    sourcePage: pagePath,
    pageTitle: cleanValue(document.title, 180),
    referrerDomain: acquisition.referrerDomain || '',
    utmSource: acquisition.utm_source || '',
    utmMedium: acquisition.utm_medium || '',
    utmCampaign: acquisition.utm_campaign || '',
    device: getDeviceCategory()
  };

  if (hasGoogleAnalytics) initializeGoogleAnalytics();

  // GA4 sends its own page_view. The first-party copy powers the private
  // Google Sheet digest without storing a visitor's form data.
  sendFirstParty('page_view', basePayload);

  document.addEventListener('akrd:conversion', event => {
    const detail = event.detail || {};
    const eventName = cleanEventName(detail.event);
    if (!allowedEvents.has(eventName)) return;

    const parameters = privacySafeParameters(detail);
    sendGoogleEvent(eventName, parameters);
    sendFirstParty(eventName, { ...basePayload, ...parameters });

    if (eventName === 'form_success') {
      const leadParameters = {
        leadSource: parameters.formType === 'email-only' ? 'home_email_capture' : 'website_form',
        focus: parameters.focus || ''
      };
      sendGoogleEvent('generate_lead', leadParameters);
      sendFirstParty('generate_lead', { ...basePayload, ...leadParameters });
    }

    if (eventName === 'assessment_complete') {
      const leadParameters = {
        leadSource: 'growth_assessment',
        path: parameters.path || '',
        industry: parameters.industry || '',
        variantIndustrySignal: parameters.variantIndustrySignal || '',
        recommendation: parameters.recommendation || '',
        tier: parameters.tier || ''
      };
      sendGoogleEvent('generate_lead', leadParameters);
      sendFirstParty('generate_lead', { ...basePayload, ...leadParameters });
    }
  });

  installScrollDepthTracking();

  function initializeGoogleAnalytics() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      page_location: window.location.origin + pagePath,
      page_title: document.title,
      transport_type: 'beacon'
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.dataset.akrdAnalytics = 'true';
    document.head.append(script);
  }

  function sendGoogleEvent(eventName, parameters) {
    if (!hasGoogleAnalytics || typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, toGoogleParameters(parameters));
  }

  function sendFirstParty(eventName, parameters) {
    if (!firstPartyEnabled || !endpoint) return;
    const payload = new URLSearchParams({
      recordType: 'analytics',
      eventId: createId('evt'),
      eventName,
      recordedAt: new Date().toISOString(),
      ...stringifyParameters(parameters)
    });

    fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      body: payload
    }).catch(() => {});
  }

  function privacySafeParameters(detail) {
    return {
      sourcePage: cleanPath(detail.sourcePage || pagePath),
      label: cleanValue(detail.label, 120),
      focus: cleanValue(detail.focus, 120),
      formType: cleanValue(detail.formType, 40),
      path: cleanValue(detail.path, 120),
      industry: cleanValue(detail.industry, 120),
      variantIndustrySignal: cleanValue(detail.variantIndustrySignal, 40),
      stepReached: cleanValue(detail.stepReached, 80),
      recommendation: cleanValue(detail.recommendation, 160),
      tier: cleanValue(detail.tier, 80),
      guide: cleanValue(detail.guide, 120),
      depth: cleanValue(detail.depth, 40),
      file: cleanValue(detail.file, 180),
      scrollPercent: cleanValue(detail.scrollPercent, 3)
    };
  }

  function toGoogleParameters(parameters) {
    const source = parameters || {};
    return Object.fromEntries(Object.entries({
      source_page: source.sourcePage,
      link_text: source.label,
      inquiry_focus: source.focus,
      form_type: source.formType,
      assessment_path: source.path,
      industry: source.industry,
      assessment_variant: source.variantIndustrySignal,
      assessment_step: source.stepReached,
      recommendation: source.recommendation,
      assessment_tier: source.tier,
      guide_name: source.guide,
      guide_depth: source.depth,
      file_name: source.file,
      lead_source: source.leadSource,
      percent_scrolled: source.scrollPercent
    }).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  }

  function stringifyParameters(parameters) {
    return Object.fromEntries(Object.entries(parameters || {}).map(([key, value]) => [key, String(value || '').slice(0, 180)]));
  }

  function installScrollDepthTracking() {
    const sent = new Set();
    const thresholds = [50, 90];
    let scheduled = false;

    const measure = () => {
      scheduled = false;
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      thresholds.forEach(threshold => {
        if (percent < threshold || sent.has(threshold)) return;
        sent.add(threshold);
        const parameters = { sourcePage: pagePath, scrollPercent: String(threshold) };
        sendGoogleEvent('scroll_depth', parameters);
        sendFirstParty('scroll_depth', { ...basePayload, ...parameters });
      });
      if (sent.size === thresholds.length) window.removeEventListener('scroll', onScroll);
    };

    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function getAttribution() {
    const allowed = ['utm_source', 'utm_medium', 'utm_campaign'];
    const query = new URLSearchParams(window.location.search);
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('akrd-attribution') || '{}'); } catch (error) {}
    const result = { ...saved };
    allowed.forEach(key => {
      const value = cleanCampaignValue(query.get(key));
      if (value) result[key] = value;
    });
    return result;
  }

  function getAcquisition(attributionValues) {
    const key = 'akrd-analytics-acquisition';
    try {
      const existing = JSON.parse(sessionStorage.getItem(key) || '{}');
      if (existing && existing.captured) return existing;
      const captured = {
        captured: true,
        referrerDomain: getReferrerDomain(),
        utm_source: attributionValues.utm_source || '',
        utm_medium: attributionValues.utm_medium || '',
        utm_campaign: attributionValues.utm_campaign || ''
      };
      sessionStorage.setItem(key, JSON.stringify(captured));
      return captured;
    } catch (error) {
      return {
        captured: true,
        referrerDomain: getReferrerDomain(),
        utm_source: attributionValues.utm_source || '',
        utm_medium: attributionValues.utm_medium || '',
        utm_campaign: attributionValues.utm_campaign || ''
      };
    }
  }

  function getSessionId() {
    const key = 'akrd-analytics-session';
    try {
      const existing = sessionStorage.getItem(key);
      if (existing) return cleanValue(existing, 80);
      const created = createId('session');
      sessionStorage.setItem(key, created);
      return created;
    } catch (error) {
      return createId('session');
    }
  }

  function createId(prefix) {
    const random = window.crypto?.getRandomValues
      ? Array.from(window.crypto.getRandomValues(new Uint32Array(2))).map(value => value.toString(36)).join('')
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `${prefix}-${random}`.slice(0, 80);
  }

  function getAppsScriptEndpoint(value) {
    try {
      const url = new URL(String(value || '').trim());
      if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !url.pathname.endsWith('/exec')) return '';
      return url.href;
    } catch (error) {
      return '';
    }
  }

  function getReferrerDomain() {
    try { return cleanValue(new URL(document.referrer).hostname, 120); } catch (error) { return ''; }
  }

  function getDeviceCategory() {
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth < 1100) return 'tablet';
    return 'desktop';
  }

  function cleanEventName(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 40);
  }

  function cleanPath(value) {
    const path = String(value || '/').split('?')[0].split('#')[0].replace(/[<>]/g, '');
    return path.slice(0, 240) || '/';
  }

  function cleanCampaignValue(value) {
    const text = cleanValue(value, 100);
    if (!text || /@/.test(text) || /\d{7,}/.test(text.replace(/\D/g, ''))) return '';
    return text;
  }

  function cleanValue(value, limit) {
    return String(value || '').replace(/[<>\u0000-\u001F\u007F]/g, '').trim().slice(0, limit || 180);
  }
})();
