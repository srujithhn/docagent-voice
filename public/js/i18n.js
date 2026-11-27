// Every sentence the app shows or speaks, in Kannada, Hindi and English.
// Placeholders like {age} are filled in by tr().

export const LANGS = {
  kn: { speech: 'kn-IN', label: 'ಕನ್ನಡ' },
  hi: { speech: 'hi-IN', label: 'हिंदी' },
  en: { speech: 'en-IN', label: 'English' },
};

const STRINGS = {
  // ----- Screen -----
  title: { en: 'DocAgent Voice', kn: 'ಡಾಕ್‌ಏಜೆಂಟ್ ವಾಯ್ಸ್', hi: 'डॉकएजेंट वॉइस' },
  tagline: {
    en: 'Ask out loud which documents to carry for a government service in Karnataka.',
    kn: 'ಸರ್ಕಾರಿ ಸೇವೆಗೆ ಯಾವ ದಾಖಲೆ ತರಬೇಕು ಎಂದು ಮಾತಿನಲ್ಲೇ ಕೇಳಿ.',
    hi: 'कर्नाटक की सरकारी सेवा के लिए कौन से कागज़ ले जाने हैं, बोलकर पूछिए।',
  },
  hint: {
    en: 'Tap the mic and say what you need. For example: “My mother is 62 and wants the old-age pension in Mandya.”',
    kn: 'ಮೈಕ್ ಒತ್ತಿ, ನಿಮಗೆ ಏನು ಬೇಕು ಎಂದು ಹೇಳಿ. ಉದಾಹರಣೆಗೆ: “ನನ್ನ ಅಮ್ಮನಿಗೆ 62 ವರ್ಷ, ಮಂಡ್ಯದಲ್ಲಿ ವೃದ್ಧಾಪ್ಯ ವೇತನ ಬೇಕು.”',
    hi: 'माइक दबाइए और बताइए आपको क्या चाहिए। जैसे: “मेरी माँ 62 साल की हैं, उन्हें मांड्या में वृद्धावस्था पेंशन चाहिए।”',
  },
  tapToSpeak: { en: 'Tap to speak', kn: 'ಮಾತನಾಡಲು ಒತ್ತಿ', hi: 'बोलने के लिए दबाएँ' },
  listening: { en: 'Speak now…', kn: 'ಈಗ ಹೇಳಿ…', hi: 'अब बोलिए…' },
  getReady: { en: 'One moment…', kn: 'ಒಂದು ಕ್ಷಣ…', hi: 'एक पल…' },
  tapToAnswer: { en: 'Tap the mic to answer', kn: 'ಉತ್ತರಿಸಲು ಮೈಕ್ ಒತ್ತಿ', hi: 'जवाब देने के लिए माइक दबाएँ' },
  speaking: { en: 'Speaking… tap to talk', kn: 'ಹೇಳುತ್ತಿದ್ದೇನೆ… ಮಾತನಾಡಲು ಒತ್ತಿ', hi: 'बोल रहे हैं… बोलने के लिए दबाएँ' },
  micNetwork: {
    en: 'Voice input needs the internet. Check your connection, or type below.',
    kn: 'ಧ್ವನಿ ಇನ್‌ಪುಟ್‌ಗೆ ಇಂಟರ್ನೆಟ್ ಬೇಕು. ಸಂಪರ್ಕ ನೋಡಿ, ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.',
    hi: 'आवाज़ से इनपुट के लिए इंटरनेट चाहिए। कनेक्शन देखें, या नीचे टाइप करें।',
  },
  micNone: { en: 'No microphone found. Please type below.', kn: 'ಮೈಕ್ರೋಫೋನ್ ಸಿಗಲಿಲ್ಲ. ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.', hi: 'माइक्रोफ़ोन नहीं मिला। नीचे टाइप करें।' },
  typeHere: { en: 'Or type here', kn: 'ಅಥವಾ ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ', hi: 'या यहाँ टाइप करें' },
  send: { en: 'Send', kn: 'ಕಳಿಸಿ', hi: 'भेजें' },
  heard: { en: 'I heard: “{text}”', kn: 'ನಾನು ಕೇಳಿದ್ದು: “{text}”', hi: 'मैंने सुना: “{text}”' },
  heardFix: { en: 'Not right? Tap the mic again or type it.', kn: 'ಸರಿಯಿಲ್ಲವೇ? ಮತ್ತೆ ಮೈಕ್ ಒತ್ತಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.', hi: 'सही नहीं? फिर से माइक दबाइए या टाइप कीजिए।' },
  handsFree: { en: 'Keep listening after each answer (hands-free)', kn: 'ಪ್ರತಿ ಉತ್ತರದ ನಂತರ ತಾನಾಗಿ ಮತ್ತೆ ಕೇಳು (ಕೈ ಬಳಸದೆ)', hi: 'हर जवाब के बाद अपने-आप फिर सुनें (बिना हाथ लगाए)' },
  accessTitle: { en: 'Accessibility', kn: 'ಸುಲಭ ಬಳಕೆ (ಅಂಗವಿಕಲರಿಗೆ)', hi: 'सुलभता (दिव्यांगजन के लिए)' },
  optSpeak: { en: 'Read answers aloud', kn: 'ಉತ್ತರಗಳನ್ನು ಓದಿ ಹೇಳು', hi: 'जवाब बोलकर सुनाएँ' },
  optSlow: { en: 'Speak slowly', kn: 'ನಿಧಾನವಾಗಿ ಮಾತನಾಡು', hi: 'धीरे बोलें' },
  optLarge: { en: 'Large text', kn: 'ದೊಡ್ಡ ಅಕ್ಷರಗಳು', hi: 'बड़े अक्षर' },
  optContrast: { en: 'High contrast (yellow on black)', kn: 'ಸ್ಪಷ್ಟ ಬಣ್ಣಗಳು (ಕಪ್ಪು ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಹಳದಿ)', hi: 'गहरे रंग (काले पर पीला)' },
  accessNote: {
    en: 'Keyboard: press Space to talk and Esc to stop. Using a screen reader? Turn off “Read answers aloud” so you don’t hear everything twice. Can’t speak? Type or tap the buttons; every answer is also shown as text.',
    kn: 'ಕೀಬೋರ್ಡ್: ಮಾತನಾಡಲು Space, ನಿಲ್ಲಿಸಲು Esc ಒತ್ತಿ. ಸ್ಕ್ರೀನ್ ರೀಡರ್ ಬಳಸುತ್ತಿದ್ದರೆ “ಉತ್ತರಗಳನ್ನು ಓದಿ ಹೇಳು” ಆಫ್ ಮಾಡಿ, ಆಗ ಎರಡು ಬಾರಿ ಕೇಳಿಸುವುದಿಲ್ಲ. ಮಾತನಾಡಲು ಆಗದಿದ್ದರೆ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಬಟನ್ ಒತ್ತಿ; ಪ್ರತಿ ಉತ್ತರವೂ ಅಕ್ಷರದಲ್ಲಿ ಕಾಣುತ್ತದೆ.',
    hi: 'कीबोर्ड: बोलने के लिए Space, रोकने के लिए Esc दबाएँ। स्क्रीन रीडर इस्तेमाल करते हैं? “जवाब बोलकर सुनाएँ” बंद कर दें, ताकि दो बार न सुनाई दे। बोल नहीं सकते? टाइप करें या बटन दबाएँ; हर जवाब टेक्स्ट में भी दिखता है।',
  },
  srHave: { en: 'have it', kn: 'ಇದೆ', hi: 'है' },
  srMissing: { en: 'missing', kn: 'ಇಲ್ಲ', hi: 'नहीं है' },
  srPending: { en: 'not checked yet', kn: 'ಇನ್ನೂ ಹೇಳಿಲ್ಲ', hi: 'अभी बाकी' },
  srCurrent: { en: 'current item', kn: 'ಈಗಿನದು', hi: 'अभी वाला' },
  noMic: {
    en: 'Voice input may not work in this browser. Open the link in Chrome (or Safari on iPhone), or type below.',
    kn: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಕೆಲಸ ಮಾಡದೇ ಇರಬಹುದು. ಲಿಂಕ್ ಅನ್ನು ಕ್ರೋಮ್‌ನಲ್ಲಿ (ಐಫೋನ್‌ನಲ್ಲಿ ಸಫಾರಿ) ತೆರೆಯಿರಿ, ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.',
    hi: 'इस ब्राउज़र में आवाज़ से इनपुट शायद न चले। लिंक को क्रोम में (आईफ़ोन पर सफ़ारी में) खोलें, या नीचे टाइप करें।',
  },
  noVoice: {
    en: 'This device has no voice for this language, so please read the answer on screen.',
    kn: 'ಈ ಸಾಧನದಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಇಲ್ಲ. ದಯವಿಟ್ಟು ಉತ್ತರವನ್ನು ಪರದೆಯ ಮೇಲೆ ಓದಿ.',
    hi: 'इस डिवाइस में हिंदी आवाज़ नहीं है, कृपया जवाब स्क्रीन पर पढ़ें।',
  },
  micBlocked: {
    en: 'The microphone is blocked. Allow it in the browser, or type below.',
    kn: 'ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ಇಲ್ಲ. ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಅನುಮತಿ ಕೊಡಿ, ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.',
    hi: 'माइक्रोफ़ोन की अनुमति नहीं है। ब्राउज़र में अनुमति दें, या नीचे टाइप करें।',
  },
  notHeard: { en: 'I did not catch that. Please try again.', kn: 'ಸರಿಯಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ.', hi: 'ठीक से सुनाई नहीं दिया। फिर से बोलिए।' },
  checklistTitle: { en: 'Your checklist', kn: 'ನಿಮ್ಮ ದಾಖಲೆ ಪಟ್ಟಿ', hi: 'आपकी सूची' },
  shareWhatsApp: { en: 'Send on WhatsApp', kn: 'ವಾಟ್ಸಾಪ್‌ಗೆ ಕಳಿಸಿ', hi: 'व्हाट्सऐप पर भेजें' },
  startOver: { en: 'Start over', kn: 'ಮೊದಲಿನಿಂದ', hi: 'शुरू से' },
  officialWording: { en: 'Official wording', kn: 'ಅಧಿಕೃತ ಪಟ್ಟಿ', hi: 'आधिकारिक सूची' },
  privacy: {
    en: 'This app never asks for Aadhaar numbers or photos, and keeps nothing on a server. Your browser’s speech service turns your voice into text.',
    kn: 'ಈ ಆಪ್ ಆಧಾರ್ ಸಂಖ್ಯೆ ಅಥವಾ ಫೋಟೋ ಕೇಳುವುದಿಲ್ಲ, ಸರ್ವರ್‌ನಲ್ಲಿ ಏನನ್ನೂ ಉಳಿಸುವುದಿಲ್ಲ. ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನ ಧ್ವನಿ ಸೇವೆ ಮಾತನ್ನು ಅಕ್ಷರಕ್ಕೆ ಬದಲಿಸುತ್ತದೆ.',
    hi: 'यह ऐप आधार नंबर या फोटो नहीं मांगता, और सर्वर पर कुछ नहीं रखता। आपकी आवाज़ को ब्राउज़र की स्पीच सेवा टेक्स्ट में बदलती है।',
  },

  // ----- Quick-reply chips -----
  chipYes: { en: 'Yes', kn: 'ಹೌದು', hi: 'हाँ' },
  chipNo: { en: 'No', kn: 'ಇಲ್ಲ', hi: 'नहीं' },
  chipHave: { en: 'I have it', kn: 'ಇದೆ', hi: 'है' },
  chipMissing: { en: "Don't have it", kn: 'ಇಲ್ಲ', hi: 'नहीं है' },
  chipNext: { en: 'Next', kn: 'ಮುಂದೆ', hi: 'आगे' },
  chipRepeat: { en: 'Repeat', kn: 'ಮತ್ತೊಮ್ಮೆ', hi: 'फिर से' },
  chipBack: { en: 'Back', kn: 'ಹಿಂದೆ', hi: 'पीछे' },
  chipCity: { en: 'City or town', kn: 'ನಗರ / ಪಟ್ಟಣ', hi: 'शहर / कस्बा' },
  chipVillage: { en: 'Village', kn: 'ಹಳ್ಳಿ', hi: 'गाँव' },
  chipSend: { en: 'Send', kn: 'ಕಳಿಸು', hi: 'भेजो' },

  // ----- Conversation -----
  unknownService: {
    en: 'Right now I can help with these services in Karnataka: {list}. Which one do you need?',
    kn: 'ಸದ್ಯಕ್ಕೆ ಕರ್ನಾಟಕದ ಈ ಸೇವೆಗಳಿಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ: {list}. ನಿಮಗೆ ಯಾವುದು ಬೇಕು?',
    hi: 'अभी कर्नाटक की इन सेवाओं में मदद मिल सकती है: {list}। आपको कौन सा चाहिए?',
  },
  whichOne: {
    en: 'Which one do you need first: {list}?',
    kn: 'ಮೊದಲು ಯಾವುದು ಬೇಕು: {list}?',
    hi: 'पहले कौन सा चाहिए: {list}?',
  },
  notCoveredDisabilityCert: {
    en: 'I don’t have the steps for the disability certificate (UDID card) yet. I can help with the disability pension.',
    kn: 'ಅಂಗವಿಕಲತೆ ಪ್ರಮಾಣಪತ್ರ (ಯುಡಿಐಡಿ ಕಾರ್ಡ್) ಮಾಹಿತಿ ನನ್ನ ಬಳಿ ಇನ್ನೂ ಇಲ್ಲ. ಅಂಗವಿಕಲರ ಪಿಂಚಣಿಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.',
    hi: 'दिव्यांगता प्रमाण पत्र (यूडीआईडी कार्ड) की जानकारी अभी मेरे पास नहीं है। दिव्यांग पेंशन में मदद मिल सकती है।',
  },
  askDisability40_self: {
    en: 'Is your disability 40 percent or more, as written on the disability certificate?',
    kn: 'ನಿಮ್ಮ ಅಂಗವಿಕಲತೆ ಶೇಕಡಾ 40 ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು ಇದೆಯೇ (ಪ್ರಮಾಣಪತ್ರದ ಪ್ರಕಾರ)?',
    hi: 'क्या आपकी दिव्यांगता 40 प्रतिशत या उससे ज़्यादा है (प्रमाण पत्र के अनुसार)?',
  },
  askDisability40_other: {
    en: 'Is the disability 40 percent or more, as written on the disability certificate?',
    kn: 'ಅವರ ಅಂಗವಿಕಲತೆ ಶೇಕಡಾ 40 ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು ಇದೆಯೇ (ಪ್ರಮಾಣಪತ್ರದ ಪ್ರಕಾರ)?',
    hi: 'क्या उनकी दिव्यांगता 40 प्रतिशत या उससे ज़्यादा है (प्रमाण पत्र के अनुसार)?',
  },
  notDisability40: {
    en: 'The official rule for this pension is disability above 40 percent, so it may not be approved. Please confirm at the counter. Here is the list anyway.',
    kn: 'ಈ ಪಿಂಚಣಿಗೆ ಅಧಿಕೃತ ನಿಯಮ: ಶೇಕಡಾ 40 ಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಅಂಗವಿಕಲತೆ. ಹಾಗಾಗಿ ಮಂಜೂರು ಆಗದೇ ಇರಬಹುದು; ಕೌಂಟರ್‌ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ. ಆದರೂ ಪಟ್ಟಿ ಇಲ್ಲಿದೆ.',
    hi: 'इस पेंशन का आधिकारिक नियम: 40 प्रतिशत से ज़्यादा दिव्यांगता। इसलिए मंज़ूरी न मिले, ऐसा हो सकता है; काउंटर पर पक्का कर लीजिए। फिर भी सूची यह रही।',
  },
  scholarship: {
    en: 'Scholarship forms often ask for an income certificate and a caste certificate. Which one should we start with?',
    kn: 'ವಿದ್ಯಾರ್ಥಿ ವೇತನದ ಅರ್ಜಿಗೆ ಸಾಮಾನ್ಯವಾಗಿ ಆದಾಯ ಮತ್ತು ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ ಕೇಳುತ್ತಾರೆ. ಯಾವುದರಿಂದ ಶುರು ಮಾಡೋಣ?',
    hi: 'स्कॉलरशिप फॉर्म में अक्सर आय और जाति प्रमाण पत्र मांगे जाते हैं। किससे शुरू करें?',
  },
  askAge_self: { en: 'How old are you?', kn: 'ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?', hi: 'आपकी उम्र कितनी है?' },
  askAge_other: { en: 'How old is {who}?', kn: 'ಅವರ ವಯಸ್ಸು ಎಷ್ಟು?', hi: 'उनकी उम्र कितनी है?' },
  askBpl_self: {
    en: 'Do you have a BPL (below poverty line) ration card?',
    kn: 'ನಿಮ್ಮ ಬಳಿ ಬಿಪಿಎಲ್ ರೇಷನ್ ಕಾರ್ಡ್ ಇದೆಯೇ?',
    hi: 'क्या आपके पास बीपीएल राशन कार्ड है?',
  },
  askBpl_other: {
    en: 'Does {who} have a BPL (below poverty line) ration card?',
    kn: 'ಅವರ ಬಳಿ ಬಿಪಿಎಲ್ ರೇಷನ್ ಕಾರ್ಡ್ ಇದೆಯೇ?',
    hi: 'क्या उनके पास बीपीएल राशन कार्ड है?',
  },
  askArea_self: {
    en: 'Do you live in a city or town, or in a village?',
    kn: 'ನೀವು ನಗರ ಅಥವಾ ಪಟ್ಟಣದಲ್ಲಿ ಇದ್ದೀರಾ, ಇಲ್ಲ ಹಳ್ಳಿಯಲ್ಲಿ?',
    hi: 'आप शहर या कस्बे में रहते हैं, या गाँव में?',
  },
  askArea_other: {
    en: 'Does {who} live in a city or town, or in a village?',
    kn: 'ಅವರು ನಗರ ಅಥವಾ ಪಟ್ಟಣದಲ್ಲಿ ಇದ್ದಾರಾ, ಇಲ್ಲ ಹಳ್ಳಿಯಲ್ಲಿ?',
    hi: 'वे शहर या कस्बे में रहते हैं, या गाँव में?',
  },
  askCasteProof_self: {
    en: 'Do you have an old caste certificate, or a school certificate?',
    kn: 'ನಿಮ್ಮ ಬಳಿ ಹಳೆಯ ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ ಅಥವಾ ಶಾಲೆಯ ಪ್ರಮಾಣಪತ್ರ ಇದೆಯೇ?',
    hi: 'क्या आपके पास पुराना जाति प्रमाण पत्र, या स्कूल का प्रमाण पत्र है?',
  },
  askCasteProof_other: {
    en: 'Does {who} have an old caste certificate, or a school certificate?',
    kn: 'ಅವರ ಬಳಿ ಹಳೆಯ ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ ಅಥವಾ ಶಾಲೆಯ ಪ್ರಮಾಣಪತ್ರ ಇದೆಯೇ?',
    hi: 'क्या उनके पास पुराना जाति प्रमाण पत्र, या स्कूल का प्रमाण पत्र है?',
  },
  sayYesNo: { en: 'Sorry, please say yes or no.', kn: 'ಕ್ಷಮಿಸಿ, ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.', hi: 'माफ़ कीजिए, हाँ या नहीं बोलिए।' },
  sayArea: { en: 'Please say city or village.', kn: 'ನಗರ ಅಥವಾ ಹಳ್ಳಿ ಎಂದು ಹೇಳಿ.', hi: 'कृपया शहर या गाँव बोलिए।' },
  sayAge: { en: 'Please say the age as a number, like 62.', kn: 'ವಯಸ್ಸನ್ನು ಸಂಖ್ಯೆಯಲ್ಲಿ ಹೇಳಿ, ಉದಾಹರಣೆಗೆ 62.', hi: 'उम्र नंबर में बताइए, जैसे 62।' },
  tooYoung: {
    en: 'The official rule for the {service} is age above {min}. At {age}, it is not possible to apply yet.',
    kn: '{service}ಕ್ಕೆ ಅಧಿಕೃತ ನಿಯಮ: {min} ವರ್ಷ ಮೇಲ್ಪಟ್ಟವರು. {age} ವರ್ಷಕ್ಕೆ ಇನ್ನೂ ಅರ್ಜಿ ಹಾಕಲು ಆಗುವುದಿಲ್ಲ.',
    hi: '{service} का आधिकारिक नियम: {min} साल से ऊपर। {age} साल पर अभी आवेदन नहीं हो सकता।',
  },
  notBpl: {
    en: 'This pension is for below-poverty-line families, so without a BPL card it may not be approved. Please confirm at the counter. Here is the list anyway.',
    kn: 'ಈ ವೇತನ ಬಡತನ ರೇಖೆಗಿಂತ ಕೆಳಗಿನ ಕುಟುಂಬಗಳಿಗೆ. ಬಿಪಿಎಲ್ ಕಾರ್ಡ್ ಇಲ್ಲದಿದ್ದರೆ ಮಂಜೂರು ಆಗದೇ ಇರಬಹುದು; ಕೌಂಟರ್‌ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ. ಆದರೂ ಪಟ್ಟಿ ಇಲ್ಲಿದೆ.',
    hi: 'यह पेंशन गरीबी रेखा से नीचे के परिवारों के लिए है, इसलिए बीपीएल कार्ड के बिना मंज़ूरी न मिले, ऐसा हो सकता है। काउंटर पर पक्का कर लीजिए। फिर भी सूची यह रही।',
  },
  alsoSandhya: {
    en: 'At {age}, Sandhya Suraksha may also fit (age above 65, family income below ₹20,000 a year). Its document list is the same.',
    kn: '{age} ವರ್ಷಕ್ಕೆ ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ ವೇತನವೂ ಹೊಂದಬಹುದು (65 ವರ್ಷ ಮೇಲ್ಪಟ್ಟು, ಕುಟುಂಬದ ಆದಾಯ ವರ್ಷಕ್ಕೆ ₹20,000 ಒಳಗೆ). ಅದರ ದಾಖಲೆ ಪಟ್ಟಿಯೂ ಇದೇ.',
    hi: '{age} साल पर संध्या सुरक्षा पेंशन भी लागू हो सकती है (65 साल से ऊपर, परिवार की आय ₹20,000 सालाना से कम)। उसकी दस्तावेज़ सूची भी यही है।',
  },
  intro: {
    en: '{service}: {n} documents. I will read them one by one. Say “yes” if you have it, “no” if you don’t, or “next” and “repeat”.',
    kn: '{service}: {n} ದಾಖಲೆಗಳು. ಒಂದೊಂದಾಗಿ ಓದುತ್ತೇನೆ. ಇದ್ದರೆ “ಇದೆ”, ಇಲ್ಲದಿದ್ದರೆ “ಇಲ್ಲ”, ಅಥವಾ “ಮುಂದೆ”, “ಮತ್ತೊಮ್ಮೆ” ಎನ್ನಿ.',
    hi: '{service}: {n} दस्तावेज़। एक-एक करके सुनिए। हो तो “हाँ”, न हो तो “नहीं”, या “आगे” और “फिर से” बोलिए।',
  },
  item: { en: '{i} of {n}: {label}.', kn: '{n}ರಲ್ಲಿ {i}: {label}.', hi: '{n} में से {i}: {label}।' },
  cond_widow: { en: 'Only for a widow: ', kn: 'ವಿಧವೆಯಾಗಿದ್ದರೆ ಮಾತ್ರ: ', hi: 'केवल विधवा होने पर: ' },
  cond_urban: { en: 'Only in a city or town: ', kn: 'ನಗರ ಅಥವಾ ಪಟ್ಟಣದಲ್ಲಿ ಮಾತ್ರ: ', hi: 'सिर्फ़ शहर या कस्बे में: ' },
  cond_noCasteProof: {
    en: 'Only if there is no other caste proof: ',
    kn: 'ಬೇರೆ ಜಾತಿ ದಾಖಲೆ ಇಲ್ಲದಿದ್ದರೆ ಮಾತ್ರ: ',
    hi: 'अगर कोई और जाति प्रमाण न हो तभी: ',
  },
  cond_ifHave: { en: 'If you have it: ', kn: 'ಇದ್ದರೆ: ', hi: 'अगर हो तो: ' },
  cond_urbanIfHave: { en: 'In a city or town, if you have one: ', kn: 'ನಗರ ಅಥವಾ ಪಟ್ಟಣದಲ್ಲಿ, ಇದ್ದರೆ: ', hi: 'शहर या कस्बे में, अगर हो तो: ' },
  cond_urbanRent: {
    en: 'Only in a city or town, if you live on rent: ',
    kn: 'ನಗರ ಅಥವಾ ಪಟ್ಟಣದಲ್ಲಿ ಬಾಡಿಗೆ ಮನೆಯಲ್ಲಿದ್ದರೆ ಮಾತ್ರ: ',
    hi: 'सिर्फ़ शहर या कस्बे में, अगर किराये पर रहते हों: ',
  },
  cond_rent: { en: 'Only if you live on rent: ', kn: 'ಬಾಡಿಗೆ ಮನೆಯಲ್ಲಿದ್ದರೆ ಮಾತ್ರ: ', hi: 'अगर किराये पर रहते हों तभी: ' },
  cond_notOfficial: {
    en: 'Not in the official list, but carry it to show the 40 percent: ',
    kn: 'ಅಧಿಕೃತ ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲ, ಆದರೆ ಶೇಕಡಾ 40 ತೋರಿಸಲು ತೆಗೆದುಕೊಂಡು ಹೋಗಿ: ',
    hi: 'आधिकारिक सूची में नहीं है, पर 40 प्रतिशत दिखाने के लिए साथ ले जाएँ: ',
  },
  gotIt: { en: 'Got it.', kn: 'ಸರಿ.', hi: 'ठीक है।' },
  missingGetVia: {
    en: 'Noted. You can get the {label} at the Nadakacheri too. After this list, say “{service}” and I will tell you what it needs.',
    kn: 'ಗುರುತು ಮಾಡಿದೆ. {label} ಅನ್ನು ನಾಡಕಚೇರಿಯಲ್ಲೇ ಪಡೆಯಬಹುದು. ಈ ಪಟ್ಟಿ ಮುಗಿದ ಮೇಲೆ “{service}” ಎಂದು ಹೇಳಿ, ಅದಕ್ಕೆ ಏನು ಬೇಕು ಎಂದು ಹೇಳುತ್ತೇನೆ.',
    hi: 'लिख लिया। {label} भी नाडकचेरी से बनता है। यह सूची खत्म होने पर “{service}” बोलिए, उसके कागज़ भी बताए जाएँगे।',
  },
  missingNoAlt: {
    en: 'Noted as missing. I don’t know an official alternative for this one yet, so please ask at the counter.',
    kn: 'ಇಲ್ಲ ಎಂದು ಗುರುತು ಮಾಡಿದೆ. ಇದಕ್ಕೆ ಅಧಿಕೃತ ಪರ್ಯಾಯ ನನಗೆ ಇನ್ನೂ ಗೊತ್ತಿಲ್ಲ; ದಯವಿಟ್ಟು ಕೌಂಟರ್‌ನಲ್ಲಿ ಕೇಳಿ.',
    hi: 'कमी के रूप में लिख लिया। इसका कोई आधिकारिक विकल्प अभी मुझे पता नहीं, कृपया काउंटर पर पूछिए।',
  },
  missingFamilyTree: {
    en: 'Noted. The official list says that if none of the caste documents are available, a relatives’ certificate and family tree can be used.',
    kn: 'ಗುರುತು ಮಾಡಿದೆ. ಯಾವ ಜಾತಿ ದಾಖಲೆಯೂ ಇಲ್ಲದಿದ್ದರೆ ಸಂಬಂಧಿಕರ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಕುಟುಂಬದ ವಂಶ ವೃಕ್ಷ ಕೊಡಬಹುದು ಎಂದು ಅಧಿಕೃತ ಪಟ್ಟಿ ಹೇಳುತ್ತದೆ.',
    hi: 'लिख लिया। आधिकारिक सूची के अनुसार, अगर कोई जाति दस्तावेज़ न हो तो रिश्तेदारों का प्रमाण पत्र और वंश वृक्ष दिया जा सकता है।',
  },
  firstItem: { en: 'This is the first one.', kn: 'ಇದು ಮೊದಲನೆಯದು.', hi: 'यह पहला है।' },
  doneHave: {
    en: 'That is the full list. You have {have} of {n}.',
    kn: 'ಪಟ್ಟಿ ಮುಗಿಯಿತು. {n}ರಲ್ಲಿ {have} ನಿಮ್ಮ ಬಳಿ ಇವೆ.',
    hi: 'पूरी सूची हो गई। {n} में से {have} आपके पास हैं।',
  },
  stillNeeded: { en: 'Still needed: {list}.', kn: 'ಇನ್ನೂ ಬೇಕಾದವು: {list}.', hi: 'अभी चाहिए: {list}।' },
  where: {
    en: 'Where to apply: your nearest Nadakacheri (Atalji Janasnehi Kendra), a Grama One centre, or online on Seva Sindhu.',
    kn: 'ಎಲ್ಲಿ ಅರ್ಜಿ ಹಾಕಬೇಕು: ಹತ್ತಿರದ ನಾಡಕಚೇರಿ (ಅಟಲ್‌ಜೀ ಜನಸ್ನೇಹಿ ಕೇಂದ್ರ), ಗ್ರಾಮ ಒನ್ ಕೇಂದ್ರ, ಅಥವಾ ಸೇವಾ ಸಿಂಧು ಮೂಲಕ ಆನ್‌ಲೈನ್.',
    hi: 'कहाँ आवेदन करें: नज़दीकी नाडकचेरी (अटलजी जनस्नेही केंद्र), ग्राम वन केंद्र, या सेवा सिंधु पर ऑनलाइन।',
  },
  whereDistrict: { en: 'In {district} district. ', kn: '{district} ಜಿಲ್ಲೆಯಲ್ಲಿ. ', hi: '{district} ज़िले में। ' },
  feePension: {
    en: 'Fee: no application fee. A service charge of ₹{charge} may apply at a centre; it is free if you apply online yourself.',
    kn: 'ಶುಲ್ಕ: ಅರ್ಜಿ ಶುಲ್ಕ ಇಲ್ಲ. ಕೇಂದ್ರದಲ್ಲಿ ₹{charge} ಸೇವಾ ಶುಲ್ಕ ಇರಬಹುದು; ನೀವೇ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಹಾಕಿದರೆ ಉಚಿತ.',
    hi: 'शुल्क: आवेदन शुल्क नहीं। केंद्र पर ₹{charge} सेवा शुल्क लग सकता है; खुद ऑनलाइन करें तो मुफ़्त।',
  },
  feeCertificate: {
    en: 'Fee: ₹{fee} application fee, plus a ₹{charge} service charge at a centre (no service charge if you apply online yourself).',
    kn: 'ಶುಲ್ಕ: ₹{fee} ಅರ್ಜಿ ಶುಲ್ಕ, ಕೇಂದ್ರದಲ್ಲಿ ಜೊತೆಗೆ ₹{charge} ಸೇವಾ ಶುಲ್ಕ (ನೀವೇ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಹಾಕಿದರೆ ಸೇವಾ ಶುಲ್ಕ ಇಲ್ಲ).',
    hi: 'शुल्क: ₹{fee} आवेदन शुल्क, और केंद्र पर ₹{charge} सेवा शुल्क (खुद ऑनलाइन करें तो सेवा शुल्क नहीं)।',
  },
  days: { en: 'It can take up to {days} days.', kn: 'ಗರಿಷ್ಠ {days} ದಿನಗಳು ಆಗಬಹುದು.', hi: '{days} दिन तक लग सकते हैं।' },
  checked: {
    en: 'Source: Seva Sindhu (Government of Karnataka), checked on {date}.',
    kn: 'ಮೂಲ: ಸೇವಾ ಸಿಂಧು (ಕರ್ನಾಟಕ ಸರ್ಕಾರ), {date} ರಂದು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.',
    hi: 'स्रोत: सेवा सिंधु (कर्नाटक सरकार), {date} को जाँचा गया।',
  },
  endPrompt: {
    en: 'Say “send” to share this on WhatsApp, or name another service.',
    kn: 'ವಾಟ್ಸಾಪ್‌ಗೆ ಕಳಿಸಲು “ಕಳಿಸು” ಎನ್ನಿ, ಅಥವಾ ಬೇರೆ ಸೇವೆಯ ಹೆಸರು ಹೇಳಿ.',
    hi: 'व्हाट्सऐप पर भेजने के लिए “भेजो” बोलिए, या किसी और सेवा का नाम बोलिए।',
  },
  sharing: { en: 'Opening WhatsApp…', kn: 'ವಾಟ್ಸಾಪ್ ತೆರೆಯುತ್ತಿದೆ…', hi: 'व्हाट्सऐप खुल रहा है…' },
  restarted: { en: 'OK, let’s start again. What do you need?', kn: 'ಸರಿ, ಮತ್ತೆ ಶುರು ಮಾಡೋಣ. ನಿಮಗೆ ಏನು ಬೇಕು?', hi: 'ठीक है, फिर से शुरू करते हैं। आपको क्या चाहिए?' },
  shareHeader: {
    en: '{service}: documents to carry',
    kn: '{service}: ತೆಗೆದುಕೊಂಡು ಹೋಗಬೇಕಾದ ದಾಖಲೆಗಳು',
    hi: '{service}: साथ ले जाने वाले कागज़',
  },
  shareFooter: {
    en: 'Made with DocAgent Voice. Please confirm at the counter, as rules can change.',
    kn: 'ಡಾಕ್‌ಏಜೆಂಟ್ ವಾಯ್ಸ್‌ನಿಂದ. ನಿಯಮಗಳು ಬದಲಾಗಬಹುದು, ಕೌಂಟರ್‌ನಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
    hi: 'डॉकएजेंट वॉइस से। नियम बदल सकते हैं, काउंटर पर पक्का कर लें।',
  },
};

const WHO = {
  son: 'your son',
  daughter: 'your daughter',
  brother: 'your brother',
  sister: 'your sister',
  wife: 'your wife',
  mother: 'your mother',
  father: 'your father',
  grandmother: 'your grandmother',
  grandfather: 'your grandfather',
};

export function whoPhrase(relation) {
  return WHO[relation] || 'the applicant';
}

export function tr(lang, key, vars = {}) {
  const entry = STRINGS[key];
  if (!entry) return key;
  const template = entry[lang] || entry.en;
  return template.replace(/\{(\w+)\}/g, (_, name) => (vars[name] !== undefined ? String(vars[name]) : ''));
}

export function hasKey(key) {
  return Boolean(STRINGS[key]);
}
