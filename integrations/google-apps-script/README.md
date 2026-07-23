# First-party analytics, lead notifications, and emailed reports

The site code is already wired. The private Google Sheet and emailed digest are the reporting source of truth. Complete the account-level steps below once to activate private reporting, immediate lead alerts, Calendar matching, and scheduled email summaries. GA4 remains an optional second view.

## 1. Optional: connect Google Analytics 4

The deployed site keeps `analyticsEnabled: false` and a blank Measurement ID until a verified GA4 stream exists. The first-party reporting loop works without GA4.

1. In Google Analytics, create or open the AK Randall Digital GA4 property.
2. Create a **Web** data stream for `https://akrandall.com`.
3. Copy the stream's Measurement ID in the format `G-XXXXXXXXXX`.
4. Paste it into `analyticsMeasurementId` in the site-root `lead-config.js` file and set `analyticsEnabled` to `true`.
5. In **Admin → Data streams → Web → Enhanced measurement**, leave page views and the other useful automatic measurements enabled, but turn off **Form interactions**. The site sends its own `form_start` and `form_submit` events, so leaving both on would double count them.
6. After the site is deployed, open it in a private browser window and confirm your visit appears in **Reports → Realtime**.
7. Mark `generate_lead` as a GA4 key event. It fires only for a delivered inquiry or completed assessment, while booking clicks remain a separate intent signal.

The site strips URL query parameters from the page location sent to GA4 and never sends names, email addresses, phone numbers, company names, messages, or detailed assessment summaries to Analytics.

Do not install a second Google tag or Google Tag Manager container unless the direct GA4 integration in `lead-config.js` is disabled; using both can duplicate events.

## 2. Connect Google Sheets, Calendar, and email

1. Create a Google Sheet for website leads and copy the spreadsheet ID from its URL.
2. Open **Extensions → Apps Script** from that Sheet.
3. Replace the default script with the contents of `Code.gs` in this folder.
4. In **Project Settings**, set the project time zone to **America/New_York**.
5. In **Project Settings → Script properties**, add:
   - `SPREADSHEET_ID`: the spreadsheet ID
   - `SHEET_NAME`: `Website Leads`
   - `ANALYTICS_SHEET_NAME`: `Site Analytics`
   - `NOTIFICATION_EMAIL`: `andrew@akrandall.com`
   - `REPORT_EMAIL`: `andrew@akrandall.com`
   - `CALENDAR_ID`: optional; omit it to use the default calendar
   - `BOOKING_NOTIFICATIONS`: `true`
   - `SEND_EMPTY_REPORTS`: `false`
6. Run `installAutomationTriggers` once and approve the requested Sheets, Calendar, and email permissions. This installs:
   - hourly Calendar-to-lead matching;
   - a daily report for the previous completed day, sent around 8:00 a.m.;
   - a weekly seven-day report, sent Monday around 9:00 a.m.
7. Choose **Deploy → New deployment → Web app**.
8. Set **Execute as** to yourself and access to **Anyone**.
9. Copy the deployed URL ending in `/exec` and paste it into `appsScriptUrl` in the site-root `lead-config.js` file.

The public `/exec` URL accepts only an allowlist of analytics events. Analytics rows contain pseudonymous session IDs and broad page/campaign/action data, not contact details or form contents. Lead intake allows four submissions per email address per hour, with a 60-second burst guard.

The lead sheet includes capture source plus assessment industry, A/B variant, and completion status. The analytics sheet includes the assessment variant and furthest step reached so you can compare completion quality—not just clicks.

## 3. Verify the full reporting loop

1. Visit several pages, click assessment buttons from different locations, scroll past 50%, open the booking panel, and start the assessment. Confirm a `Site Analytics` tab is created and receives rows.
2. Submit one standard inquiry, one home-page email-only inquiry, and one completed assessment. Confirm each creates a `Website Leads` row and sends an immediate notification email.
3. In Apps Script, run `sendTestAnalyticsReport`. Confirm the branded seven-day summary arrives at `REPORT_EMAIL`.
4. Book a test appointment using the same email as a test lead, run `syncCalendarBookings`, and confirm the lead becomes **Appointment booked** and a booking-linked notification is sent.
5. In the `Site Analytics` sheet, confirm `assessment_step`, `assessment_complete`, the assessment variant, and the reached step are recorded. If GA4 is enabled, also confirm the conversion events in Realtime. The emailed reports rank the assessment entry points so you can see which CTA placements are earning clicks.

After changing `Code.gs`, update the existing Apps Script deployment to a new version. After changing either ID in `lead-config.js`, redeploy the website.

Never place spreadsheet IDs, OAuth tokens, passwords, or other private credentials in browser-facing JavaScript. Only the GA4 Measurement ID and public Apps Script `/exec` URL belong in `lead-config.js`.
