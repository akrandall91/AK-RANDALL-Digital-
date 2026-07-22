const LEAD_HEADERS = [
  'Timestamp',
  'Lead ID',
  'Name',
  'Email',
  'Company',
  'Focus',
  'Message',
  'Source Page',
  'Referrer',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'UTM Content',
  'UTM Term',
  'Status',
  'Appointment Date',
  'Calendar Event ID',
  'Last Updated'
];

const ANALYTICS_HEADERS = [
  'Timestamp',
  'Event ID',
  'Event Name',
  'Session ID',
  'Page',
  'Page Title',
  'Referrer Domain',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'Device',
  'Label',
  'Focus',
  'Assessment Path',
  'Industry',
  'Recommendation',
  'Tier',
  'Lead Source'
];

const ALLOWED_ANALYTICS_EVENTS = [
  'page_view',
  'scroll_depth',
  'scheduler_open',
  'form_start',
  'form_submit',
  'form_success',
  'form_fallback',
  'assessment_open',
  'assessment_start',
  'assessment_complete',
  'assessment_booking_click',
  'generate_lead'
];

function doGet() {
  return jsonResponse_({ ok: true, service: 'AKRD website intake and analytics' });
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const payload = parsePayload_(event);

    if (cleanText_(payload.recordType, 40).toLowerCase() === 'analytics') {
      return storeAnalyticsEvent_(payload);
    }

    // Honeypot submissions receive a neutral response and are not stored.
    if (String(payload.website || '').trim()) {
      return jsonResponse_({ ok: true });
    }

    const name = cleanText_(payload.name, 120);
    const email = cleanText_(payload.email, 180).toLowerCase();
    const company = cleanText_(payload.company, 180);
    const focus = cleanText_(payload.focus, 180);
    const message = cleanText_(payload.message, 4000);

    if (!name || !isEmail_(email) || !message) {
      return jsonResponse_({ ok: false, error: 'invalid_submission' });
    }

    if (isRateLimited_(email)) {
      return jsonResponse_({ ok: false, error: 'rate_limited' });
    }

    const properties = PropertiesService.getScriptProperties();
    const spreadsheetId = properties.getProperty('SPREADSHEET_ID');
    const sheetName = properties.getProperty('SHEET_NAME') || 'Website Leads';
    const notificationEmail = properties.getProperty('NOTIFICATION_EMAIL');
    if (!spreadsheetId) throw new Error('Missing SPREADSHEET_ID script property.');

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
    ensureHeadersFor_(sheet, LEAD_HEADERS);

    const now = new Date();
    const leadId = createLeadId_(now);
    const row = [
      now,
      leadId,
      safeCell_(name),
      safeCell_(email),
      safeCell_(company),
      safeCell_(focus),
      safeCell_(message),
      safeCell_(cleanText_(payload.sourcePage, 500)),
      safeCell_(cleanText_(payload.referrer, 500)),
      safeCell_(cleanText_(payload.utmSource, 180)),
      safeCell_(cleanText_(payload.utmMedium, 180)),
      safeCell_(cleanText_(payload.utmCampaign, 180)),
      safeCell_(cleanText_(payload.utmContent, 180)),
      safeCell_(cleanText_(payload.utmTerm, 180)),
      'New',
      '',
      '',
      now
    ];
    sheet.appendRow(row);

    if (notificationEmail) {
      sendOwnerNotification_({
        to: notificationEmail,
        spreadsheetId: spreadsheetId,
        leadId: leadId,
        name: name,
        email: email,
        company: company,
        focus: focus,
        message: message,
        sourcePage: cleanText_(payload.sourcePage, 500)
      });
    }

    return jsonResponse_({ ok: true, leadId: leadId });
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, error: 'server_error' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function storeAnalyticsEvent_(payload) {
  const eventName = cleanText_(payload.eventName, 40).toLowerCase().replace(/[^a-z0-9_]/g, '');
  const eventId = cleanText_(payload.eventId, 80);
  if (ALLOWED_ANALYTICS_EVENTS.indexOf(eventName) < 0 || !eventId) {
    return jsonResponse_({ ok: false, error: 'invalid_event' });
  }
  if (isDuplicateEvent_(eventId)) return jsonResponse_({ ok: true, duplicate: true });

  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty('SPREADSHEET_ID');
  const sheetName = properties.getProperty('ANALYTICS_SHEET_NAME') || 'Site Analytics';
  if (!spreadsheetId) throw new Error('Missing SPREADSHEET_ID script property.');

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  ensureHeadersFor_(sheet, ANALYTICS_HEADERS);
  sheet.appendRow([
    new Date(),
    safeCell_(eventId),
    eventName,
    safeCell_(cleanText_(payload.sessionId, 80)),
    safeCell_(cleanText_(payload.sourcePage, 240)),
    safeCell_(cleanText_(payload.pageTitle, 180)),
    safeCell_(cleanText_(payload.referrerDomain, 120)),
    safeCell_(cleanText_(payload.utmSource, 100)),
    safeCell_(cleanText_(payload.utmMedium, 100)),
    safeCell_(cleanText_(payload.utmCampaign, 100)),
    safeCell_(cleanText_(payload.device, 40)),
    safeCell_(cleanText_(payload.label, 120)),
    safeCell_(cleanText_(payload.focus, 120)),
    safeCell_(cleanText_(payload.path, 120)),
    safeCell_(cleanText_(payload.industry, 120)),
    safeCell_(cleanText_(payload.recommendation, 160)),
    safeCell_(cleanText_(payload.tier, 80)),
    safeCell_(cleanText_(payload.leadSource, 80))
  ]);
  rememberEvent_(eventId);
  return jsonResponse_({ ok: true });
}

function syncCalendarBookings() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty('SPREADSHEET_ID');
  const sheetName = properties.getProperty('SHEET_NAME') || 'Website Leads';
  const calendarId = properties.getProperty('CALENDAR_ID');
  const notificationEmail = properties.getProperty('NOTIFICATION_EMAIL');
  if (!spreadsheetId) throw new Error('Missing SPREADSHEET_ID script property.');

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return 0;

  ensureHeadersFor_(sheet, LEAD_HEADERS);
  const values = sheet.getRange(1, 1, sheet.getLastRow(), LEAD_HEADERS.length).getValues();
  const header = values[0];
  const emailColumn = header.indexOf('Email');
  const nameColumn = header.indexOf('Name');
  const companyColumn = header.indexOf('Company');
  const focusColumn = header.indexOf('Focus');
  const statusColumn = header.indexOf('Status');
  const appointmentColumn = header.indexOf('Appointment Date');
  const eventIdColumn = header.indexOf('Calendar Event ID');
  const updatedColumn = header.indexOf('Last Updated');
  if ([emailColumn, statusColumn, appointmentColumn, eventIdColumn, updatedColumn].some(index => index < 0)) return 0;

  const calendar = calendarId ? CalendarApp.getCalendarById(calendarId) : CalendarApp.getDefaultCalendar();
  if (!calendar) throw new Error('Calendar could not be accessed.');

  const start = new Date();
  start.setDate(start.getDate() - 30);
  const end = new Date();
  end.setDate(end.getDate() + 120);
  const events = calendar.getEvents(start, end);
  const bookingByEmail = {};

  events.forEach(calendarEvent => {
    calendarEvent.getGuestList().forEach(guest => {
      const guestEmail = String(guest.getEmail() || '').toLowerCase();
      if (!guestEmail) return;
      const existing = bookingByEmail[guestEmail];
      if (!existing || calendarEvent.getStartTime() > existing.getStartTime()) bookingByEmail[guestEmail] = calendarEvent;
    });
  });

  const newBookings = [];
  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const email = String(values[rowIndex][emailColumn] || '').toLowerCase();
    const calendarEvent = bookingByEmail[email];
    if (!calendarEvent) continue;
    const sameEvent = String(values[rowIndex][eventIdColumn] || '') === String(calendarEvent.getId());
    const alreadyBooked = String(values[rowIndex][statusColumn] || '') === 'Appointment booked';
    const previousStart = toDate_(values[rowIndex][appointmentColumn]);
    const timeChanged = !previousStart || previousStart.getTime() !== calendarEvent.getStartTime().getTime();
    if (!sameEvent || !alreadyBooked || timeChanged) {
      newBookings.push({
        name: values[rowIndex][nameColumn] || '',
        email: email,
        company: values[rowIndex][companyColumn] || '',
        focus: values[rowIndex][focusColumn] || '',
        startTime: calendarEvent.getStartTime()
      });
      values[rowIndex][statusColumn] = 'Appointment booked';
      values[rowIndex][appointmentColumn] = calendarEvent.getStartTime();
      values[rowIndex][eventIdColumn] = calendarEvent.getId();
      values[rowIndex][updatedColumn] = new Date();
    }
  }

  sheet.getRange(2, 1, values.length - 1, LEAD_HEADERS.length).setValues(values.slice(1));
  if (notificationEmail && properties.getProperty('BOOKING_NOTIFICATIONS') !== 'false') {
    newBookings.forEach(booking => sendBookingNotification_(notificationEmail, booking));
  }
  return newBookings.length;
}

function installAutomationTriggers() {
  const handlers = ['syncCalendarBookings', 'sendDailyAnalyticsReport', 'sendWeeklyAnalyticsReport'];
  ScriptApp.getProjectTriggers()
    .filter(trigger => handlers.indexOf(trigger.getHandlerFunction()) >= 0)
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('syncCalendarBookings').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('sendDailyAnalyticsReport').timeBased().everyDays(1).atHour(8).create();
  ScriptApp.newTrigger('sendWeeklyAnalyticsReport').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(9).create();
}

function installBookingSyncTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'syncCalendarBookings')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('syncCalendarBookings').timeBased().everyHours(1).create();
}

function sendDailyAnalyticsReport() {
  sendAnalyticsReport_(1, 'Daily', false, startOfToday_());
}

function sendWeeklyAnalyticsReport() {
  sendAnalyticsReport_(7, 'Weekly', false, startOfToday_());
}

function sendTestAnalyticsReport() {
  sendAnalyticsReport_(7, 'Test', true, new Date());
}

function sendAnalyticsReport_(days, label, forceSend, reportEnd) {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty('SPREADSHEET_ID');
  const reportEmail = properties.getProperty('REPORT_EMAIL') || properties.getProperty('NOTIFICATION_EMAIL');
  if (!spreadsheetId) throw new Error('Missing SPREADSHEET_ID script property.');
  if (!reportEmail) throw new Error('Missing REPORT_EMAIL or NOTIFICATION_EMAIL script property.');

  const end = reportEnd || startOfToday_();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const previousStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000);
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const current = collectReportData_(spreadsheet, start, end, properties);
  const previous = collectReportData_(spreadsheet, previousStart, start, properties);
  const hasActivity = current.pageViews || current.leads || current.schedulerOpens || current.assessmentClicks || current.assessmentsStarted;
  const sendEmptyReports = properties.getProperty('SEND_EMPTY_REPORTS') === 'true';
  if (!forceSend && !sendEmptyReports && !hasActivity) return;

  const range = formatDate_(start) + ' – ' + formatDate_(new Date(end.getTime() - 1));
  const subject = 'AKRD ' + label.toLowerCase() + ' site report — ' + range;
  MailApp.sendEmail({
    to: reportEmail,
    subject: subject,
    body: buildReportText_(label, range, current, previous, spreadsheet.getUrl()),
    htmlBody: buildReportHtml_(label, range, current, previous, spreadsheet.getUrl()),
    name: 'AK Randall Digital analytics'
  });
}

function collectReportData_(spreadsheet, start, end, properties) {
  const analyticsSheetName = properties.getProperty('ANALYTICS_SHEET_NAME') || 'Site Analytics';
  const leadSheetName = properties.getProperty('SHEET_NAME') || 'Website Leads';
  const result = {
    pageViews: 0,
    sessions: 0,
    schedulerOpens: 0,
    assessmentClicks: 0,
    formStarts: 0,
    formSuccesses: 0,
    assessmentsStarted: 0,
    assessmentsCompleted: 0,
    leads: 0,
    bookings: 0,
    topPages: [],
    topSources: [],
    topAssessmentCtas: [],
    devices: []
  };

  const analyticsSheet = spreadsheet.getSheetByName(analyticsSheetName);
  if (analyticsSheet && analyticsSheet.getLastRow() > 1) {
    const values = analyticsSheet.getDataRange().getValues();
    const header = values[0];
    const columns = indexColumns_(header);
    const sessions = {};
    const pages = {};
    const sources = {};
    const assessmentCtas = {};
    const devices = {};

    values.slice(1).forEach(row => {
      const timestamp = toDate_(row[columns.Timestamp]);
      if (!timestamp || timestamp < start || timestamp >= end) return;
      const eventName = String(row[columns['Event Name']] || '');
      const sessionId = String(row[columns['Session ID']] || '');
      if (sessionId) sessions[sessionId] = true;
      if (eventName === 'page_view') {
        result.pageViews += 1;
        increment_(pages, String(row[columns.Page] || '/'));
        const utmSource = String(row[columns['UTM Source']] || '');
        const utmMedium = String(row[columns['UTM Medium']] || '');
        const referrer = String(row[columns['Referrer Domain']] || '');
        const source = utmSource
          ? utmSource + (utmMedium ? ' / ' + utmMedium : '')
          : (referrer && referrer.indexOf('akrandall.com') < 0 ? referrer : 'Direct / untagged');
        increment_(sources, source);
        increment_(devices, String(row[columns.Device] || 'Unknown'));
      }
      if (eventName === 'scheduler_open') result.schedulerOpens += 1;
      if (eventName === 'assessment_open') {
        result.assessmentClicks += 1;
        increment_(assessmentCtas, String(row[columns.Label] || 'Unlabeled assessment link'));
      }
      if (eventName === 'form_start') result.formStarts += 1;
      if (eventName === 'form_success') result.formSuccesses += 1;
      if (eventName === 'assessment_start') result.assessmentsStarted += 1;
      if (eventName === 'assessment_complete') result.assessmentsCompleted += 1;
    });

    result.sessions = Object.keys(sessions).length;
    result.topPages = rankCounts_(pages, 5);
    result.topSources = rankCounts_(sources, 5);
    result.topAssessmentCtas = rankCounts_(assessmentCtas, 5);
    result.devices = rankCounts_(devices, 3);
  }

  const leadSheet = spreadsheet.getSheetByName(leadSheetName);
  if (leadSheet && leadSheet.getLastRow() > 1) {
    const values = leadSheet.getDataRange().getValues();
    const columns = indexColumns_(values[0]);
    values.slice(1).forEach(row => {
      const submitted = toDate_(row[columns.Timestamp]);
      if (submitted && submitted >= start && submitted < end) result.leads += 1;
      const updated = toDate_(row[columns['Last Updated']]);
      if (String(row[columns.Status] || '') === 'Appointment booked' && updated && updated >= start && updated < end) {
        result.bookings += 1;
      }
    });
  }

  return result;
}

function buildReportHtml_(label, range, current, previous, spreadsheetUrl) {
  const conversionRate = current.sessions ? ((current.leads / current.sessions) * 100).toFixed(1) + '%' : '—';
  const rows = [
    ['Visitors', current.sessions, comparison_(current.sessions, previous.sessions)],
    ['Page views', current.pageViews, comparison_(current.pageViews, previous.pageViews)],
    ['New leads', current.leads, comparison_(current.leads, previous.leads)],
    ['Bookings linked', current.bookings, comparison_(current.bookings, previous.bookings)],
    ['Visitor-to-lead rate', conversionRate, ''],
    ['Booking clicks', current.schedulerOpens, comparison_(current.schedulerOpens, previous.schedulerOpens)],
    ['Assessment clicks', current.assessmentClicks, comparison_(current.assessmentClicks, previous.assessmentClicks)],
    ['Assessments started', current.assessmentsStarted, comparison_(current.assessmentsStarted, previous.assessmentsStarted)],
    ['Assessments completed', current.assessmentsCompleted, comparison_(current.assessmentsCompleted, previous.assessmentsCompleted)],
    ['Forms started', current.formStarts, comparison_(current.formStarts, previous.formStarts)],
    ['Forms delivered', current.formSuccesses, comparison_(current.formSuccesses, previous.formSuccesses)]
  ];
  const metricRows = rows.map(row => '<tr><td style="padding:10px 12px;border-bottom:1px solid #dce3eb">' + escapeHtml_(row[0]) + '</td><td style="padding:10px 12px;border-bottom:1px solid #dce3eb;font-weight:700">' + escapeHtml_(row[1]) + '</td><td style="padding:10px 12px;border-bottom:1px solid #dce3eb;color:#536170">' + escapeHtml_(row[2]) + '</td></tr>').join('');

  return '<div style="background:#eef2f6;padding:24px;font-family:Arial,sans-serif;color:#06101d">' +
    '<div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #dce3eb">' +
    '<div style="padding:28px;background:#06101d;color:#ffffff"><p style="margin:0 0 8px;color:#72e6c1;font-size:12px;letter-spacing:1.5px;text-transform:uppercase">AK Randall Digital</p><h1 style="margin:0;font-size:28px">' + escapeHtml_(label) + ' site report</h1><p style="margin:10px 0 0;color:#c7d0da">' + escapeHtml_(range) + '</p></div>' +
    '<div style="padding:24px"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:10px 12px;background:#eef2f6">Signal</th><th style="text-align:left;padding:10px 12px;background:#eef2f6">Result</th><th style="text-align:left;padding:10px 12px;background:#eef2f6">vs. prior period</th></tr></thead><tbody>' + metricRows + '</tbody></table>' +
    rankedSection_('Top pages', current.topPages) + rankedSection_('Assessment entry points', current.topAssessmentCtas) + rankedSection_('Traffic sources', current.topSources) + rankedSection_('Devices', current.devices) +
    '<p style="margin:24px 0 0"><a style="display:inline-block;background:#2457ff;color:#ffffff;text-decoration:none;padding:12px 18px;font-weight:700" href="' + escapeHtml_(spreadsheetUrl) + '">Open the reporting sheet</a></p>' +
    '<p style="margin:20px 0 0;color:#66717e;font-size:12px;line-height:1.5">Analytics reports contain aggregate site activity. Lead contact details remain in the private Website Leads sheet and are not sent to Google Analytics.</p></div></div></div>';
}

function buildReportText_(label, range, current, previous, spreadsheetUrl) {
  const conversionRate = current.sessions ? ((current.leads / current.sessions) * 100).toFixed(1) + '%' : '—';
  return [
    'AK RANDALL DIGITAL — ' + label.toUpperCase() + ' SITE REPORT',
    range,
    '',
    'Visitors: ' + current.sessions + ' (' + comparison_(current.sessions, previous.sessions) + ')',
    'Page views: ' + current.pageViews + ' (' + comparison_(current.pageViews, previous.pageViews) + ')',
    'New leads: ' + current.leads + ' (' + comparison_(current.leads, previous.leads) + ')',
    'Bookings linked: ' + current.bookings + ' (' + comparison_(current.bookings, previous.bookings) + ')',
    'Visitor-to-lead rate: ' + conversionRate,
    'Booking clicks: ' + current.schedulerOpens,
    'Assessment clicks: ' + current.assessmentClicks,
    'Assessments: ' + current.assessmentsStarted + ' started / ' + current.assessmentsCompleted + ' completed',
    'Forms: ' + current.formStarts + ' started / ' + current.formSuccesses + ' delivered',
    '',
    'Top pages: ' + rankedText_(current.topPages),
    'Assessment entry points: ' + rankedText_(current.topAssessmentCtas),
    'Traffic sources: ' + rankedText_(current.topSources),
    'Devices: ' + rankedText_(current.devices),
    '',
    'Open reporting sheet: ' + spreadsheetUrl
  ].join('\n');
}

function sendOwnerNotification_(lead) {
  const subject = 'New AKRD website lead: ' + (lead.focus || 'Strategy inquiry');
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/' + lead.spreadsheetId + '/edit';
  const body = [
    'Lead ID: ' + lead.leadId,
    'Name: ' + lead.name,
    'Email: ' + lead.email,
    'Company: ' + (lead.company || 'Not provided'),
    'Focus: ' + (lead.focus || 'Not selected'),
    'Source: ' + (lead.sourcePage || 'Unknown'),
    '',
    lead.message,
    '',
    'Open lead sheet: ' + sheetUrl
  ].join('\n');
  const htmlBody = '<div style="font-family:Arial,sans-serif;color:#06101d;max-width:680px"><p style="color:#2457ff;font-weight:700;letter-spacing:1px">NEW AKRD WEBSITE LEAD</p>' +
    '<h2 style="margin:0 0 20px">' + escapeHtml_(lead.focus || 'Strategy inquiry') + '</h2>' +
    '<p><strong>Lead ID:</strong> ' + escapeHtml_(lead.leadId) + '<br><strong>Name:</strong> ' + escapeHtml_(lead.name) + '<br><strong>Email:</strong> <a href="mailto:' + escapeHtml_(lead.email) + '">' + escapeHtml_(lead.email) + '</a><br><strong>Company:</strong> ' + escapeHtml_(lead.company || 'Not provided') + '<br><strong>Source:</strong> ' + escapeHtml_(lead.sourcePage || 'Unknown') + '</p>' +
    '<div style="padding:18px;background:#eef2f6;white-space:pre-wrap;line-height:1.5">' + escapeHtml_(lead.message) + '</div>' +
    '<p><a href="' + escapeHtml_(sheetUrl) + '">Open the lead sheet</a></p></div>';
  MailApp.sendEmail({
    to: lead.to,
    subject: subject,
    body: body,
    htmlBody: htmlBody,
    replyTo: lead.email,
    name: 'AK Randall Digital website'
  });
}

function sendBookingNotification_(to, booking) {
  const subject = 'AKRD appointment linked: ' + (booking.name || booking.email);
  const when = Utilities.formatDate(booking.startTime, Session.getScriptTimeZone(), 'EEE, MMM d, yyyy h:mm a z');
  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: [
      'A website lead booked an intro call.',
      '',
      'Name: ' + (booking.name || 'Not provided'),
      'Email: ' + booking.email,
      'Company: ' + (booking.company || 'Not provided'),
      'Focus: ' + (booking.focus || 'Not selected'),
      'Appointment: ' + when
    ].join('\n'),
    name: 'AK Randall Digital website'
  });
}

function parsePayload_(event) {
  if (!event) return {};
  const type = String(event.postData && event.postData.type || '').toLowerCase();
  if (type.indexOf('application/json') >= 0) {
    try {
      return JSON.parse(event.postData.contents || '{}');
    } catch (error) {
      return {};
    }
  }
  return event.parameter || {};
}

function ensureHeadersFor_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return;
  }
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (current.join('|') !== headers.join('|')) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function isRateLimited_(email) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email)
    .map(byte => ('0' + (byte & 255).toString(16)).slice(-2))
    .join('')
    .slice(0, 24);
  const cache = CacheService.getScriptCache();
  const key = 'lead-' + digest;
  if (cache.get(key)) return true;
  cache.put(key, '1', 60);
  return false;
}

function isDuplicateEvent_(eventId) {
  return Boolean(CacheService.getScriptCache().get('event-' + hashKey_(eventId)));
}

function rememberEvent_(eventId) {
  CacheService.getScriptCache().put('event-' + hashKey_(eventId), '1', 21600);
}

function hashKey_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''))
    .map(byte => ('0' + (byte & 255).toString(16)).slice(-2))
    .join('')
    .slice(0, 32);
}

function indexColumns_(header) {
  const result = {};
  header.forEach((value, index) => { result[String(value)] = index; });
  return result;
}

function increment_(object, key) {
  object[key] = (object[key] || 0) + 1;
}

function rankCounts_(counts, limit) {
  return Object.keys(counts)
    .map(label => ({ label: label, count: counts[label] }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function rankedSection_(title, entries) {
  if (!entries.length) return '';
  const items = entries.map(entry => '<li style="margin:6px 0">' + escapeHtml_(entry.label) + ' — <strong>' + entry.count + '</strong></li>').join('');
  return '<h2 style="margin:26px 0 8px;font-size:18px">' + escapeHtml_(title) + '</h2><ol style="margin:0;padding-left:22px;color:#344251">' + items + '</ol>';
}

function rankedText_(entries) {
  return entries.length ? entries.map(entry => entry.label + ' (' + entry.count + ')').join(', ') : 'No activity';
}

function comparison_(current, previous) {
  if (!previous && !current) return 'no change';
  if (!previous) return 'new activity';
  const change = Math.round(((current - previous) / previous) * 100);
  if (!change) return 'no change';
  return (change > 0 ? '+' : '') + change + '%';
}

function startOfToday_() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM d, yyyy');
}

function cleanText_(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

function safeCell_(value) {
  const text = String(value || '');
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function escapeHtml_(value) {
  return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function isEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

function createLeadId_(date) {
  return 'AKRD-' + Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 9000 + 1000);
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
