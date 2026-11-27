// The screen and the voice. Speech-to-text and text-to-speech use the
// browser's built-in Web Speech API, so the app runs with no API keys.
// All decisions are made by dialog.js; this file only listens, speaks and draws.

import { LANGS, tr } from './i18n.js';
import { createState, step, currentPrompt, summary, shareText, getService } from './dialog.js';

const $ = (id) => document.getElementById(id);
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;

let data = null;
let state = null;
let reply = '';
let recognition = null;
let mode = 'idle'; // idle | listening | speaking
let voices = [];

// ---------- Saved settings (best effort; storage can be unavailable) ----------

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  },
};

// ---------- Speaking ----------

function loadVoices() {
  if (synth) voices = synth.getVoices();
}

function voiceFor(lang) {
  const code = LANGS[lang].speech.toLowerCase();
  const norm = (v) => v.lang.toLowerCase().replace('_', '-');
  return voices.find((v) => norm(v) === code) || voices.find((v) => norm(v).startsWith(`${lang}-`)) || null;
}

// Long utterances get cut off in some browsers, so speak sentence by sentence.
function sentences(text) {
  return text.split(/(?<=[.?!।])\s+/).map((s) => s.trim()).filter(Boolean);
}

function speak(text, done) {
  hideBanner('noVoice');
  if (!synth || !text) { done?.(); return; }
  synth.cancel();
  const voice = voiceFor(state.lang);
  if (!voice && voices.length > 0 && state.lang !== 'en') {
    showBanner(tr(state.lang, 'noVoice'), 'noVoice');
    done?.();
    return;
  }
  const parts = sentences(text);
  setMode('speaking');
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = LANGS[state.lang].speech;
    if (voice) u.voice = voice;
    u.rate = 0.95;
    if (i === parts.length - 1) {
      u.onend = () => { setMode('idle'); done?.(); };
      u.onerror = () => { setMode('idle'); };
    }
    synth.speak(u);
  });
}

function stopSpeaking() {
  if (synth) synth.cancel();
  if (mode === 'speaking') setMode('idle');
}

// ---------- Listening ----------

function listen() {
  if (!SpeechRecognition) {
    showBanner(tr(state.lang, 'noMic'), 'noMic');
    $('typed').focus();
    return;
  }
  stopSpeaking();
  recognition = new SpeechRecognition();
  recognition.lang = LANGS[state.lang].speech;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;
  let finalText = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) finalText += result[0].transcript;
      else interim += result[0].transcript;
    }
    showHeard(finalText || interim);
  };
  recognition.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      showBanner(tr(state.lang, 'micBlocked'), 'micBlocked');
      $('handsFree').checked = false;
    } else if (event.error === 'no-speech') {
      $('micLabel').textContent = tr(state.lang, 'notHeard');
    }
  };
  recognition.onend = () => {
    recognition = null;
    setMode('idle');
    const text = finalText.trim();
    if (text) handle(text, true);
  };
  try {
    recognition.start();
    setMode('listening');
  } catch {
    setMode('idle');
  }
}

function stopListening() {
  if (recognition) recognition.stop();
}

// ---------- One turn of the conversation ----------

function handle(text, fromVoice) {
  showHeard(text, fromVoice);
  const result = step(state, text, data);
  state = result.state;
  const spoken = result.say.join(' ');
  // At the end, the summary card shows the details, so keep the reply short on screen.
  reply = state.stage === 'done' && !result.share ? currentPrompt(state, data) : spoken;
  store.set('state', state);
  render();
  if (result.share) openWhatsApp();
  speak(spoken, () => {
    const waiting = state.stage === 'ask' || state.stage === 'checklist';
    if ($('handsFree').checked && waiting && SpeechRecognition) setTimeout(listen, 250);
  });
}

function openWhatsApp() {
  const url = whatsappUrl();
  const win = window.open(url, '_blank', 'noopener');
  if (!win) $('whatsapp').focus(); // pop-up blocked: the button is right there
}

function whatsappUrl() {
  return `https://wa.me/?text=${encodeURIComponent(shareText(state, data))}`;
}

// ---------- Drawing ----------

function setMode(next) {
  mode = next;
  const mic = $('mic');
  mic.classList.toggle('listening', mode === 'listening');
  mic.classList.toggle('speaking', mode === 'speaking');
  const key = mode === 'listening' ? 'listening' : mode === 'speaking' ? 'speaking' : 'tapToSpeak';
  $('micLabel').textContent = tr(state.lang, key);
  mic.setAttribute('aria-label', tr(state.lang, key));
}

function showHeard(text, fromVoice = true) {
  const el = $('heard');
  if (!text) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = tr(state.lang, 'heard', { text });
  if (fromVoice) {
    const fix = document.createElement('small');
    fix.textContent = tr(state.lang, 'heardFix');
    el.appendChild(fix);
  }
}

function showBanner(text, kind) {
  const el = $('banner');
  el.textContent = text;
  el.dataset.kind = kind;
  el.hidden = false;
}

function hideBanner(kind) {
  const el = $('banner');
  if (!kind || el.dataset.kind === kind) el.hidden = true;
}

function chip(label, primary = false) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = primary ? 'chip primary' : 'chip';
  b.textContent = label;
  b.addEventListener('click', () => handle(label, false));
  return b;
}

function renderChips() {
  const box = $('chips');
  box.replaceChildren();
  const L = state.lang;
  const serviceChips = () => data.services
    .filter((s) => s.id !== 'sandhya_suraksha')
    .forEach((s) => box.appendChild(chip(s.name[L])));
  if (state.stage === 'ask') {
    if (state.pending === 'area') {
      box.append(chip(tr(L, 'chipCity')), chip(tr(L, 'chipVillage')));
    } else if (state.pending !== 'age') {
      box.append(chip(tr(L, 'chipYes'), true), chip(tr(L, 'chipNo')));
    }
  } else if (state.stage === 'checklist') {
    box.append(chip(tr(L, 'chipHave'), true), chip(tr(L, 'chipMissing')), chip(tr(L, 'chipNext')), chip(tr(L, 'chipRepeat')), chip(tr(L, 'chipBack')));
  } else if (state.stage === 'done') {
    box.append(chip(tr(L, 'chipSend'), true));
    serviceChips();
  } else {
    serviceChips();
  }
}

function renderChecklist() {
  const panel = $('checklist');
  const service = state.service ? getService(data, state.service) : null;
  if (!service || !state.items.length) { panel.hidden = true; return; }
  panel.hidden = false;
  const L = state.lang;
  $('checklistTitle').textContent = tr(L, 'checklistTitle');
  $('serviceName').textContent = service.name[L];
  const have = state.items.filter((i) => i.status === 'have').length;
  $('count').textContent = `${have} / ${state.items.length}`;
  const list = $('items');
  list.replaceChildren();
  state.items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = item.status;
    if (state.stage === 'checklist' && i === state.index) li.classList.add('current');
    const mark = document.createElement('span');
    mark.className = 'mark';
    mark.textContent = item.status === 'have' ? '✓' : item.status === 'missing' ? '✕' : String(i + 1);
    const label = document.createElement('span');
    label.className = 'label';
    if (item.condition) {
      const cond = document.createElement('span');
      cond.className = 'cond';
      cond.textContent = tr(L, `cond_${item.condition}`).replace(/[:：]\s*$/, '');
      label.appendChild(cond);
    }
    label.appendChild(document.createTextNode(data.documents[item.id].label[L]));
    li.append(mark, label);
    list.appendChild(li);
  });
  $('officialLabel').textContent = `${tr(L, 'officialWording')} (Seva Sindhu)`;
  $('officialText').textContent = service.officialDocuments[L] || service.officialDocuments.en;
}

function renderSummary() {
  const panel = $('summary');
  if (state.stage !== 'done' || !state.service) { panel.hidden = true; return; }
  panel.hidden = false;
  const s = summary(state, data);
  const L = state.lang;
  const facts = $('facts');
  facts.replaceChildren();
  const add = (text) => { const li = document.createElement('li'); li.textContent = text; facts.appendChild(li); return li; };
  add(tr(L, 'doneHave', { have: s.have, n: s.total }));
  if (s.missing.length) add(tr(L, 'stillNeeded', { list: s.missing.join(', ') }));
  add(s.where);
  add(s.fee);
  add(s.days);
  const src = add(`${s.checked} `);
  const a = document.createElement('a');
  a.href = s.sourceUrl;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = s.sourceUrl.replace(/^https:\/\//, '');
  src.appendChild(a);
  $('whatsapp').textContent = tr(L, 'shareWhatsApp');
  $('whatsapp').href = whatsappUrl();
  $('restart').textContent = tr(L, 'startOver');
}

function renderStatic() {
  const L = state.lang;
  document.documentElement.lang = L;
  $('title').textContent = tr(L, 'title');
  document.title = tr(L, 'title');
  $('tagline').textContent = tr(L, 'tagline');
  $('typed').placeholder = tr(L, 'typeHere');
  $('sendBtn').textContent = tr(L, 'send');
  $('handsFreeLabel').textContent = tr(L, 'handsFree');
  $('privacy').textContent = tr(L, 'privacy');
  const langs = $('langs');
  langs.replaceChildren();
  Object.entries(LANGS).forEach(([code, info]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.lang = code;
    b.textContent = info.label;
    b.setAttribute('aria-pressed', String(code === L));
    b.addEventListener('click', () => switchLang(code));
    langs.appendChild(b);
  });
}

function render() {
  renderStatic();
  $('reply').textContent = reply || tr(state.lang, 'hint');
  setMode(mode);
  renderChips();
  renderChecklist();
  renderSummary();
}

function switchLang(code) {
  if (code === state.lang) return;
  stopListening();
  stopSpeaking();
  hideBanner();
  state = { ...state, lang: code };
  reply = currentPrompt(state, data);
  store.set('lang', code);
  store.set('state', state);
  $('heard').hidden = true;
  render();
}

function restart() {
  stopListening();
  stopSpeaking();
  state = createState(state.lang);
  reply = '';
  store.set('state', state);
  $('heard').hidden = true;
  render();
}

// ---------- Start ----------

async function init() {
  data = await fetch('data/services.json').then((r) => r.json());
  const saved = store.get('state', null);
  const lang = store.get('lang', 'kn');
  state = saved && saved.stage ? saved : createState(lang);
  if (!LANGS[state.lang]) state.lang = 'kn';
  reply = state.stage === 'start' ? '' : currentPrompt(state, data);

  $('handsFree').checked = store.get('handsFree', true);
  $('handsFree').addEventListener('change', (e) => store.set('handsFree', e.target.checked));
  $('mic').addEventListener('click', () => {
    if (mode === 'listening') stopListening();
    else if (mode === 'speaking') stopSpeaking();
    else listen();
  });
  $('replay').addEventListener('click', () => speak($('reply').textContent));
  $('typebox').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('typed').value.trim();
    if (!text) return;
    $('typed').value = '';
    handle(text, false);
  });
  $('restart').addEventListener('click', restart);

  if (synth) {
    loadVoices();
    synth.addEventListener?.('voiceschanged', loadVoices);
  }
  render();
  if (!SpeechRecognition) showBanner(tr(state.lang, 'noMic'), 'noMic');
}

init();
