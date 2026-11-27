// Understanding what the person said, in Kannada, Hindi or English.
// Pure functions with no browser APIs, so the same file runs in the browser
// and in the Node tests. No AI key needed: this is keyword and number
// matching over the words people actually use for these services.

const KN_DIGITS = '೦೧೨೩೪೫೬೭೮೯';
const HI_DIGITS = '०१२३४५६७८९';
const DEVANAGARI = /[ऀ-ॿ]/;

export function normalize(text) {
  let t = String(text || '').toLowerCase();
  t = t.replace(/[೦-೯]/g, (d) => String(KN_DIGITS.indexOf(d)));
  t = t.replace(/[०-९]/g, (d) => String(HI_DIGITS.indexOf(d)));
  t = t.replace(/(\d),(\d)/g, '$1$2');
  t = t.replace(/['’‘]/g, '');
  t = t.replace(/[.,!?;:।॥"“”()\-–—/]/g, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

// Word-aware matching.
// - Hindi (Devanagari) words are separated by spaces and postpositions,
//   so a term must match whole words ("मां" must not match "मांड्या").
// - Kannada and English attach endings ("ಅಮ್ಮನಿಗೆ", "pensions"),
//   so a term may match the start of a word.
// - exact = true forces whole-word matching (used for yes/no and commands).
function matchesTerm(padded, term, exact) {
  const t = normalize(term);
  if (!t) return false;
  // Short English words ("mom", "dad", "city") must be whole words,
  // so "mom" does not match "moment".
  const shortLatin = /^[a-z]{1,4}$/.test(t);
  if (exact || shortLatin || DEVANAGARI.test(t)) return padded.includes(` ${t} `);
  return padded.includes(` ${t}`);
}

export function hasAny(text, terms, exact = false) {
  const padded = ` ${normalize(text)} `;
  return terms.some((term) => matchesTerm(padded, term, exact));
}

function firstIndex(text, terms) {
  const padded = ` ${normalize(text)} `;
  let best = -1;
  for (const term of terms) {
    const i = padded.indexOf(` ${normalize(term)}`);
    if (i >= 0 && (best < 0 || i < best)) best = i;
  }
  return best;
}

// ---------- Services ----------

export const SERVICE_WORDS = {
  sandhya_suraksha: ['sandhya suraksha', 'sandya suraksha', 'sandhya', 'ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ', 'ಸಂಧ್ಯಾ', 'संध्या सुरक्षा', 'संध्या'],
  old_age_pension: [
    'old age pension', 'old age', 'oldage', 'pension', 'pinchani', 'vruddhapya', 'vriddhapya', 'masashana',
    'ಪಿಂಚಣಿ', 'ಪೆನ್ಷನ್', 'ಪೆನ್ಶನ್', 'ವೃದ್ಧಾಪ್ಯ', 'ವೃದ್ಯಾಪ್ಯ', 'ಮಾಸಾಶನ',
    'पेंशन', 'पेन्शन', 'वृद्धावस्था', 'बुढ़ापा', 'वृद्धा',
  ],
  income_certificate: ['income', 'aadaya', 'adaya', 'ಆದಾಯ', 'ಇನ್ಕಮ್', 'ಇನ್‌ಕಮ್', 'आय प्रमाण', 'आय का', 'आय सर्टिफिकेट', 'इनकम', 'आमदनी'],
  caste_certificate: ['caste', 'jati', 'jaati', 'ಜಾತಿ', 'ಕ್ಯಾಸ್ಟ್', 'जाति', 'कास्ट'],
};

const SCHOLARSHIP_WORDS = ['scholarship', 'ವಿದ್ಯಾರ್ಥಿ ವೇತನ', 'ಸ್ಕಾಲರ್‌ಶಿಪ್', 'ಸ್ಕಾಲರ್ಶಿಪ್', 'ಸ್ಕಾಲರ್', 'छात्रवृत्ति', 'स्कॉलरशिप', 'स्कालरशिप'];

export function detectService(text) {
  const found = Object.keys(SERVICE_WORDS).filter((id) => hasAny(text, SERVICE_WORDS[id]));
  const scholarship = hasAny(text, SCHOLARSHIP_WORDS);
  if (found.includes('sandhya_suraksha')) return { service: 'sandhya_suraksha', candidates: found, scholarship };
  if (found.includes('old_age_pension')) return { service: 'old_age_pension', candidates: found, scholarship };
  const certs = found.filter((id) => id === 'income_certificate' || id === 'caste_certificate');
  if (certs.length === 1) return { service: certs[0], candidates: found, scholarship };
  return { service: null, candidates: certs, scholarship };
}

// ---------- Age ----------

const KN_NUMBER_WORDS = {
  'ಐವತ್ತು': 50, 'ಐವತ್ತೈದು': 55, 'ಅರವತ್ತು': 60, 'ಅರವತ್ತೊಂದು': 61, 'ಅರವತ್ತೆರಡು': 62, 'ಅರವತ್ಮೂರು': 63, 'ಅರವತ್ತಮೂರು': 63,
  'ಅರವತ್ನಾಲ್ಕು': 64, 'ಅರವತ್ತನಾಲ್ಕು': 64, 'ಅರವತ್ತೈದು': 65, 'ಅರವತ್ತಾರು': 66, 'ಅರವತ್ತೇಳು': 67, 'ಅರವತ್ತೆಂಟು': 68,
  'ಅರವತ್ತೊಂಬತ್ತು': 69, 'ಎಪ್ಪತ್ತು': 70, 'ಎಪ್ಪತ್ತೊಂದು': 71, 'ಎಪ್ಪತ್ತೆರಡು': 72, 'ಎಪ್ಪತ್ಮೂರು': 73, 'ಎಪ್ಪತ್ನಾಲ್ಕು': 74,
  'ಎಪ್ಪತ್ತೈದು': 75, 'ಎಪ್ಪತ್ತಾರು': 76, 'ಎಪ್ಪತ್ತೇಳು': 77, 'ಎಪ್ಪತ್ತೆಂಟು': 78, 'ಎಪ್ಪತ್ತೊಂಬತ್ತು': 79, 'ಎಂಬತ್ತು': 80,
};
const HI_NUMBER_WORDS = {
  'पचास': 50, 'पचपन': 55, 'साठ': 60, 'इकसठ': 61, 'बासठ': 62, 'तिरसठ': 63, 'चौंसठ': 64, 'चौसठ': 64, 'पैंसठ': 65,
  'छियासठ': 66, 'सड़सठ': 67, 'अड़सठ': 68, 'उनहत्तर': 69, 'सत्तर': 70, 'इकहत्तर': 71, 'बहत्तर': 72, 'तिहत्तर': 73,
  'चौहत्तर': 74, 'पचहत्तर': 75, 'छिहत्तर': 76, 'सतहत्तर': 77, 'अठहत्तर': 78, 'उन्यासी': 79, 'अस्सी': 80,
};
const EN_TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const EN_UNITS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
const MONEY_OR_DAYS = /^(rs|rupees|₹|days|day|ದಿನ|ರೂ|रुपये|रुपए|दिन)/;

export function extractAge(text) {
  const t = normalize(text);
  const words = t.split(' ');
  for (let i = 0; i < words.length; i++) {
    const m = words[i].match(/^(\d{1,3})/);
    if (!m) continue;
    const n = Number(m[1]);
    const next = words[i + 1] || '';
    const prev = words[i - 1] || '';
    if (MONEY_OR_DAYS.test(next) || prev === 'rs' || prev === '₹') continue;
    if (n >= 1 && n <= 120) return n;
  }
  const knWords = Object.keys(KN_NUMBER_WORDS).sort((a, b) => b.length - a.length);
  for (const w of knWords) if (t.includes(w)) return KN_NUMBER_WORDS[w];
  for (const w of words) if (HI_NUMBER_WORDS[w]) return HI_NUMBER_WORDS[w];
  for (let i = 0; i < words.length; i++) {
    if (EN_TENS[words[i]]) return EN_TENS[words[i]] + (EN_UNITS[words[i + 1]] || 0);
  }
  return null;
}

// ---------- Who it is for ----------

const RELATIONS = [
  ['grandmother', ['grandmother', 'grandma', 'granny', 'ajji', 'ಅಜ್ಜಿ', 'दादी', 'नानी']],
  ['grandfather', ['grandfather', 'grandpa', 'ajja', 'thatha', 'ಅಜ್ಜ', 'ತಾತ', 'दादा', 'नाना']],
  ['mother', ['mother', 'mom', 'mum', 'amma', 'avva', 'ಅಮ್ಮ', 'ತಾಯಿ', 'ಅವ್ವ', 'माँ', 'मां', 'माता', 'मम्मी', 'माताजी']],
  ['father', ['father', 'dad', 'appa', 'ಅಪ್ಪ', 'ತಂದೆ', 'ಅಪ್ಪಾಜಿ', 'पिता', 'पापा', 'पिताजी', 'बाबूजी']],
];
const SELF_WORDS = ['i', 'im', 'me', 'myself', 'ನಾನು', 'ನನಗೆ', 'ನಂಗೆ', 'ನನ್ನದು', 'मैं', 'मुझे', 'मेरी उम्र', 'मेरी आयु', 'मेरा खुद'];

export function detectRelation(text) {
  for (const [relation, words] of RELATIONS) {
    if (hasAny(text, words)) return relation;
  }
  if (hasAny(text, SELF_WORDS, true)) return 'self';
  return null;
}

// ---------- City or village ----------

const URBAN_WORDS = ['city', 'town', 'urban', 'ನಗರ', 'ಪಟ್ಟಣ', 'ಸಿಟಿ', 'ಟೌನ್', 'शहर', 'नगर', 'कस्बा', 'कस्बे', 'कसबा'];
const RURAL_WORDS = ['village', 'rural', 'ಹಳ್ಳಿ', 'ಗ್ರಾಮ', 'गाँव', 'गांव', 'ग्रामीण', 'देहात'];

export function detectArea(text) {
  const u = firstIndex(text, URBAN_WORDS);
  const r = firstIndex(text, RURAL_WORDS);
  if (u < 0 && r < 0) return null;
  if (u >= 0 && r >= 0) return u < r ? 'urban' : 'rural';
  return u >= 0 ? 'urban' : 'rural';
}

// ---------- Yes / no ----------

const NO_WORDS = [
  'no', 'nope', 'not', 'dont', 'do not', 'doesnt', 'does not', 'havent', 'hasnt', 'nahi', 'illa',
  'ಇಲ್ಲ', 'ಇಲ್ಲಾ', 'ಇಲ್ಲಪ್ಪ', 'ಇಲ್ಲಮ್ಮ', 'ಇಲ್ಲರೀ', 'ಇಲ್ಲವಲ್ಲ', 'ಬೇಡ',
  'नहीं', 'नही', 'ना', 'नहीँ',
];
const YES_WORDS = [
  'yes', 'yeah', 'yep', 'yup', 'have', 'has', 'got it', 'i have', 'haan', 'ide', 'houdu',
  'ಹೌದು', 'ಹೌದ', 'ಇದೆ', 'ಇದೆಪ್ಪ', 'ಇದೆರೀ', 'ಐತೆ', 'ಐತಿ', 'ಉಂಟು', 'ಹಾ', 'ಹಾಂ', 'ಹೂ', 'ಹೂಂ', 'ಹ್ಞೂ', 'ಇವೆ',
  'हाँ', 'हां', 'हा', 'है', 'जी', 'जी हाँ', 'बिल्कुल',
];

export function detectYesNo(text) {
  if (hasAny(text, NO_WORDS, true)) return false;
  if (hasAny(text, YES_WORDS, true)) return true;
  return null;
}

const BPL_WORDS = ['bpl', 'b p l', 'below poverty', 'ಬಿಪಿಎಲ್', 'ಬಿ ಪಿ ಎಲ್', 'ಬಡತನ ರೇಖೆ', 'बीपीएल', 'बी पी एल', 'गरीबी रेखा'];

export function detectBpl(text) {
  if (!hasAny(text, BPL_WORDS)) return null;
  return detectYesNo(text) !== false;
}

// ---------- Commands ----------

const COMMANDS = [
  ['restart', ['start over', 'restart', 'start again', 'new question', 'reset', 'ಮೊದಲಿನಿಂದ', 'ಮತ್ತೆ ಶುರು', 'ಹೊಸ ಪ್ರಶ್ನೆ', 'फिर से शुरू', 'शुरू से', 'नया सवाल']],
  ['share', ['send', 'share', 'whatsapp', 'ಕಳಿಸು', 'ಕಳಿಸಿ', 'ಕಳುಹಿಸು', 'ಕಳುಹಿಸಿ', 'ವಾಟ್ಸಾಪ್', 'ವಾಟ್ಸಪ್', 'भेजो', 'भेजें', 'भेज दो', 'शेयर', 'व्हाट्सऐप', 'व्हाट्सएप']],
  ['back', ['back', 'go back', 'previous', 'ಹಿಂದೆ', 'ಹಿಂದಿನದು', 'पीछे', 'पिछला', 'पिछली']],
  ['repeat', ['repeat', 'again', 'say again', 'pardon', 'ಮತ್ತೆ', 'ಮತ್ತೊಮ್ಮೆ', 'ಇನ್ನೊಮ್ಮೆ', 'ಪುನಃ', 'ರಿಪೀಟ್', 'फिर से', 'फिरसे', 'दोबारा', 'रिपीट']],
  ['next', ['next', 'skip', 'continue', 'go on', 'okay', 'ok', 'ಮುಂದೆ', 'ಮುಂದಿನದು', 'ಮುಂದಕ್ಕೆ', 'ಸ್ಕಿಪ್', 'ಸರಿ', 'आगे', 'अगला', 'अगली', 'छोड़ो', 'ठीक है']],
];

export function detectCommand(text) {
  for (const [command, words] of COMMANDS) {
    if (hasAny(text, words, true)) return command;
  }
  return null;
}

// ---------- Districts (only used to say where to apply) ----------

export const DISTRICTS = [
  ['Bagalkote', 'ಬಾಗಲಕೋಟೆ', ['bagalkot']], ['Ballari', 'ಬಳ್ಳಾರಿ', ['bellary']], ['Belagavi', 'ಬೆಳಗಾವಿ', ['belgaum', 'बेलगाम']],
  ['Bengaluru Rural', 'ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ', ['bangalore rural']],
  ['Bengaluru', 'ಬೆಂಗಳೂರು', ['bangalore', 'bengaluru', 'बेंगलुरु', 'बैंगलोर']],
  ['Bidar', 'ಬೀದರ್', []], ['Chamarajanagar', 'ಚಾಮರಾಜನಗರ', []], ['Chikkaballapur', 'ಚಿಕ್ಕಬಳ್ಳಾಪುರ', []],
  ['Chikkamagaluru', 'ಚಿಕ್ಕಮಗಳೂರು', ['chikmagalur']], ['Chitradurga', 'ಚಿತ್ರದುರ್ಗ', []],
  ['Dakshina Kannada', 'ದಕ್ಷಿಣ ಕನ್ನಡ', ['mangaluru', 'mangalore', 'ಮಂಗಳೂರು', 'मंगलौर', 'मंगलुरु']],
  ['Davanagere', 'ದಾವಣಗೆರೆ', ['davangere']], ['Dharwad', 'ಧಾರವಾಡ', ['hubli', 'hubballi', 'ಹುಬ್ಬಳ್ಳಿ', 'धारवाड़', 'हुबली']],
  ['Gadag', 'ಗದಗ', []], ['Hassan', 'ಹಾಸನ', []], ['Haveri', 'ಹಾವೇರಿ', []], ['Kalaburagi', 'ಕಲಬುರಗಿ', ['gulbarga']],
  ['Kodagu', 'ಕೊಡಗು', ['coorg', 'madikeri']], ['Kolar', 'ಕೋಲಾರ', []], ['Koppal', 'ಕೊಪ್ಪಳ', []],
  ['Mandya', 'ಮಂಡ್ಯ', ['मांड्या', 'मंड्या']], ['Mysuru', 'ಮೈಸೂರು', ['mysore', 'मैसूर', 'मैसूरु']], ['Raichur', 'ರಾಯಚೂರು', []],
  ['Ramanagara', 'ರಾಮನಗರ', ['bengaluru south']], ['Shivamogga', 'ಶಿವಮೊಗ್ಗ', ['shimoga']], ['Tumakuru', 'ತುಮಕೂರು', ['tumkur']],
  ['Udupi', 'ಉಡುಪಿ', ['उडुपी']], ['Uttara Kannada', 'ಉತ್ತರ ಕನ್ನಡ', ['karwar']], ['Vijayapura', 'ವಿಜಯಪುರ', ['bijapur']],
  ['Vijayanagara', 'ವಿಜಯನಗರ', ['hosapete', 'hospet']], ['Yadgir', 'ಯಾದಗಿರಿ', []],
];

export function detectDistrict(text) {
  for (const [en, kn, aliases] of DISTRICTS) {
    if (hasAny(text, [en, kn, ...aliases])) return { en, kn };
  }
  return null;
}

// ---------- Documents mentioned (for "she has no X") ----------

export function detectDocument(text, documents, allowedIds) {
  const ids = allowedIds || Object.keys(documents);
  let best = null;
  let bestLen = 0;
  for (const id of ids) {
    for (const word of documents[id].keywords || []) {
      if (hasAny(text, [word]) && word.length > bestLen) {
        best = id;
        bestLen = word.length;
      }
    }
  }
  return best;
}

// ---------- Everything at once ----------

export function understand(text) {
  const { service, candidates, scholarship } = detectService(text);
  return {
    text,
    service,
    candidates,
    scholarship,
    age: extractAge(text),
    relation: detectRelation(text),
    area: detectArea(text),
    bpl: detectBpl(text),
    district: detectDistrict(text),
    yes: detectYesNo(text),
    command: detectCommand(text),
  };
}
