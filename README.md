# AK Randall Digital

Static GitHub Pages site for AK Randall Digital (AKRD): websites, Google review systems, automation and smart-tech setup for small businesses across North Carolina. Physical products live on the separate ARXI Systems site (arxisystems.com).

## Public site

Pages: `index.html`, `services.html`, `review-kit.html`, `work.html`, two case studies, `about.html`, `contact.html`, `privacy.html`. Styles are in `akrd.css`; page behavior (menu, booking calendar, contact form) is in `site.js`.

Retired pages (tools, resources, assessment, readiness tools, Print Lab, Memory Light, Mini Tap, old case studies) are kept as small redirect pages so old links still land somewhere useful.

Run the checks before publishing:

```powershell
npm install
npm run build
```

The contact form sends to the Google Apps Script endpoint in `lead-config.js`. Setup steps are in `integrations/google-apps-script/README.md`. To sell the Google Review Kit with a Square payment link, paste the links into `reviewKitCheckout` in `lead-config.js`.

## Owner-only business console

The quote, roadmap, lead, project, invoice, and reporting console is deliberately excluded from the public GitHub Pages build through `private-tools/` in `.gitignore`.

The public Apps Script remains anonymous and write-only. The separate owner-only Apps Script reads the private lead Sheet into the console, where a lead can become a scoped quote, delivery roadmap, project, and invoice. Deploy that console as **User accessing the web app** with access set to **Only myself**.
