import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicPages = [
  'index.html',
  'services.html',
  'work.html',
  'case-story-redeemer.html',
  'case-story-business-command-center.html',
  'resources.html',
  'tools.html',
  'government-contracting-readiness.html',
  'ai-workflow-readiness.html',
  'website-build-readiness.html',
  'about.html',
  'assessment.html',
  'connect.html',
  'privacy.html'
];
const expectedNav = [
  ['services.html', 'Services'],
  ['work.html', 'Proof'],
  ['resources.html', 'Resources'],
  ['tools.html', 'Tools'],
  ['about.html', 'About'],
  ['assessment.html', 'Free assessment'],
  ['connect.html', 'Connect']
];
const errors = [];

for (const file of publicPages) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`${file}: missing`);
    continue;
  }
  const html = fs.readFileSync(fullPath, 'utf8');

  const stylesheet = html.match(/<link rel="stylesheet" href="(styles\.min\.css\?v=[^"]+)">/);
  if (!stylesheet || stylesheet[1] !== 'styles.min.css?v=20260729d') {
    errors.push(`${file}: expected styles.min.css?v=20260729d`);
  }

  for (const asset of ['lead-config.js?v=20260729d', 'analytics.js?v=20260729d', 'script.js?v=20260729d']) {
    if (!html.includes(asset)) errors.push(`${file}: missing ${asset}`);
  }

  const nav = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  const navLinks = [...nav.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
    .filter(match => !match[0].includes('nav-cta'))
    .map(match => [match[1], match[2].trim()]);
  expectedNav.forEach((expected, index) => {
    const actual = navLinks[index];
    if (!actual || actual[0] !== expected[0] || actual[1] !== expected[1]) {
      errors.push(`${file}: navigation item ${index + 1} should be ${expected[1]}`);
    }
  });

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`${file}: duplicate IDs ${[...new Set(duplicateIds)].join(', ')}`);

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1].split(/[?#]/)[0];
    if (!target || /^(?:https?:|mailto:|tel:|data:|#)/.test(target)) continue;
    if (!fs.existsSync(path.resolve(root, target))) errors.push(`${file}: missing local target ${target}`);
  }
}

for (const required of [
  'styles.css',
  'styles.min.css',
  'assets/data/site-metrics.js',
  'integrations/google-apps-script/Code.gs'
]) {
  if (!fs.existsSync(path.join(root, required))) errors.push(`missing required file ${required}`);
}

const work = fs.readFileSync(path.join(root, 'work.html'), 'utf8');
for (const metric of ['confirmedCustomerProjectValue', 'confirmedPublicRecordValue', 'evaluatedOpportunityValue']) {
  if (!work.includes(`data-proof-metric="${metric}"`)) errors.push(`work.html: missing canonical metric ${metric}`);
}
if (!work.includes('not revenue, an award total')) {
  errors.push('work.html: evaluated opportunity disclaimer is missing');
}

if (errors.length) {
  console.error(`Deploy check failed with ${errors.length} issue(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Deploy check passed for ${publicPages.length} public pages.`);
