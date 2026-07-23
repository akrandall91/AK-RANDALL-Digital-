# AK Randall Digital

Static GitHub Pages site for AK Randall Digital, plus a separate owner-only business console workflow.

## Public site

Run:

```powershell
npm install
npm run build
```

`npm run build` minifies `styles.css` into the versioned `styles.min.css` used by every public page, then checks navigation order, duplicate IDs, local file references, script versions, and the canonical proof metrics.

The public site sends lead and first-party analytics records to the deployed Google Apps Script endpoint in `lead-config.js`. First-party Google Sheet reporting and emailed digests are the reporting source of truth. GA4 is intentionally disabled until a verified Measurement ID is added.

Account setup and redeployment steps are in `integrations/google-apps-script/README.md`.

## Proof metric definitions

- `$7.5M+`: total confirmed customer project value supported by accepted or fulfilled work.
- `$5.75M`: public-record subset of that confirmed-project total.
- `$31.5M`: evaluated opportunity value; not revenue, awarded value, or part of the confirmed-project total.

The display values and definitions live in `assets/data/site-metrics.js`.

## Owner-only business console

The quote, roadmap, lead, project, invoice, and reporting console is deliberately excluded from the public GitHub Pages build through `private-tools/` in `.gitignore`.

The public Apps Script remains anonymous and write-only. The separate owner-only Apps Script reads the private lead Sheet into the console, where a lead can become a scoped quote, delivery roadmap, project, and invoice. Deploy that console as **User accessing the web app** with access set to **Only myself**.
