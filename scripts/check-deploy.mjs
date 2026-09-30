import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicPages = [
  'index.html',
  'services.html',
  'review-kit.html',
  'work.html',
  'case-story-redeemer.html',
  'case-story-business-command-center.html',
  'about.html',
  'contact.html',
  'privacy.html'
];
const expectedNav = [
  ['services.html', 'Services'],
  ['work.html', 'Work'],
  ['about.html', 'About']
];
const version = '20260930a';
const errors = [];

for (const file of publicPages) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`${file}: missing`);
    continue;
  }
  const html = fs.readFileSync(fullPath, 'utf8');

  for (const asset of [`akrd.css?v=${version}`, `lead-config.js?v=${version}`, `analytics.js?v=${version}`, `site.js?v=${version}`]) {
    if (!html.includes(asset)) errors.push(`${file}: missing ${asset}`);
  }

  const nav = html.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0] || '';
  const navLinks = [...nav.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
    .filter(match => !match[0].includes('class="button"'))
    .map(match => [match[1], match[2].trim()]);
  expectedNav.forEach((expected, index) => {
    const actual = navLinks[index];
    if (!actual || actual[0] !== expected[0] || actual[1] !== expected[1]) {
      errors.push(`${file}: navigation item ${index + 1} should be ${expected[1]}`);
    }
  });
  if (!nav.includes('contact.html#schedule')) errors.push(`${file}: missing Book a free call button`);

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`${file}: duplicate IDs ${[...new Set(duplicateIds)].join(', ')}`);

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1].split(/[?#]/)[0];
    if (!target || /^(?:https?:|mailto:|tel:|data:|#)/.test(target)) continue;
    if (!fs.existsSync(path.resolve(root, target))) errors.push(`${file}: missing local target ${target}`);
  }
}

for (const required of ['akrd.css', 'site.js', 'lead-config.js', 'analytics.js', 'integrations/google-apps-script/Code.gs']) {
  if (!fs.existsSync(path.join(root, required))) errors.push(`missing required file ${required}`);
}

if (errors.length) {
  console.error(`Deploy check failed with ${errors.length} issue(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Deploy check passed for ${publicPages.length} public pages.`);
