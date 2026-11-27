// The screen and the voice. Speech-to-text and text-to-speech use the
// browser's built-in Web Speech API, so the app runs with no API keys.
// All decisions are made by dialog.js; this file only listens, speaks and draws.

import { LANGS, tr, forSpeech } from './i18n.js';
import { detectLanguageSwitch } from './nlu.js';
import { createState, step, currentPrompt, summary, shareText, getService, menuServices, fitScore } from './dialog.js';

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

// ---------- Accessibility settings ----------

const settings = {
  speak: store.get('speak', true),
  slow: store.get('slow', false),
  large: store.get('large', false),
  contrast: store.get('contrast', false),
};

function applySettings() {
  document.documentElement.classList.toggle('large', settings.large);
  document.documentElement.classList.toggle('contrast', settings.contrast);
  document.querySelector('meta[name="theme-color"]').content = settings.contrast ? '#000000' : '#0f5c4a';
}

function bindSetting(id, key) {
  const box = $(id);
  box.checked = settings[key];
  box.addEventListener('change', () => {
    settings[key] = box.checked;
    store.set(key, box.checked);
    if (key === 'speak' && !box.checked) stopSpeaking();
    applySettings();
  });
}

// ---------- Voice: one controller for speaking and listening ----------
//
// Browsers are fussy here, so this part guards against the common problems:
// - only one listening session at a time; events from an old session are ignored
// - tapping the mic while it is speaking stops the voice and starts listening at once
// - Android Chrome often ends without a "final" result, so the last words heard are kept
// - Chrome sometimes never reports that speech ended, so a timer finishes it
// - Chrome drops speech queued right after cancel(), so speaking starts a moment later
// - utterances are kept in a list, because Chrome can lose "end" events for discarded ones

let listenId = 0; // the current listening session
let speakId = 0; // the current speaking session
let autoListenTimer = null;
let speakWatchdog = null;
let lastTap = 0;
const liveUtterances = [];

function loadVoices() {
  if (synth) voices = synth.getVoices();
}

function voiceFor(lang) {
  const code = LANGS[lang].speech.toLowerCase();
  const norm = (v) => v.lang.toLowerCase().replace('_', '-');
  const exact = voices.filter((v) => norm(v) === code);
  const near = voices.filter((v) => norm(v).startsWith(`${lang}-`));
  const pick = (list) => list.find((v) => /google/i.test(v.name)) || list.find((v) => v.localService) || list[0];
  return pick(exact) || pick(near) || null;
}

// Phones load their voices a moment after the page; wait briefly for them.
let voicesWaited = false;
function voicesReady() {
  loadVoices();
  if (voices.length || !synth || voicesWaited) return Promise.resolve();
  voicesWaited = true; // wait once per page load, not before every sentence
  return new Promise((resolve) => {
    const done = () => { loadVoices(); resolve(); };
    synth.addEventListener?.('voiceschanged', done, { once: true });
    setTimeout(done, 700);
  });
}

// Long utterances get cut off in some browsers, so speak sentence by sentence.
function sentences(text) {
  return text.split(/(?<=[.?!।])\s+/).map((s) => s.trim()).filter(Boolean);
}

function cancelAutoListen() {
  if (autoListenTimer) clearTimeout(autoListenTimer);
  autoListenTimer = null;
}

async function speak(rawText, done) {
  hideBanner('noVoice');
  stopSpeaking();
  if (!synth || !rawText || !settings.speak) { done?.(); return; }
  const myTurn = speakId;
  await voicesReady();
  if (myTurn !== speakId) return; // something else started meanwhile
  const text = forSpeech(rawText, state.lang);
  const voice = voiceFor(state.lang);
  if (!voice && voices.length > 0 && state.lang !== 'en') {
    showBanner(tr(state.lang, 'noVoice'), 'noVoice');
    done?.();
    return;
  }
  const id = ++speakId;
  const finish = () => {
    if (id !== speakId) return; // already finished, stopped or replaced
    speakId += 1;
    clearTimeout(speakWatchdog);
    liveUtterances.length = 0;
    if (mode === 'speaking') setMode('idle');
    done?.();
  };
  // If the browser never says "end", finish after a generous estimate.
  speakWatchdog = setTimeout(finish, text.length * (settings.slow ? 140 : 100) + 4000);
  setMode('speaking');
  setTimeout(() => {
    if (id !== speakId) return;
    synth.resume(); // Chrome on Android can get stuck "paused"
    const parts = sentences(text);
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part);
      u.lang = LANGS[state.lang].speech;
      if (voice) { try { u.voice = voice; } catch { /* some browsers reject a voice object; the language still applies */ } }
      u.rate = settings.slow ? 0.75 : 0.95;
      if (i === parts.length - 1) u.onend = finish;
      u.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') finish();
      };
      liveUtterances.push(u);
      synth.speak(u);
    });
  }, 80);
}

function stopSpeaking() {
  speakId += 1;
  clearTimeout(speakWatchdog);
  if (synth) synth.cancel();
  liveUtterances.length = 0;
  if (mode === 'speaking') setMode('idle');
}

// Joins results, dropping repeats ("ಇದೆ ಇದೆ") that some phones send.
function joinResults(list) {
  let text = '';
  for (const part of list.map((t) => t.trim()).filter(Boolean)) {
    if (part.startsWith(text)) text = part;
    else if (!text.endsWith(part)) text = `${text} ${part}`;
  }
  return text.trim();
}

const MIC_ERRORS = {
  'not-allowed': 'micBlocked',
  'service-not-allowed': 'micBlocked',
  'audio-capture': 'micNone',
  network: 'micNetwork',
};

// In hands-free mode, a silent session is restarted a few times, so a slow
// answer ("wait, let me find the passbook... yes") is still heard.
// Chrome ends a silent session after about 6-8 seconds, so 3 restarts give ~30 seconds.
const AUTO_RETRIES = 3;
let stopRequestedFor = 0; // the session the person asked to stop
let audioCtx = null;

// Browsers only allow sound after a tap, so this is called on every tap.
function unlockAudio() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* no Web Audio: vibration and the label still work */ }
}

// "Speak now": a short soft beep and a vibration, once the mic is really on.
function readyCue() {
  navigator.vibrate?.(40);
  if (!settings.speak || !audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  } catch { /* ignore */ }
}

// Of the engine's guesses, take the first one the conversation can use.
function bestGuess(options) {
  const list = [...new Set(options.map((t) => (t || '').trim()).filter(Boolean))];
  if (!list.length) return '';
  const best = list.find((t) => fitScore(state, t) > 0);
  return best || list[0];
}

function isWaitingForAnswer() {
  return state.stage === 'ask' || state.stage === 'checklist';
}

function abortCurrent() {
  if (!recognition) return;
  listenId += 1; // its late events will be ignored
  try { recognition.abort(); } catch { /* already stopped */ }
  recognition = null;
}

function listen({ auto = false, attempt = 0 } = {}) {
  if (!SpeechRecognition) {
    showBanner(tr(state.lang, 'noMic'), 'noMic');
    $('typed').focus();
    return;
  }
  cancelAutoListen();
  stopSpeaking();
  abortCurrent();
  hideBanner('micError');
  const id = ++listenId;
  const rec = new SpeechRecognition();
  rec.lang = LANGS[state.lang].speech;
  rec.interimResults = true;
  rec.maxAlternatives = 3;
  rec.continuous = false;
  let finalText = '';
  let finalOptions = [];
  let interimText = '';
  let error = null;
  let ready = false;

  // Stop by itself if nothing ends the session (some phones keep it open).
  const maxTimer = setTimeout(() => { if (id === listenId && recognition === rec) rec.stop(); }, 15000);

  const onReady = () => {
    if (id !== listenId || ready) return;
    ready = true;
    setMode('listening');
    if (attempt === 0 || !auto) { // a tapped retry beeps again: "speak now"
      readyCue();
      tester.count('micOpened');
    }
  };
  rec.onaudiostart = onReady; // the mic is actually capturing
  rec.onstart = onReady;

  rec.onresult = (event) => {
    if (id !== listenId) return;
    const results = Array.from(event.results);
    const finals = results.filter((r) => r.isFinal);
    finalText = joinResults(finals.map((r) => r[0].transcript));
    // The engine's other guesses for the same words, used if the first makes no sense.
    finalOptions = [0, 1, 2].map((k) => joinResults(finals.map((r) => (r[k] || r[0]).transcript)));
    interimText = joinResults(results.filter((r) => !r.isFinal).map((r) => r[0].transcript));
    showHeard(finalText || interimText, false);
  };
  rec.onerror = (event) => {
    if (id !== listenId) return;
    error = event.error;
    const key = MIC_ERRORS[error];
    if (key) showBanner(tr(state.lang, key), 'micError');
    if (key === 'micBlocked') $('handsFree').checked = false;
  };
  rec.onend = () => {
    clearTimeout(maxTimer);
    if (id !== listenId) return; // an older session; a newer one is in charge
    recognition = null;
    const text = bestGuess(finalText ? finalOptions : [interimText]);
    if (text) {
      setMode('idle');
      handle(text, 'voice');
      return;
    }
    const silent = !error || error === 'no-speech';
    // Nothing heard. Hands-free keeps listening a few times; after a tap we listen once
    // more, because people often speak before the mic is ready and then say it again.
    const retriesLeft = auto ? attempt < AUTO_RETRIES && $('handsFree').checked : attempt < 1;
    const keepGoing = silent && retriesLeft && stopRequestedFor !== id
      && isWaitingForAnswer() && !document.hidden;
    if (keepGoing) {
      tester.count('silentRetries');
      // Restart quietly; the button stays in "listening" so it doesn't flicker.
      mode = 'idle';
      autoListenTimer = setTimeout(() => {
        autoListenTimer = null;
        if (mode === 'idle') listen({ auto, attempt: attempt + 1 });
      }, 150);
      return;
    }
    setMode('idle');
    if (silent) tester.count('notHeard');
    if (silent) $('micLabel').textContent = tr(state.lang, auto ? 'tapToAnswer' : 'notHeard');
    if (silent && !auto) showNote(tr(state.lang, 'closer'));
  };

  recognition = rec;
  try {
    rec.start();
    // Until the mic is really on, show "one moment" (a retry keeps "speak now").
    setMode(attempt > 0 ? 'listening' : 'starting');
  } catch {
    recognition = null;
    setMode('idle');
  }
}

function stopListening() {
  cancelAutoListen();
  if (recognition) {
    stopRequestedFor = listenId;
    try { recognition.stop(); } catch { /* already stopped */ }
  }
}

// One tap does what you expect: start, stop, or interrupt the voice and listen.
function onMicTap() {
  const now = Date.now();
  if (now - lastTap < 350) return; // ignore accidental double taps
  lastTap = now;
  unlockAudio();
  cancelAutoListen();
  if (mode === 'listening' || mode === 'starting') stopListening();
  else listen(); // also stops the voice if it is speaking
}

// ---------- One turn of the conversation ----------

function handle(text, source = 'typed') {
  const fromVoice = source === 'voice';
  // "English", "ಕನ್ನಡ", "हिंदी" said on its own switches the language.
  const lang = detectLanguageSwitch(text);
  if (lang && lang !== state.lang) {
    switchLang(lang);
    speak(reply);
    return;
  }
  showHeard(text, fromVoice);
  const before = state.stage;
  const result = step(state, text, data);
  state = result.state;
  tester.record({ source, understood: result.understood, reachedDone: before !== 'done' && state.stage === 'done', service: state.service, lang: state.lang });
  const spoken = result.say.join(' ');
  // At the end, the summary card shows the details, so keep the reply short on screen.
  reply = state.stage === 'done' && !result.share ? currentPrompt(state, data) : spoken;
  store.set('state', state);
  render();
  // Finished: bring the top box (with the summary) into view, wherever they had scrolled.
  if (before !== 'done' && state.stage === 'done') {
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bar = document.querySelector('header')?.offsetHeight || 0; // the header stays on top
    const top = document.querySelector('.talk').getBoundingClientRect().top + window.scrollY - bar - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: calm ? 'auto' : 'smooth' });
  }
  if (result.share) openWhatsApp();
  speak(spoken, () => {
    if (result.pause) return; // "wait": don't open the mic until they tap
    const waiting = state.stage === 'ask' || state.stage === 'checklist';
    if (!$('handsFree').checked || !waiting || !SpeechRecognition) return;
    cancelAutoListen();
    autoListenTimer = setTimeout(() => {
      autoListenTimer = null;
      if (mode === 'idle') listen({ auto: true });
    }, 120); // people answer right after the question, so open the mic quickly
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
  mic.classList.toggle('listening', mode === 'listening' || mode === 'starting');
  mic.classList.toggle('speaking', mode === 'speaking');
  const key = { listening: 'listening', starting: 'getReady', speaking: 'speaking' }[mode] || 'tapToSpeak';
  $('micLabel').textContent = tr(state.lang, key);
  mic.setAttribute('aria-label', tr(state.lang, key));
  mic.setAttribute('aria-pressed', String(mode === 'listening' || mode === 'starting'));
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

function showNote(text) {
  const el = $('heard');
  el.hidden = false;
  el.textContent = text;
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
  b.addEventListener('click', () => {
    unlockAudio();
    cancelAutoListen();
    if (recognition) { abortCurrent(); setMode('idle'); }
    handle(label, 'tap');
  });
  return b;
}

function renderChips() {
  const box = $('chips');
  box.replaceChildren();
  const L = state.lang;
  const serviceChips = () => menuServices(data)
    .forEach((id) => box.appendChild(chip(getService(data, id).name[L])));
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
    const isCurrent = state.stage === 'checklist' && i === state.index;
    if (isCurrent) {
      li.classList.add('current');
      li.setAttribute('aria-current', 'step');
    }
    const mark = document.createElement('span');
    mark.className = 'mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = item.status === 'have' ? '✓' : item.status === 'missing' ? '✕' : String(i + 1);
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    const statusKey = item.status === 'have' ? 'srHave' : item.status === 'missing' ? 'srMissing' : 'srPending';
    sr.textContent = `${i + 1}. ${tr(L, statusKey)}${isCurrent ? `, ${tr(L, 'srCurrent')}` : ''}: `;
    const label = document.createElement('span');
    label.className = 'label';
    if (item.condition) {
      const cond = document.createElement('span');
      cond.className = 'cond';
      cond.textContent = tr(L, `cond_${item.condition}`).replace(/[:：]\s*$/, '');
      label.appendChild(cond);
    }
    label.appendChild(document.createTextNode(data.documents[item.id].label[L]));
    li.append(mark, sr, label);
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
  if (s.missing.length) add(tr(L, 'stillNeeded', { list: s.missing.join(', ') }));
  add(s.where);
  add(s.fee);
  add(s.days);
  // Help numbers as tap-to-call links.
  const help = add('');
  const parts = s.help.split(/(\d{3}-\d{8}|\b1902\b)/);
  parts.forEach((part) => {
    if (part === s.phone || part === s.grievance) {
      const tel = document.createElement('a');
      tel.href = `tel:${part.replace(/-/g, '')}`;
      tel.textContent = part;
      help.appendChild(tel);
    } else if (part) help.appendChild(document.createTextNode(part));
  });
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

// Wispr Flow's official download page for this device: Android, iPhone, or a computer.
function wisprUrl() {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'https://wisprflow.ai/android';
  if (/iPhone|iPod/i.test(ua)) return 'https://apps.apple.com/app/id6497229487';
  return 'https://wisprflow.ai/downloads';
}

// The tip, with "Wispr Flow" in bold as a link to install it.
function renderTypeTip(L) {
  const tip = $('typeTip');
  const [before, after] = tr(L, 'typeTip', { wispr: '\u0001' }).split('\u0001');
  const link = document.createElement('a');
  link.href = wisprUrl();
  link.target = '_blank';
  link.rel = 'noopener';
  const bold = document.createElement('strong');
  bold.textContent = 'Wispr Flow';
  link.appendChild(bold);
  tip.replaceChildren(document.createTextNode(before), link, document.createTextNode(after ?? ''));
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
  $('accessTitle').textContent = tr(L, 'accessTitle');
  $('newQuestionLabel').textContent = tr(L, 'newQuestion');
  renderTypeTip(L);
  $('optSpeakLabel').textContent = tr(L, 'optSpeak');
  $('optSlowLabel').textContent = tr(L, 'optSlow');
  $('optLargeLabel').textContent = tr(L, 'optLarge');
  $('optContrastLabel').textContent = tr(L, 'optContrast');
  $('accessNote').textContent = tr(L, 'accessNote');
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
  $('talkTop').hidden = state.stage === 'start' && !state.service;
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
  cancelAutoListen();
  abortCurrent();
  stopSpeaking();
  state = createState(state.lang);
  reply = '';
  store.set('state', state);
  $('heard').hidden = true;
  render();
}

// ---------- Tester mode (open the app with ?test=1) ----------
//
// For user tests: counts, per tester, how they finished the task. It keeps
// numbers only (no words said, no names) and only on this phone.

const tester = {
  on: new URLSearchParams(location.search).has('test'), // only with ?test=1; the plain link never shows it
  sessions: store.get('testSessions', []),
  current() {
    return this.sessions[this.sessions.length - 1];
  },
  start() {
    this.sessions.push({
      n: this.sessions.length + 1, startedAt: Date.now(), firstInputAt: null, doneAt: null, service: null, lang: null,
      inputs: { voice: 0, typed: 0, tap: 0 }, notUnderstood: 0, micOpened: 0, silentRetries: 0, notHeard: 0,
    });
    this.save();
  },
  save() {
    store.set('testSessions', this.sessions);
    if (this.on) renderTester();
  },
  count(key) {
    if (!this.on || !this.current()) return;
    this.current()[key] += 1;
    this.save();
  },
  record({ source, understood, reachedDone, service, lang }) {
    if (!this.on) return;
    if (!this.current()) this.start();
    const s = this.current();
    s.firstInputAt ||= Date.now();
    s.inputs[source] = (s.inputs[source] || 0) + 1;
    if (!understood) s.notUnderstood += 1;
    if (service) s.service = service;
    s.lang = lang;
    if (reachedDone && !s.doneAt) s.doneAt = Date.now();
    this.save();
  },
};

function testerSummary() {
  const done = tester.sessions.filter((s) => s.doneAt);
  const secs = done.map((s) => Math.round((s.doneAt - (s.firstInputAt || s.startedAt)) / 1000)).sort((a, b) => a - b);
  const median = secs.length ? secs[Math.floor((secs.length - 1) / 2)] : null;
  const total = tester.sessions.reduce((a, s) => a + s.inputs.voice + s.inputs.typed + s.inputs.tap, 0);
  const voice = tester.sessions.reduce((a, s) => a + s.inputs.voice, 0);
  return {
    testers: tester.sessions.length,
    finished: done.length,
    medianSeconds: median,
    voiceShare: total ? Math.round((100 * voice) / total) : null,
  };
}

function testerText() {
  const sum = testerSummary();
  const lines = [
    `DocAgent Voice user test: ${sum.finished} of ${sum.testers} testers reached the end of the checklist.`,
    `Median time to finish: ${sum.medianSeconds ?? '-'} s. Answers given by voice: ${sum.voiceShare ?? '-'}%.`,
    '',
    '# | service | lang | finished | seconds | voice/typed/tap | not understood | mic opened | silent restarts | not heard',
  ];
  for (const s of tester.sessions) {
    const secs = s.doneAt ? Math.round((s.doneAt - (s.firstInputAt || s.startedAt)) / 1000) : '-';
    lines.push(`${s.n} | ${s.service || '-'} | ${s.lang || '-'} | ${s.doneAt ? 'yes' : 'no'} | ${secs} | ${s.inputs.voice}/${s.inputs.typed}/${s.inputs.tap} | ${s.notUnderstood} | ${s.micOpened} | ${s.silentRetries} | ${s.notHeard}`);
  }
  return lines.join('\n');
}

function renderTester() {
  const panel = $('tester');
  panel.hidden = !tester.on;
  if (!tester.on) return;
  const sum = testerSummary();
  $('testerSummary').textContent = `Tester ${tester.sessions.length || 1} · ${sum.finished} of ${sum.testers} finished`
    + (sum.medianSeconds !== null ? ` · median ${sum.medianSeconds}s` : '')
    + (sum.voiceShare !== null ? ` · ${sum.voiceShare}% by voice` : '');
  $('testerTable').textContent = testerText();
}

function bindTester() {
  store.set('testerMode', false); // clear the old "remember tester mode" setting
  $('testerNew').addEventListener('click', () => {
    restart();
    tester.start();
    renderTester();
  });
  $('testerCopy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(testerText());
      $('testerCopy').textContent = 'Copied';
    } catch {
      $('testerTable').hidden = false;
    }
  });
  $('testerOff').addEventListener('click', () => {
    tester.on = false;
    history.replaceState(null, '', location.pathname); // back to the plain link
    renderTester();
  });
  $('testerClear').addEventListener('click', () => {
    tester.sessions = [];
    tester.save();
  });
  if (tester.on && !tester.current()) tester.start();
  renderTester();
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
  $('mic').addEventListener('click', onMicTap);
  $('replay').addEventListener('click', () => {
    cancelAutoListen();
    stopListening();
    speak($('reply').textContent);
  });
  $('typebox').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('typed').value.trim();
    if (!text) return;
    $('typed').value = '';
    unlockAudio();
    cancelAutoListen();
    if (recognition) { abortCurrent(); setMode('idle'); }
    handle(text, 'typed');
  });
  $('restart').addEventListener('click', restart);
  $('newQuestion').addEventListener('click', () => {
    restart();
    reply = tr(state.lang, 'restarted');
    render();
    speak(reply);
  });
  bindSetting('optSpeak', 'speak');
  bindSetting('optSlow', 'slow');
  bindSetting('optLarge', 'large');
  bindSetting('optContrast', 'contrast');
  applySettings();

  // Never keep the mic or voice running when the app is in the background.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    cancelAutoListen();
    abortCurrent();
    stopSpeaking();
    setMode('idle');
  });

  // Keyboard: Space talks (when not typing or on another control), Esc stops.
  document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if (e.key === 'Escape') {
      cancelAutoListen();
      stopListening();
      stopSpeaking();
      return;
    }
    if (e.key === ' ' && !['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'SUMMARY', 'A'].includes(tag)) {
      e.preventDefault();
      $('mic').click();
    }
  });

  if (synth) {
    loadVoices();
    synth.addEventListener?.('voiceschanged', loadVoices);
  }
  render();
  bindTester();
  const embedded = /Electron|FBAN|FBAV|Instagram|; wv\)/.test(navigator.userAgent);
  if (!SpeechRecognition || embedded) showBanner(tr(state.lang, 'noMic'), 'noMic');
}

init();
