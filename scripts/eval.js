// Scores the understanding step on test/cases.json and prints a table:
// how often it got the service, the age, who it is for, city/village and
// the district right, per language. Run: npm run eval

import fs from 'node:fs';
import { understand } from '../public/js/nlu.js';

const cases = JSON.parse(fs.readFileSync(new URL('../test/cases.json', import.meta.url), 'utf8'));
const FIELDS = ['service', 'age', 'relation', 'area', 'district', 'scholarship'];

export function score(list) {
  const rows = {};
  const failures = [];
  for (const c of list) {
    const u = understand(c.text);
    const got = { ...u, district: u.district ? u.district.en : null };
    const row = (rows[c.lang] ||= { cases: 0, checks: 0, correct: 0 });
    row.cases += 1;
    for (const field of FIELDS) {
      if (!(field in c)) continue;
      row.checks += 1;
      if (got[field] === c[field]) row.correct += 1;
      else failures.push({ lang: c.lang, text: c.text, field, expected: c[field], got: got[field] });
    }
  }
  return { rows, failures };
}

if (process.argv[1] && process.argv[1].endsWith('eval.js')) {
  const { rows, failures } = score(cases);
  let checks = 0;
  let correct = 0;
  console.log('Language  Cases  Checks  Correct  Accuracy');
  for (const [lang, r] of Object.entries(rows)) {
    checks += r.checks;
    correct += r.correct;
    console.log(`${lang.padEnd(8)}  ${String(r.cases).padStart(5)}  ${String(r.checks).padStart(6)}  ${String(r.correct).padStart(7)}  ${((100 * r.correct) / r.checks).toFixed(1).padStart(7)}%`);
  }
  console.log(`${'all'.padEnd(8)}  ${String(cases.length).padStart(5)}  ${String(checks).padStart(6)}  ${String(correct).padStart(7)}  ${((100 * correct) / checks).toFixed(1).padStart(7)}%`);
  if (failures.length) {
    console.log('\nMisses:');
    for (const f of failures) console.log(`- [${f.lang}] ${f.field}: expected ${JSON.stringify(f.expected)}, got ${JSON.stringify(f.got)}  ← "${f.text}"`);
  }
}
