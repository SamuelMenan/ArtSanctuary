const fs = require('fs');
const rules = new Set(['nextjs-no-img-element', 'js-flatmap-filter', 'js-hoist-intl', 'js-tosorted-immutable', 'server-hoist-static-io', 'prefer-module-scope-static-value', 'no-dynamic-import-path']);
const data = JSON.parse(fs.readFileSync('react_doctor_out.json', 'utf8').replace(/^\uFEFF/, ''));
const res = data.diagnostics.filter(d => rules.has(d.rule)).map(d => `${d.rule} -> ${d.filePath}:${d.line}`);
fs.writeFileSync('phase4_issues.txt', res.join('\n'));
console.log('Found ' + res.length + ' Phase 4 issues.');
