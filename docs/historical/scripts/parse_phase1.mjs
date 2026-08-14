import fs from 'fs';

const phase1Rules = new Set([
  'no-fetch-in-effect',
  'react-hooks/exhaustive-deps',
  'exhaustive-deps', 
  'no-derived-state',
  'no-derived-useState',
  'rerender-lazy-state-init',
  'rerender-state-only-in-handlers',
  'no-chain-state-updates',
  'no-uncontrolled-input',
  'nextjs-no-use-search-params-without-suspense',
  'no-react19-deprecated-apis',
]);

let raw = fs.readFileSync('react-doctor-output.json');
let text = raw.toString('utf16le');
if (text.charCodeAt(0) === 0xfeff) {
  text = text.slice(1);
}

const data = JSON.parse(text);

const filtered = data.diagnostics.filter(d => phase1Rules.has(d.rule));

const grouped = {};
for (const d of filtered) {
  if (!grouped[d.rule]) grouped[d.rule] = [];
  grouped[d.rule].push(`${d.filePath}:${d.line} - ${d.message}`);
}

for (const rule in grouped) {
  console.log(`\n### ${rule} (${grouped[rule].length} issues)`);
  for (const item of grouped[rule]) {
    console.log(item);
  }
}
