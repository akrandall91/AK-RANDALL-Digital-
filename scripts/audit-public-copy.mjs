import fs from 'node:fs';
import path from 'node:path';

const publicPages = [
  'index.html',
  'services.html',
  'work.html',
  'case-story-redeemer.html',
  'case-story-business-command-center.html',
  'case-story-sep-tracker.html',
  'case-story-lighting-engine.html',
  'resources.html',
  'tools.html',
  'government-contracting-readiness.html',
  'ai-workflow-readiness.html',
  'website-build-readiness.html',
  'about.html',
  'assessment.html',
  'connect.html',
  'privacy.html',
  'assessment-tool.html',
  'government-contracting-readiness-tool.html',
  'ai-workflow-readiness-tool.html',
  'website-build-readiness-tool.html'
];

const forbidden = [
  { label: 'placeholder copy', pattern: /\b(?:lorem ipsum|tbd|coming soon)\b/i },
  { label: 'template instruction', pattern: /\[(?:insert|add\s|replace|client name|company name)[^\]]*\]/i },
  { label: 'encoding corruption', pattern: /(?:Ãƒ|Ã‚|Ã¢â‚¬|Ã¢â‚¬â„¢|Ã¢â‚¬Å“|Ã¢â‚¬Â|Ã¢â‚¬â€œ|Ã¢â‚¬â€|â€”Â|â€Â|ï¿½)/ },
  {
    label: 'developer-facing phrase',
    pattern: /\b(?:working product architecture|implementation concept|customer-facing capability catalog|production implementation|production environment|scoped conversation|automation brief|minimum-readiness gate|crm architecture)\b/i
  }
];

const decode = text => text
  .replaceAll('&amp;', '&')
  .replaceAll('&mdash;', '\u2014')
  .replaceAll('&ndash;', '\u2013')
  .replaceAll('&middot;', '\u00b7')
  .replaceAll('&nearr;', '\u2197')
  .replaceAll('&rarr;', '\u2192')
  .replaceAll('&copy;', '\u00a9')
  .replaceAll('&ldquo;', '\u201c')
  .replaceAll('&rdquo;', '\u201d')
  .replaceAll('&#8599;', '\u2197')
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&[a-z]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const errors = [];
const dump = process.argv.includes('--dump');
const requestedPage = process.argv.find(argument => argument.startsWith('--page='))?.slice(7);
const pagesToAudit = requestedPage ? publicPages.filter(file => file === requestedPage) : publicPages;

for (const file of pagesToAudit) {
  const html = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  for (const rule of forbidden) {
    const match = html.match(rule.pattern);
    if (match) errors.push(`${file}: ${rule.label} "${match[0]}"`);
  }

  if (!dump) continue;
  const safeHtml = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<header\b[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ');
  const snippets = [];
  for (const match of safeHtml.matchAll(/<(?:title|h1|h2|h3|p|li|blockquote|dt|dd|button|a)\b[^>]*>([\s\S]*?)<\/(?:title|h1|h2|h3|p|li|blockquote|dt|dd|button|a)>/gi)) {
    const text = decode(match[1].replace(/<[^>]+>/g, ' '));
    if (text && !snippets.includes(text)) snippets.push(text);
  }
  console.log(`\n=== ${file} ===`);
  snippets.forEach(text => console.log(`- ${text}`));
}

if (errors.length) {
  console.error(`\nCopy audit failed with ${errors.length} issue(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else if (!dump) {
  console.log(`Copy audit passed for ${pagesToAudit.length} public page${pagesToAudit.length === 1 ? '' : 's'}.`);
}
