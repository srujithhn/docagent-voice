import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  detectLanguageSwitch, normalize, extractAge, detectYesNo, detectCommand, detectArea, detectRelation, detectService,
} from '../public/js/nlu.js';
import { score } from '../scripts/eval.js';

const cases = JSON.parse(fs.readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));

test('every phrase in the eval set is understood', () => {
  const { failures } = score(cases);
  assert.deepEqual(failures, []);
});

test('Kannada and Hindi digits become numbers', () => {
  assert.equal(normalize('೬೨ ವರ್ಷ'), '62 ವರ್ಷ');
  assert.equal(normalize('उम्र ६८'), 'उम्र 68');
  assert.equal(extractAge('ವಯಸ್ಸು ೬೨'), 62);
});

test('age ignores money and days', () => {
  assert.equal(extractAge('she earns 20,000 rupees'), null);
  assert.equal(extractAge('it took 15 days'), null);
  assert.equal(extractAge('she is 15 days late but 64 years old'), 64);
});

test('age in words', () => {
  assert.equal(extractAge('ಅರವತ್ತೆಂಟು'), 68);
  assert.equal(extractAge('पैंसठ साल'), 65);
  assert.equal(extractAge('seventy two'), 72);
});

test('yes and no in three languages, and no wins over yes', () => {
  for (const yes of ['yes', 'I have it', 'ಇದೆ', 'ಹೌದು', 'हाँ', 'है']) assert.equal(detectYesNo(yes), true, yes);
  for (const no of ['no', "Don't have it", 'ಇಲ್ಲ', 'नहीं', 'नहीं है', 'she does not have it']) assert.equal(detectYesNo(no), false, no);
  assert.equal(detectYesNo('ಇಲ್ಲಿ'), null, '"ಇಲ್ಲಿ" (here) is not "ಇಲ್ಲ" (no)');
});

test('commands', () => {
  assert.equal(detectCommand('ಮುಂದೆ'), 'next');
  assert.equal(detectCommand('ಮತ್ತೊಮ್ಮೆ'), 'repeat');
  assert.equal(detectCommand('ಮತ್ತೆ ಶುರು ಮಾಡಿ'), 'restart');
  assert.equal(detectCommand('फिर से शुरू करो'), 'restart');
  assert.equal(detectCommand('फिर से'), 'repeat');
  assert.equal(detectCommand('send it on whatsapp'), 'share');
  assert.equal(detectCommand('go back'), 'back');
});

test('Hindi "माँ" does not match the district Mandya', () => {
  assert.equal(detectRelation('मैं मांड्या से हूँ'), 'self');
  assert.equal(detectRelation('मेरी मां को पेंशन चाहिए'), 'mother');
});

test('short English words match whole words only', () => {
  assert.equal(detectRelation('at this moment'), null);
  assert.equal(detectArea('electricity bill'), null);
});

test('Hindi "आयु" (age) is not "आय" (income)', () => {
  assert.equal(detectService('आयु प्रमाण पत्र').service, null);
  assert.equal(detectService('आय प्रमाण पत्र').service, 'income_certificate');
});

test('switching language by voice, only for short requests', () => {
  assert.equal(detectLanguageSwitch('English'), 'en');
  assert.equal(detectLanguageSwitch('ಕನ್ನಡದಲ್ಲಿ ಹೇಳಿ'), 'kn');
  assert.equal(detectLanguageSwitch('हिंदी में बोलो'), 'hi');
  assert.equal(detectLanguageSwitch('my mother speaks only kannada and wants the old age pension'), null);
  assert.equal(detectLanguageSwitch('yes'), null);
});

test('voice text: money, big numbers and brackets read naturally', async () => {
  const { forSpeech } = await import('../public/js/i18n.js');
  assert.equal(forSpeech('Fee: ₹40 (online free).', 'en'), 'Fee, 40 rupees, online free.');
  assert.ok(forSpeech('₹1.20 ಲಕ್ಷ', 'kn').includes('ಒಂದು ಲಕ್ಷ ಇಪ್ಪತ್ತು ಸಾವಿರ'));
  assert.equal(forSpeech('I’ll read it', 'en'), "I'll read it");
});

test('phone numbers are read digit by digit, in each language', async () => {
  const { forSpeech } = await import('../public/js/i18n.js');
  assert.equal(forSpeech('Call 1902.', 'en'), 'Call one nine zero two.');
  assert.ok(forSpeech('080-44554455', 'kn').startsWith('ಸೊನ್ನೆ ಎಂಟು ಸೊನ್ನೆ'));
});

test('a misheard short answer still counts, but only on its own', async () => {
  const { detectYesNo } = await import('../public/js/nlu.js');
  assert.equal(detectYesNo('know'), false);
  assert.equal(detectYesNo('S'), true);
  assert.equal(detectYesNo('I have it now'), true);
});
