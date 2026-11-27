# Browser check for the mic button, with a simulated microphone and voice.
# Needs Python Playwright and Chrome. Start the app on port 3001 first:
#   PORT=3001 npm start   then   python3 scripts/mic_check.py
import asyncio
from playwright.async_api import async_playwright

FAKE = """
(() => {
  window.__recs = [];
  class FakeRec {
    constructor(){ this.lang=''; window.__recs.push(this); this.started=false; this.ended=false; }
    start(){
      if (window.__recs.filter(r=>r.started && !r.ended).length) throw new Error('InvalidStateError');
      this.started=true;
      if (!window.__slowMic) setTimeout(()=>this.ready(), 10);
    }
    ready(){ this.onaudiostart && this.onaudiostart(); this.onstart && this.onstart(); }
    stop(){ setTimeout(()=>this.end(), 20); }
    abort(){ this.end(); }
    say(list){ const results = list.map(([t,f]) => Object.assign([{transcript:t}], {isFinal:f})); this.onresult && this.onresult({resultIndex:0, results}); }
    silent(){ this.onerror && this.onerror({error:'no-speech'}); this.end(); }
    err(e){ this.onerror && this.onerror({error:e}); }
    end(){ if (this.ended) return; this.ended=true; this.onend && this.onend(); }
  }
  window.SpeechRecognition = FakeRec; window.webkitSpeechRecognition = FakeRec;
  window.__spoken = []; window.__fireEnd = false;
  const fake = {
    speak(u){ window.__spoken.push(u); if (window.__fireEnd) setTimeout(()=>u.onend && u.onend({}), 30); },
    cancel(){ }, resume(){ }, getVoices(){ return []; }, addEventListener(){}
  };
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
})();
"""

results = []
def ok(name, cond):
    results.append(cond)
    print(('PASS ' if cond else 'FAIL ') + name)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844})
        await ctx.add_init_script(FAKE)
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3001/')
        await pg.evaluate("localStorage.clear()")
        await pg.reload(); await pg.wait_for_timeout(500)
        await pg.click('.langs button[lang=en]'); await pg.wait_for_timeout(200)
        mode = lambda: pg.evaluate("document.getElementById('mic').className")
        label = lambda: pg.text_content('#micLabel')
        recs = lambda: pg.evaluate("__recs.length")

        # Ready signal: "One moment" until the mic is really on, then "Speak now"
        await pg.evaluate("window.__slowMic = true")
        await pg.click('#mic'); await pg.wait_for_timeout(100)
        ok('shows "One moment" while the mic starts', (await label()).startswith('One moment'))
        await pg.evaluate("__recs.at(-1).ready()"); await pg.wait_for_timeout(50)
        ok('shows "Speak now" once the mic is on', (await label()).startswith('Speak now'))
        await pg.evaluate("window.__slowMic = false")

        # Android: only interim words, then the session ends -> still understood
        await pg.evaluate("__recs.at(-1).say([['my mother is 62 and wants old age pension', false]]); __recs.at(-1).end()")
        await pg.wait_for_timeout(300)
        ok('interim-only speech is used', 'BPL' in await pg.text_content('#reply'))

        # Voice never reports the end: one tap interrupts and listens
        ok('speaking after the reply', 'speaking' in await mode())
        await pg.wait_for_timeout(400)
        await pg.click('#mic'); await pg.wait_for_timeout(100)
        ok('one tap while speaking starts listening', 'listening' in await mode())

        # Repeated words from some phones
        await pg.evaluate("__recs.at(-1).say([['yes', true], ['yes', true]]); __recs.at(-1).end()")
        await pg.wait_for_timeout(300)
        ok('repeated words dropped', (await pg.text_content('#heard')).count('yes') == 1)

        # Double tap starts one session
        await pg.wait_for_timeout(400)
        n = await recs()
        await pg.click('#mic'); await pg.click('#mic'); await pg.wait_for_timeout(100)
        ok('double tap starts one session', await recs() - n == 1 and 'listening' in await mode())

        # Late "end" from an old session is ignored
        await pg.evaluate("__recs.at(-1).abort()"); await pg.wait_for_timeout(400)
        await pg.click('#mic'); await pg.wait_for_timeout(100)
        await pg.evaluate("__recs.at(-2).ended=false; __recs.at(-2).end()")
        ok('late end from an old session ignored', 'listening' in await mode())

        # Tap to stop keeps what was heard
        await pg.evaluate("__recs.at(-1).say([['yes', false]])"); await pg.wait_for_timeout(400)
        await pg.click('#mic'); await pg.wait_for_timeout(300)
        ok('tap to stop keeps the words', ' of 10' in await pg.text_content('#reply'))

        # ---- Hands-free ----
        await pg.evaluate("window.__fireEnd = true")
        await pg.wait_for_timeout(400)
        await pg.click('.chip.primary'); await pg.wait_for_timeout(800)
        ok('hands-free listens after the voice ends', 'listening' in await mode())
        item_before = await pg.text_content('#reply')

        # Slow answer: two silent sessions, then "yes" in the third is still heard
        n = await recs()
        await pg.evaluate("__recs.at(-1).silent()"); await pg.wait_for_timeout(300)
        ok('silence restarts the mic (no flicker)', await recs() == n + 1 and 'listening' in await mode())
        await pg.evaluate("__recs.at(-1).silent()"); await pg.wait_for_timeout(300)
        await pg.evaluate("__recs.at(-1).say([['yes', true]]); __recs.at(-1).end()"); await pg.wait_for_timeout(300)
        ok('a slow answer is still heard', await pg.text_content('#reply') != item_before)

        # Very long silence: stops after 3 restarts and asks for a tap
        await pg.wait_for_timeout(800)
        for _ in range(4):
            await pg.evaluate("__recs.at(-1).silent()"); await pg.wait_for_timeout(300)
        ok('stops after about 30 seconds of silence', 'listening' not in await mode())
        ok('then says "Tap the mic to answer"', (await label()).startswith('Tap the mic'))

        # Stopping on purpose does not restart
        await pg.click('#mic'); await pg.wait_for_timeout(100)
        n = await recs()
        await pg.wait_for_timeout(400)
        await pg.click('#mic'); await pg.wait_for_timeout(400)
        ok('a tap to stop is not undone by a restart', await recs() == n and 'listening' not in await mode())

        # App goes to the background: mic and voice stop
        await pg.click('#mic'); await pg.wait_for_timeout(100)
        await pg.evaluate("Object.defineProperty(document, 'hidden', {value: true, configurable: true}); document.dispatchEvent(new Event('visibilitychange'))")
        await pg.wait_for_timeout(200)
        ok('mic stops when the app is in the background', 'listening' not in await mode())
        await pg.evaluate("Object.defineProperty(document, 'hidden', {value: false, configurable: true})")

        # Blocked mic is explained and hands-free is turned off
        await pg.wait_for_timeout(400)  # past the double-tap guard
        await pg.click('#mic'); await pg.wait_for_timeout(100)
        await pg.evaluate("__recs.at(-1).err('not-allowed'); __recs.at(-1).end()"); await pg.wait_for_timeout(200)
        ok('blocked mic explained', await pg.is_visible('#banner') and not await pg.is_checked('#handsFree'))

        # Voice that never reports the end: the timer finishes it and hands-free resumes
        await pg.evaluate("window.__fireEnd = false; document.getElementById('handsFree').checked = true")
        await pg.wait_for_timeout(400)
        await pg.fill('#typed', 'next'); await pg.press('#typed', 'Enter'); await pg.wait_for_timeout(300)
        ok('speaking while the voice runs', 'speaking' in await mode())
        await pg.wait_for_timeout(9000)
        ok('timer ends speaking and hands-free resumes', 'listening' in await mode())

        ok('no page errors', not errs)
        await b.close()
    print(f'\n{sum(results)} of {len(results)} checks passed')

asyncio.run(main())
