// Syntax-check inline JS without installing dependencies or running the website.
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
  .filter(([, attrs]) => !/\bsrc\s*=/.test(attrs))
  .filter(([, attrs]) => !/\btype\s*=\s*["'](?:application\/json|application\/ld\+json|importmap)["']/i.test(attrs));
if (scripts.length === 0) throw new Error('No inline JavaScript found in index.html');
for (const [index, script] of scripts.entries()) {
  const attrs = script[1];
  const source = script[2];
  if (/\btype\s*=\s*["']module["']/i.test(attrs)) {
    new vm.SourceTextModule(source, { identifier: `inline-script-${index + 1}` });
  } else {
    new vm.Script(source, { filename: `index.html:inline-script-${index + 1}` });
  }
}
console.log(`Checked ${scripts.length} inline script(s)`);
