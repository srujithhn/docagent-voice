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
  widow_pension: ['widow', 'vidhava', 'ವಿಧವೆ', 'ವಿಧವಾ', 'विधवा'],
  disability_pension: [
    'disability', 'disabled', 'handicap', 'udid', 'divyang', 'viklang', 'blind', 'deaf', 'wheelchair', 'polio', 'paralysed', 'paralyzed',
    'ಅಂಗವಿಕಲ', 'ವಿಕಲಚೇತನ', 'ದಿವ್ಯಾಂಗ', 'ಯುಡಿಐಡಿ', 'ಅಂಧ', 'ಕುರುಡ', 'ಕಿವುಡ', 'ಮೂಕ', 'ಪೋಲಿಯೊ', 'ಪೋಲಿಯೋ',
    'विकलांग', 'दिव्यांग', 'यूडीआईडी', 'अंधा', 'अंधी', 'नेत्रहीन', 'बहरा', 'बहरी', 'गूंगा', 'पोलियो', 'लकवा',
  ],
  old_age_pension: [
    'old age pension', 'old age', 'oldage', 'pension', 'pinchani', 'vruddhapya', 'vriddhapya', 'masashana',
    'ಪಿಂಚಣಿ', 'ಪೆನ್ಷನ್', 'ಪೆನ್ಶನ್', 'ವೃದ್ಧಾಪ್ಯ', 'ವೃದ್ಯಾಪ್ಯ', 'ಮಾಸಾಶನ',
    'पेंशन', 'पेन्शन', 'वृद्धावस्था', 'बुढ़ापा', 'वृद्धा',
  ],
  income_certificate: ['income', 'aadaya', 'adaya', 'ಆದಾಯ', 'ಇನ್ಕಮ್', 'ಇನ್‌ಕಮ್', 'आय प्रमाण', 'आय का', 'आय सर्टिफिकेट', 'इनकम', 'आमदनी'],
  caste_certificate: ['caste', 'jati', 'jaati', 'ಜಾತಿ', 'ಕ್ಯಾಸ್ಟ್', 'जाति', 'कास्ट'],
  residence_certificate: ['residence', 'domicile', 'ನಿವಾಸ', 'ವಾಸಸ್ಥಳ', 'निवास', 'रेजिडेंस'],
};

// Words that clearly mean the old-age pension, as opposed to just "pension".
const OLD_AGE_WORDS = ['old age', 'oldage', 'vruddhapya', 'vriddhapya', 'ವೃದ್ಧಾಪ್ಯ', 'ವೃದ್ಯಾಪ್ಯ', 'वृद्धावस्था', 'बुढ़ापा', 'वृद्धा'];
const PENSION_WORDS = ['pension', 'pinchani', 'masashana', 'ಪಿಂಚಣಿ', 'ಪೆನ್ಷನ್', 'ಪೆನ್ಶನ್', 'ಮಾಸಾಶನ', 'ವೇತನ', 'पेंशन', 'पेन्शन'];
const CERTIFICATE_WORDS = ['certificate', 'udid', 'card', 'ಪ್ರಮಾಣ', 'ಕಾರ್ಡ್', 'ಯುಡಿಐಡಿ', 'प्रमाण', 'सर्टिफिकेट', 'कार्ड', 'यूडीआईडी'];

const SCHOLARSHIP_WORDS = ['scholarship', 'ವಿದ್ಯಾರ್ಥಿ ವೇತನ', 'ಸ್ಕಾಲರ್‌ಶಿಪ್', 'ಸ್ಕಾಲರ್ಶಿಪ್', 'ಸ್ಕಾಲರ್', 'छात्रवृत्ति', 'स्कॉलरशिप', 'स्कालरशिप'];
const CERTIFICATES = ['income_certificate', 'caste_certificate', 'residence_certificate'];

export function detectService(text) {
  const found = Object.keys(SERVICE_WORDS).filter((id) => hasAny(text, SERVICE_WORDS[id]));
  const scholarship = hasAny(text, SCHOLARSHIP_WORDS);
  const result = (service) => ({ service, candidates: found, scholarship });
  if (found.includes('sandhya_suraksha')) return result('sandhya_suraksha');
  // "Old-age pension" said clearly wins, even for a widow or a disabled person.
  if (hasAny(text, OLD_AGE_WORDS)) return result('old_age_pension');
  const pension = hasAny(text, PENSION_WORDS);
  if (found.includes('widow_pension')) return result('widow_pension');
  if (found.includes('disability_pension')) {
    // "Disability certificate" or "UDID card" is a different service we don't cover yet.
    if (!pension && hasAny(text, CERTIFICATE_WORDS)) return { service: null, candidates: [], scholarship, notCovered: 'disability_certificate' };
    return result('disability_pension');
  }
  if (found.includes('old_age_pension')) return result('old_age_pension');
  const certs = found.filter((id) => CERTIFICATES.includes(id));
  if (certs.length === 1) return result(certs[0]);
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
  ['daughter', ['daughter', 'magalu', 'ಮಗಳು', 'ಮಗಳಿಗೆ', 'बेटी', 'बिटिया']],
  ['son', ['son', 'maga', 'ಮಗ', 'ಮಗನಿಗೆ', 'बेटा', 'बेटे', 'पुत्र']],
  ['sister', ['sister', 'akka', 'thangi', 'ಅಕ್ಕ', 'ತಂಗಿ', 'बहन', 'दीदी']],
  ['brother', ['brother', 'anna', 'ಅಣ್ಣ', 'भाई', 'भैया']],
  ['wife', ['wife', 'hendathi', 'ಹೆಂಡತಿ', 'ಪತ್ನಿ', 'पत्नी', 'बीवी']],
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
//
// People answer in many ways, and the speech engine writes the same word in
// different scripts ("yes", "ಯೆಸ್", "यस"). So every language mode accepts
// every language's words. Kannada stems like ಇದೆ / ಇಲ್ಲ also match with
// endings (ಇದೆಯಲ್ಲ, ಇಲ್ಲಪ್ಪ), but not ಇಲ್ಲಿ ("here") or the question ಇದೆಯೇ.

const NO_WORDS = [
  'no', 'nope', 'nah', 'not', 'dont', 'do not', 'doesnt', 'does not', 'havent', 'hasnt', 'dont have', 'missing',
  'nahi', 'nahin', 'nai', 'illa', 'illai', 'illri', 'ila',
  'ಬೇಡ', 'ನೋ', 'ನಾಟ್', 'ಇಲ್ರೀ', 'ಇಲ್ರಿ',
  'नहीं', 'नही', 'ना', 'नहीँ', 'नई', 'नो', 'नहीं जी', 'जी नहीं',
];
const YES_WORDS = [
  'yes', 'yeah', 'yea', 'yeh', 'ya', 'yah', 'yep', 'yup', 'yess', 'yas', 'sure', 'correct', 'right', 'of course',
  'have', 'has', 'i have', 'have it', 'we have', 'got it', 'available', 'its there', 'it is there',
  'haan', 'haa', 'han', 'houdu', 'howdu', 'ide', 'idhe', 'aithe', 'untu', 'hai', 'haanji', 'ji haan',
  'ಹಾ', 'ಹಾಂ', 'ಹಾಂಜಿ', 'ಹೂ', 'ಹೂಂ', 'ಹ್ಞೂ', 'ಹ್ಞಾ', 'ಇದೇ', 'ಇವೆ', 'ಉಂಟು', 'ಇರುತ್ತೆ', 'ಎಸ್', 'ಯೆಸ್', 'ಯಸ್', 'ಯಾ', 'ಕರೆಕ್ಟ್', 'ಶೂರ್',
  'हाँ', 'हां', 'हा', 'हाँजी', 'हांजी', 'जी', 'जी हाँ', 'जी हां', 'है', 'हैं', 'बिल्कुल', 'यस', 'येस', 'या', 'सही', 'करेक्ट', 'श्योर',
];
const KN_NO = /(^|\s)ಇಲ್ಲ(?![ಿೇ])/;
const KN_YES = /(^|\s)(ಇದೆ(?!ಯೇ|ಯಾ)|ಹೌದ|ಐತ)/;

// A single short word is often misheard ("no" -> "know", "yes" -> "s").
// These count only when they are the whole answer.
const ONLY_NO = new Set(['know', 'now', 'noh', 'nooo', 'no no', 'naa', 'nah nah', 'ನೊ', 'ನೋನೋ', 'नोह', 'ना ना']);
const ONLY_YES = new Set(['s', 'es', 'ys', 'yesh', 'yash', 'jes', 'yes yes', 'yaa', 'haa haa', 'ಎಸ್ ಎಸ್', 'ಯಸ್ ಯಸ್', 'यस यस']);

export function detectYesNo(text) {
  const whole = normalize(text).trim();
  if (ONLY_NO.has(whole)) return false;
  if (ONLY_YES.has(whole)) return true;
  const t = ` ${normalize(text)} `;
  if (hasAny(text, NO_WORDS, true) || KN_NO.test(t)) return false;
  if (hasAny(text, YES_WORDS, true) || KN_YES.test(t)) return true;
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
  ['wait', [
    'wait', 'hold on', 'one minute', 'one second', 'one moment', 'stop', 'pause',
    'ಒಂದ್ನಿಮಿಷ', 'ಒಂದು ನಿಮಿಷ', 'ಸ್ವಲ್ಪ ತಡಿ', 'ತಡೀರಿ', 'ತಡಿ', 'ನಿಲ್ಲಿಸಿ', 'ನಿಲ್ಲು', 'ವೇಟ್', 'ಸ್ಟಾಪ್',
    'रुको', 'रुकिए', 'एक मिनट', 'एक सेकंड', 'ठहरो', 'स्टॉप', 'वेट',
  ]],
  ['back', ['back', 'go back', 'previous', 'last one', 'ಹಿಂದೆ', 'ಹಿಂದಿನದು', 'ಹಿಂದಕ್ಕೆ', 'ಬ್ಯಾಕ್', 'पीछे', 'पिछला', 'पिछली', 'वापस', 'बैक']],
  ['repeat', [
    'repeat', 'again', 'say again', 'one more time', 'once more', 'come again', 'pardon', 'sorry', 'what',
    'ಮತ್ತೆ', 'ಮತ್ತೊಮ್ಮೆ', 'ಇನ್ನೊಮ್ಮೆ', 'ಮತ್ತೊಂದ್ಸಲ', 'ಇನ್ನೊಂದ್ಸಲ', 'ಪುನಃ', 'ರಿಪೀಟ್', 'ಏನು', 'ಏನಂದ್ರಿ', 'ಅರ್ಥ ಆಗಲಿಲ್ಲ', 'ಕೇಳಿಸಲಿಲ್ಲ', 'ಸಾರಿ',
    'फिर से', 'फिरसे', 'दोबारा', 'रिपीट', 'क्या', 'क्या बोला', 'एक बार और', 'समझ नहीं आया', 'सुनाई नहीं दिया', 'सॉरी',
  ]],
  ['next', [
    'next', 'skip', 'continue', 'go on', 'move on', 'go ahead', 'okay', 'ok',
    'ಮುಂದೆ', 'ಮುಂದಿನದು', 'ಮುಂದಿನ', 'ಮುಂದಕ್ಕೆ', 'ಸ್ಕಿಪ್', 'ಸರಿ', 'ಆಯ್ತು', 'ನೆಕ್ಸ್ಟ್', 'ಓಕೆ', 'ಆಮೇಲೆ',
    'आगे', 'अगला', 'अगली', 'आगे बढ़ो', 'छोड़ो', 'ठीक है', 'नेक्स्ट', 'ओके', 'चलो', 'स्किप',
  ]],
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
    notCovered: detectService(text).notCovered || null,
    age: extractAge(text),
    relation: detectRelation(text),
    area: detectArea(text),
    bpl: detectBpl(text),
    district: detectDistrict(text),
    yes: detectYesNo(text),
    command: detectCommand(text),
  };
}

// ---------- Switching language by voice ----------

const LANGUAGE_WORDS = {
  en: ['english', 'inglish', 'ಇಂಗ್ಲಿಷ್', 'ಇಂಗ್ಲೀಷ್', 'अंग्रेज़ी', 'अंग्रेजी', 'इंग्लिश'],
  kn: ['kannada', 'ಕನ್ನಡ', 'कन्नड़', 'कन्नड'],
  hi: ['hindi', 'ಹಿಂದಿ', 'हिंदी', 'हिन्दी'],
};

// Only a short request like "English" or "ಕನ್ನಡದಲ್ಲಿ ಹೇಳಿ" switches,
// so a sentence that merely mentions a language does not.
export function detectLanguageSwitch(text) {
  const words = normalize(text).split(' ').filter(Boolean);
  if (!words.length || words.length > 4) return null;
  for (const [lang, terms] of Object.entries(LANGUAGE_WORDS)) {
    if (hasAny(text, terms)) return lang;
  }
  return null;
}
