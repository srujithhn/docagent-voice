// The conversation: one question back at most, then the checklist read
// one item at a time, then where to go, the fee and the source.
// step() is a pure function: (state, what the person said) -> new state and
// what to say. The screen and the voice layer only render its result.

import {
  understand, extractAge, detectYesNo, detectArea, detectBpl, detectCommand,
  detectService, detectDocument,
} from './nlu.js';
import { tr, whoPhrase, formatDate, knNumber, knOrdinal } from './i18n.js';

export function createState(lang = 'kn') {
  return {
    lang,
    stage: 'start', // start | ask | checklist | done
    service: null,
    slots: {}, // relation, age, bpl, area, casteProof, district
    pending: null, // the question we are waiting on
    items: [],
    index: 0,
    notes: [],
    lastSay: '',
  };
}

const clone = (s) => JSON.parse(JSON.stringify(s));

// "the Income certificate" reads oddly mid-sentence in English.
const mid = (lang, text) => (lang === 'en' ? text.charAt(0).toLowerCase() + text.slice(1) : text);

// The services offered on the first screen (Sandhya Suraksha is reached by name or by age).
export function menuServices(data) {
  return data.services.filter((s) => s.id !== 'sandhya_suraksha').map((s) => s.id);
}

export function getService(data, id) {
  return data.services.find((s) => s.id === id) || null;
}

function isSelf(state) {
  return state.slots.relation === 'self';
}

function ask(state, key) {
  const self = isSelf(state) || (!state.slots.relation && getService(state.data, state.service)?.kind === 'certificate');
  return tr(state.lang, `${key}_${self ? 'self' : 'other'}`, { who: whoPhrase(state.slots.relation) });
}

const QUESTION_KEYS = { age: 'askAge', bpl: 'askBpl', area: 'askArea', casteProof: 'askCasteProof', disability40: 'askDisability40' };
const MALE = ['father', 'grandfather', 'son', 'brother'];

// Which documents apply, given what we know.
export function buildItems(service, slots, data) {
  const items = [];
  const rural = slots.area === 'rural';
  const urban = slots.area === 'urban';
  for (const id of service.documents) {
    const doc = data.documents[id];
    let condition = null;
    if (doc.onlyIf === 'urban') {
      if (rural) continue;
      if (!urban) condition = 'urban';
    } else if (doc.onlyIf === 'urbanIfHave') {
      if (rural) continue;
      condition = urban ? 'ifHave' : 'urbanIfHave';
    } else if (doc.onlyIf === 'urbanRent') {
      if (rural) continue;
      condition = urban ? 'rent' : 'urbanRent';
    } else if (doc.onlyIf === 'noCasteProof') {
      if (slots.casteProof === true) continue;
      if (slots.casteProof !== false) condition = 'noCasteProof';
    } else if (doc.onlyIf === 'widow' && !service.forWidow) {
      if (MALE.includes(slots.relation)) continue;
      condition = 'widow';
    }
    if (doc.group === 'casteProof') {
      if (slots.casteProof === false) continue;
      condition = 'ifHave';
    }
    if (doc.notOfficial) condition = 'notOfficial';
    items.push({ id, condition, status: 'pending' });
  }
  return items;
}

export function itemText(state, data, index) {
  const item = state.items[index];
  const doc = data.documents[item.id];
  const prefix = item.condition ? tr(state.lang, `cond_${item.condition}`) : '';
  const line = tr(state.lang, 'item', { i: index + 1, n: state.items.length, nth: knOrdinal(index + 1), label: prefix + doc.label[state.lang] });
  return `${line} ${tr(state.lang, 'haveQ')}`;
}

function mergeSlots(state, u) {
  if (u.relation) state.slots.relation = u.relation;
  if (u.age) state.slots.age = u.age;
  if (u.area) state.slots.area = u.area;
  if (u.bpl !== null && u.bpl !== undefined) state.slots.bpl = u.bpl;
  if (u.district) state.slots.district = u.district;
}

function startService(state, serviceId, data, say) {
  state.service = serviceId;
  state.items = [];
  state.index = 0;
  state.notes = [];
  state.pending = null;
  // Answers that belong to one service only should not leak into the next.
  delete state.slots.casteProof;
  delete state.slots.disability40;
  return advance(state, data, say);
}

// Ask the next missing question, or check eligibility and start the list.
function advance(state, data, say) {
  const service = getService(data, state.service);
  const age = state.slots.age;
  if (service.minAge && age && age < service.minAge) {
    say.push(tr(state.lang, 'tooYoung', { service: mid(state.lang, service.name[state.lang]), min: service.minAge, age }));
    state.stage = 'start';
    state.service = null;
    return state;
  }
  for (const q of service.questions) {
    if (state.slots[q] === undefined || state.slots[q] === null) {
      state.stage = 'ask';
      state.pending = q;
      say.push(ask(state, QUESTION_KEYS[q]));
      return state;
    }
  }
  state.pending = null;
  if (service.kind === 'pension') {
    if (state.slots.disability40 === false && service.questions.includes('disability40')) state.notes.push(tr(state.lang, 'notDisability40'));
    if (state.slots.bpl === false && service.questions.includes('bpl')) state.notes.push(tr(state.lang, 'notBpl'));
    if (service.id === 'old_age_pension' && age >= 65) {
      state.notes.push(tr(state.lang, 'alsoSandhya', { age }));
    }
  }
  if (service.note) state.notes.push(service.note[state.lang] || service.note.en);
  state.items = buildItems(service, state.slots, data);
  state.index = 0;
  state.stage = 'checklist';
  say.push(...state.notes);
  say.push(tr(state.lang, 'intro', { service: service.name[state.lang], n: state.items.length, nWord: knNumber(state.items.length) }));
  say.push(itemText(state, data, 0));
  return state;
}

export function summary(state, data) {
  const service = getService(data, state.service);
  const lang = state.lang;
  const have = state.items.filter((i) => i.status === 'have').length;
  const missing = state.items.filter((i) => i.status === 'missing').map((i) => data.documents[i.id].label[lang]);
  const district = state.slots.district ? tr(lang, 'whereDistrict', { district: lang === 'kn' ? state.slots.district.kn : state.slots.district.en }) : '';
  const fee = service.kind === 'pension'
    ? tr(lang, 'feePension', { charge: service.serviceCharge })
    : tr(lang, 'feeCertificate', { fee: service.applicationFee, charge: service.serviceCharge });
  return {
    have,
    total: state.items.length,
    missing,
    where: district + tr(lang, 'where'),
    fee,
    days: tr(lang, 'days', { days: service.days }),
    checked: tr(lang, 'checked', { date: formatDate(data.lastChecked, lang) }),
    sourceUrl: data.sources[service.source.ref].url,
  };
}

function finish(state, data, say) {
  state.stage = 'done';
  const s = summary(state, data);
  say.push(doneLine(state, s));
  if (s.missing.length) say.push(tr(state.lang, 'stillNeeded', { list: s.missing.join(', ') }));
  say.push(s.where, s.fee, s.days, s.checked, tr(state.lang, 'allTheBest'), tr(state.lang, 'endPrompt'));
  return state;
}

export function doneLine(state, s) {
  return tr(state.lang, 'doneHave', { have: s.have, n: s.total, haveWord: knNumber(s.have), nWord: knNumber(s.total) });
}

function markMissing(state, data, index, say) {
  const item = state.items[index];
  item.status = 'missing';
  const doc = data.documents[item.id];
  say.push(tr(state.lang, 'noProblem').trim());
  if (doc.getVia) {
    const via = getService(data, doc.getVia);
    say.push(tr(state.lang, 'missingGetVia', { label: mid(state.lang, doc.label[state.lang]), service: via.name[state.lang] }));
  } else if (doc.group === 'casteProof') {
    say.push(tr(state.lang, 'missingFamilyTree'));
  } else {
    say.push(tr(state.lang, 'missingNoAlt'));
  }
}

function moveNext(state, data, say) {
  if (state.index + 1 >= state.items.length) return finish(state, data, say);
  state.index += 1;
  say.push(itemText(state, data, state.index));
  return state;
}

function handleChecklist(state, text, data, say) {
  const command = detectCommand(text);
  if (command === 'back') {
    if (state.index === 0) say.push(tr(state.lang, 'firstItem'));
    else state.index -= 1;
    say.push(itemText(state, data, state.index));
    return state;
  }
  if (command === 'repeat') {
    say.push(itemText(state, data, state.index));
    return state;
  }
  const yes = detectYesNo(text);
  const listed = state.items.map((i) => i.id);
  const mentioned = detectDocument(text, data.documents, listed);
  if (yes === false) {
    const target = mentioned ? listed.indexOf(mentioned) : state.index;
    markMissing(state, data, target, say);
    if (target !== state.index) {
      say.push(itemText(state, data, state.index));
      return state;
    }
    return moveNext(state, data, say);
  }
  if (yes === true) {
    const target = mentioned ? listed.indexOf(mentioned) : state.index;
    state.items[target].status = 'have';
    say.push(tr(state.lang, `gotIt${target % 3}`));
    if (target !== state.index) {
      say.push(itemText(state, data, state.index));
      return state;
    }
    return moveNext(state, data, say);
  }
  if (command === 'next') return moveNext(state, data, say);
  const { service } = detectService(text);
  if (service && service !== state.service) return startService(state, service, data, say);
  state.understood = false;
  say.push(tr(state.lang, 'notUnderstood'));
  say.push(itemText(state, data, state.index));
  return state;
}

function handleAnswer(state, text, data, say) {
  const q = state.pending;
  const command = detectCommand(text);
  if (command === 'repeat' || command === 'back') {
    say.push(ask(state, QUESTION_KEYS[q]));
    return state;
  }
  let value = null;
  if (q === 'age') value = extractAge(text);
  if (q === 'bpl') {
    const bpl = detectBpl(text);
    value = bpl !== null ? bpl : detectYesNo(text);
  }
  if (q === 'area') value = detectArea(text);
  if (q === 'casteProof' || q === 'disability40') value = detectYesNo(text);
  if (value === null || value === undefined) {
    const { service } = detectService(text);
    if (service && service !== state.service) return startService(state, service, data, say);
    state.understood = false;
    const reprompt = { age: 'sayAge', bpl: 'sayYesNo', area: 'sayArea', casteProof: 'sayYesNo', disability40: 'sayYesNo' }[q];
    say.push(tr(state.lang, reprompt));
    say.push(ask(state, QUESTION_KEYS[q]));
    return state;
  }
  // Someone may answer and add more in one breath ("62, and she lives in a village").
  mergeSlots(state, understand(text));
  state.slots[q] = value;
  return advance(state, data, say);
}

function handleStart(state, text, data, say) {
  const u = understand(text);
  mergeSlots(state, u);
  if (u.service) return startService(state, u.service, data, say);
  const names = (ids) => ids.map((id) => getService(data, id).name[state.lang]).join(', ');
  if (u.notCovered === 'disability_certificate') say.push(tr(state.lang, 'notCoveredDisabilityCert'));
  if (u.scholarship) say.push(tr(state.lang, 'scholarship'));
  else if (u.candidates.length > 1) say.push(tr(state.lang, 'whichOne', { list: names(u.candidates) }));
  else {
    state.understood = false;
    say.push(tr(state.lang, 'unknownService', { list: names(menuServices(data)) }));
  }
  state.stage = 'start';
  return state;
}

// Main entry: what the person said -> new state + sentences to say.
export function step(prevState, text, data) {
  const state = clone(prevState);
  Object.defineProperty(state, 'data', { value: data, enumerable: false, writable: true });
  Object.defineProperty(state, 'understood', { value: true, enumerable: false, writable: true });
  const say = [];
  const command = detectCommand(text);

  if (command === 'restart') {
    const fresh = createState(state.lang);
    return { state: fresh, say: [tr(state.lang, 'restarted')] };
  }
  if (command === 'share' && state.stage === 'done') {
    return { state, say: [tr(state.lang, 'sharing')], share: true };
  }
  if (command === 'wait' && (state.stage === 'ask' || state.stage === 'checklist')) {
    return { state, say: [tr(state.lang, 'waiting')], pause: true, understood: true };
  }

  if (state.stage === 'checklist') handleChecklist(state, text, data, say);
  else if (state.stage === 'ask') handleAnswer(state, text, data, say);
  else handleStart(state, text, data, say);

  state.lastSay = say.join(' ');
  return { state, say, understood: state.understood };
}

// How well a sentence fits what the conversation is waiting for: 0 means it
// would not be understood. Used to pick the best of the speech engine's guesses.
export function fitScore(state, text) {
  const u = understand(text);
  if (u.command) return 2;
  if (state.stage === 'ask') {
    const q = state.pending;
    if (q === 'age') return u.age ? 3 : 0;
    if (q === 'area') return u.area ? 3 : 0;
    return u.yes !== null || u.bpl !== null ? 3 : 0;
  }
  if (state.stage === 'checklist') return u.yes !== null ? 3 : u.service ? 1 : 0;
  return u.service ? 3 : u.scholarship || u.candidates.length > 1 ? 2 : 0;
}

// The sentence that fits the current stage, in the current language.
// Used when the language is switched and for the replay button.
export function currentPrompt(prevState, data) {
  const state = clone(prevState);
  Object.defineProperty(state, 'data', { value: data, enumerable: false, writable: true });
  if (state.stage === 'ask' && state.pending) return ask(state, QUESTION_KEYS[state.pending]);
  if (state.stage === 'checklist') return itemText(state, data, state.index);
  if (state.stage === 'done') {
    const s = summary(state, data);
    return [doneLine(state, s), tr(state.lang, 'endPrompt')].join(' ');
  }
  return tr(state.lang, 'hint');
}

// A short text to send on WhatsApp.
export function shareText(state, data) {
  const service = getService(data, state.service);
  const lang = state.lang;
  const s = summary(state, data);
  const lines = [tr(lang, 'shareHeader', { service: service.name[lang] }), ''];
  state.items.forEach((item, i) => {
    const mark = item.status === 'have' ? '✅' : item.status === 'missing' ? '❌' : '▫️';
    const prefix = item.condition ? tr(lang, `cond_${item.condition}`) : '';
    lines.push(`${mark} ${i + 1}. ${prefix}${data.documents[item.id].label[lang]}`);
  });
  lines.push('', s.where, s.fee, s.days, s.checked, s.sourceUrl, '', tr(lang, 'shareFooter'));
  return lines.join('\n');
}
