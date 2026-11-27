import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createState, step, buildItems, shareText, getService } from '../public/js/dialog.js';

const data = JSON.parse(fs.readFileSync(new URL('../public/data/services.json', import.meta.url), 'utf8'));

function talk(lang, lines) {
  let state = createState(lang);
  let last = null;
  for (const line of lines) {
    last = step(state, line, data);
    state = last.state;
  }
  return { state, last };
}

test('every document a service lists exists, with a label in all three languages', () => {
  for (const service of data.services) {
    for (const id of service.documents) {
      const doc = data.documents[id];
      assert.ok(doc, `${service.id} lists unknown document ${id}`);
      for (const lang of ['en', 'kn', 'hi']) assert.ok(doc.label[lang], `${id} has no ${lang} label`);
    }
    for (const lang of ['en', 'kn', 'hi']) assert.ok(service.name[lang], `${service.id} has no ${lang} name`);
    assert.ok(data.sources[service.source.ref], `${service.id} has no source`);
  }
});

test('pension: one question, then the list, then the summary', () => {
  const { state, last } = talk('en', [
    'My mother is 62 and wants the old-age pension in Mandya',
    'yes',
    ...Array(10).fill('yes'),
  ]);
  assert.equal(state.stage, 'done');
  assert.equal(state.items.length, 10);
  assert.ok(last.say.join(' ').includes('You have 10 of 10'));
  assert.ok(last.say.join(' ').includes('In Mandya district'));
});

test('pension: too young is told the official rule and gets no list', () => {
  const { state, last } = talk('en', ['pension for my father, he is 55']);
  assert.equal(state.stage, 'start');
  assert.match(last.say[0], /above 60/);
});

test('pension: a man is not asked for a husband’s death certificate', () => {
  const pension = getService(data, 'old_age_pension');
  const forMother = buildItems(pension, { relation: 'mother' }, data).map((i) => i.id);
  const forFather = buildItems(pension, { relation: 'father' }, data).map((i) => i.id);
  assert.ok(forMother.includes('husband_death_cert'));
  assert.ok(!forFather.includes('husband_death_cert'));
});

test('pension at 65 or more also mentions Sandhya Suraksha', () => {
  const { last } = talk('kn', ['ಅಮ್ಮನಿಗೆ 68 ವರ್ಷ, ವೃದ್ಧಾಪ್ಯ ವೇತನ ಬೇಕು', 'ಇದೆ']);
  assert.ok(last.say.join(' ').includes('ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ'));
});

test('a missing income certificate points to the income certificate service', () => {
  const { state, last } = talk('en', [
    'old age pension for my mother, she is 70', 'yes',
    'yes', 'yes', 'yes', 'yes', 'yes', 'yes', 'no',
  ]);
  assert.match(last.say.join(' '), /income certificate at the Nadakacheri/);
  const income = state.items.find((i) => i.id === 'income_cert');
  assert.equal(income.status, 'missing');
});

test('income certificate in a village skips the urban-only bank statement', () => {
  const { state } = talk('en', ['income certificate', 'village']);
  assert.equal(state.stage, 'checklist');
  assert.ok(!state.items.some((i) => i.id === 'bank_statement'));
});

test('caste certificate with no old proof asks for the family tree instead', () => {
  const { state } = talk('hi', ['मुझे जाति प्रमाण पत्र चाहिए', 'नहीं', 'गाँव']);
  const ids = state.items.map((i) => i.id);
  assert.ok(ids.includes('family_tree'));
  assert.ok(!ids.includes('old_caste_cert'));
  assert.ok(!ids.includes('self_declaration_ri'));
});

test('repeat, back and next move through the list', () => {
  let { state } = talk('kn', ['ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ', 'ನಗರ']);
  assert.equal(state.index, 0);
  state = step(state, 'ಮುಂದೆ', data).state;
  assert.equal(state.index, 1);
  state = step(state, 'ಹಿಂದೆ', data).state;
  assert.equal(state.index, 0);
  state = step(state, 'ಮತ್ತೊಮ್ಮೆ', data).state;
  assert.equal(state.index, 0);
});

test('an unclear answer asks again instead of guessing', () => {
  const { state, last } = talk('en', ['income certificate', 'banana']);
  assert.equal(state.stage, 'ask');
  assert.match(last.say[0], /city or village/);
});

test('a service it does not know gets an honest answer', () => {
  const { last } = talk('en', ['how to get a driving licence']);
  assert.match(last.say[0], /these services/);
  assert.match(last.say[0], /Disability pension/);
});

test('restart and share', () => {
  const done = talk('en', ['income certificate', 'city', ...Array(6).fill('yes')]);
  assert.equal(done.state.stage, 'done');
  const shared = step(done.state, 'send', data);
  assert.equal(shared.share, true);
  const text = shareText(done.state, data);
  assert.ok(text.includes('✅'));
  assert.ok(text.includes('sevasindhu.karnataka.gov.in'));
  const fresh = step(done.state, 'start over', data);
  assert.equal(fresh.state.stage, 'start');
});

test('disability pension: asks about 40 percent and BPL, and flags the certificate as not official', () => {
  const { state, last } = talk('en', ['my son is blind and needs a pension', 'yes', 'yes']);
  assert.equal(state.service, 'disability_pension');
  assert.equal(state.stage, 'checklist');
  assert.equal(state.items[0].id, 'disability_cert');
  assert.equal(state.items[0].condition, 'notOfficial');
  assert.match(last.say.join(' '), /Not in the official list/);
});

test('disability pension below 40 percent warns but still gives the list', () => {
  const { state, last } = talk('kn', ['ನನ್ನ ಮಗನಿಗೆ ಅಂಗವಿಕಲ ಪಿಂಚಣಿ ಬೇಕು', 'ಇಲ್ಲ', 'ಇದೆ']);
  assert.equal(state.stage, 'checklist');
  assert.ok(last.say.join(' ').includes('ಶೇಕಡಾ 40'));
});

test('a UDID card request gets an honest "not yet"', () => {
  const { state, last } = talk('en', ['how do I get a UDID card for my daughter']);
  assert.equal(state.stage, 'start');
  assert.match(last.say[0], /UDID/);
});

test('widow pension needs no question and always lists the husband’s death certificate', () => {
  const { state } = talk('hi', ['मेरी माँ विधवा हैं, पेंशन चाहिए']);
  assert.equal(state.service, 'widow_pension');
  assert.equal(state.stage, 'checklist');
  const death = state.items.find((i) => i.id === 'husband_death_cert');
  assert.equal(death.condition, null);
});

test('residence certificate in a village drops the passport and rental agreement', () => {
  const rural = talk('en', ['residence certificate', 'village']).state.items.map((i) => i.id);
  const urban = talk('en', ['residence certificate', 'city']).state.items.map((i) => i.id);
  assert.ok(!rural.includes('passport') && !rural.includes('rental_agreement'));
  assert.ok(urban.includes('passport') && urban.includes('rental_agreement'));
});

test('a missing residence certificate in a pension list points to that service', () => {
  const { last } = talk('en', ['old age pension for my father, he is 70', 'yes', 'yes', 'yes', 'yes', 'yes', 'no']);
  assert.match(last.say.join(' '), /residence certificate at the Nadakacheri/);
});

test('no BPL card: says the 2026 income limit changed and to confirm at the counter', () => {
  const { last } = talk('en', ['old age pension for my mother, she is 66', 'no']);
  assert.match(last.say.join(' '), /1\.20 lakh/);
  assert.match(last.say.join(' '), /confirm at the counter/);
});
