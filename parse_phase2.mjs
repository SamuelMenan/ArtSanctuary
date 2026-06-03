import fs from 'fs';

const phase2Rules = new Set([
  'control-has-associated-label',
  'prefer-tag-over-role',
  'click-events-have-key-events',
  'no-static-element-interactions',
  'no-noninteractive-element-interactions',
]);

let raw = fs.readFileSync('react-doctor-output.json');
let text = raw.toString('utf16le');
if (text.charCodeAt(0) === 0xfeff) {
  text = text.slice(1);
}

const data = JSON.parse(text);

const filtered = data.diagnostics.filter(d => phase2Rules.has(d.rule));

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
