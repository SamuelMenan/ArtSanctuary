const fs = require('fs');
const rules = new Set(['jsx-self-closing', 'jsx-boolean-value', 'no-useless-fragment', 'import-spacing', 'no-unused-vars', 'prefer-const', 'jsx-curly-brace-presence']);
const data = JSON.parse(fs.readFileSync('react_doctor_out.json', 'utf8').replace(/^\uFEFF/, ''));
const res = data.diagnostics.filter(d => rules.has(d.rule)).map(d => `${d.rule} -> ${d.filePath}:${d.line}`);
fs.writeFileSync('phase5_issues.txt', res.join('\n'));
console.log('Found ' + res.length + ' Phase 5 issues.');
