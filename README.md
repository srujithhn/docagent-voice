# DocAgent Voice

Ask out loud, in **Kannada, Hindi or English**, which documents to carry for a government service in Karnataka. You hear the checklist one document at a time, say whether you have each one, and get the list on WhatsApp to take to the counter.

**Try it:** <https://srujithhn.github.io/docagent-voice/> (open in Chrome and allow the microphone)

Built for the Scaler × Wispr Flow *Build for Bharat* hackathon (Round 2, theme: **Public infrastructure and civic services**).

## The problem

People find out at the Nadakacheri or Grama One counter that one paper is missing, and have to come back another day. That costs a day's wage and bus fare, or an agent's fee. The official lists are on government portals, mostly in English text, and the people who need them most often can't type Kannada on a phone.

## What it does (one core flow)

1. Tap the mic and speak: *"ನನ್ನ ಅಮ್ಮನಿಗೆ 62 ವರ್ಷ, ಮಂಡ್ಯದಲ್ಲಿ ವೃದ್ಧಾಪ್ಯ ವೇತನ ಬೇಕು"* ("My mother is 62 and wants the old-age pension in Mandya").
2. It asks **one** short question back if it needs to, such as *"Does she have a BPL ration card?"*
3. It reads the checklist **one document at a time**. Answer *"ಇದೆ"* (I have it), *"ಇಲ್ಲ"* (I don't), *"ಮುಂದೆ"* (next), *"ಮತ್ತೊಮ್ಮೆ"* (repeat) or *"ಹಿಂದೆ"* (back).
4. At the end, it tells you what is still missing, where to apply, the fee and how long it takes, and sends the list on WhatsApp.

If a document is missing, it says what the official list allows instead (for example, a family tree when there is no caste proof). Where the official list gives no alternative, it says **"I don't know"** and asks you to check at the counter, instead of guessing.

**Services covered now (7):** old-age pension (Indira Gandhi National Old Age Pension), Sandhya Suraksha, widow pension, disability pension, income certificate, caste certificate (Category A) and residence certificate.

## Built for everyone, including people with disabilities

- **Blind or low vision:** the whole flow works by voice; every control has a screen-reader label; the checklist tells a screen reader which items you have, which are missing and which one is current; large text and a high-contrast (yellow on black) mode.
- **Deaf or hard of hearing:** every spoken answer is also shown as text; reading aloud can be turned off; the phone vibrates when the mic starts listening.
- **Speech difficulties:** type, or tap the big answer buttons instead of speaking.
- **Limited hand movement:** hands-free mode keeps listening after each answer, so you only tap once; on a keyboard, Space talks and Esc stops.
- **Older users:** a "speak slowly" option, large buttons, and one question at a time.

The disability pension's official list does not mention a disability certificate, even though the rule needs disability above 40%. The app adds "Disability certificate or UDID card" to the list, clearly marked *not in the official list*, so nobody makes a wasted trip.

## Where the rules come from

Every document list, fee and time limit comes from the Government of Karnataka's **Seva Sindhu** service details (checked on 27 Nov 2026), stored in [`public/data/services.json`](public/data/services.json) together with the official wording in English and Kannada. The app shows the source and the date it was checked.

Two honest notes about the official data:
- The old-age pension list includes "Husband's death certificate", so the app shows it as *only for a widow* and skips it for a male applicant.
- The Nadakacheri portal's older procedure page says only a photo ID with address proof is needed, while Seva Sindhu lists more papers. The app follows the fuller Seva Sindhu list.

## Run it (one command, no API keys)

```bash
docker compose up --build
```

Then open <http://localhost:3000> in **Chrome** and allow the microphone.

Without Docker: `npm start` (Node 18 or newer). There are no packages to install.

The app needs **no secret keys**. Voice input and output use the browser's built-in Web Speech API, and all the understanding runs in the page.

## How it works

| Part | File | What it does |
|---|---|---|
| Rules | `public/data/services.json` | Official document lists, eligibility, fees and days for 7 services, with sources |
| Understanding | `public/js/nlu.js` | Finds the service, age, who it is for, city or village, yes/no and commands, in Kannada, Hindi and English (including Kannada and Devanagari digits and number words) |
| Conversation | `public/js/dialog.js` | Asks at most one or two questions, builds the checklist for this person, walks through it, and writes the summary and WhatsApp text |
| Voice and screen | `public/js/app.js` | Listens with `SpeechRecognition`, speaks with `speechSynthesis`, shows the checklist; typing and tap buttons work too |
| Words on screen | `public/js/i18n.js` | Every sentence in the three languages |
| Server | `server.js` | A small static server with no dependencies, and `/api/health` |

**What it depends on.** Chrome's speech recognition (free, sends audio to the browser's speech service) and the phone's text-to-speech voices. If a phone has no Kannada voice, the answer stays on screen and the app says so. Typing always works. No paid AI service is used, so nothing stops working if an API price changes.

**Privacy.** It never asks for Aadhaar numbers or photos, and the server stores nothing.

## Tests

```bash
npm test      # 31 tests: understanding, the conversation, and the server
npm run eval  # accuracy on 49 test phrases in three languages
```

The test phrases in `test/cases.json` were written by us, not recorded from users yet. The next step is to replace them with real requests recorded at a Grama One centre.

## What's next

- Add more services: SC/ST caste certificate, ration card, and the Mythri (transgender) and Manaswini pensions, once their official document lists are found.
- Record real requests from older users and check speech accuracy on rural voices.
- Let Grama One operators flag when the counter asks for something different, so the rules stay current.

## License

MIT
