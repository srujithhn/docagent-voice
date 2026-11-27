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
    start(){ if (window.__recs.filter(r=>r.started && !r.ended).length) throw new Error('InvalidStateError'); this.started=true; }
    stop(){ setTimeout(()=>this.end(), 20); }
    abort(){ this.end(); }
    say(list){ const results = list.map(([t,f]) => Object.assign([{transcript:t}], {isFinal:f})); this.onresult && this.onresult({resultIndex:0, results}); }
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

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width':390,'height':844})
        await ctx.add_init_script(FAKE)
        pg = await ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:3001/'); await pg.wait_for_timeout(500)
        await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(500)
        await pg.click('.langs button[lang=en]'); await pg.wait_for_timeout(200)
        mode = lambda: pg.evaluate("document.getElementById('mic').className + ' pressed=' + document.getElementById('mic').getAttribute('aria-pressed')")
        ok = lambda name, cond: print(('PASS ' if cond else 'FAIL ') + name)

        # 1. Android case: only interim words, then the session ends -> still understood
        await pg.click('#mic'); await pg.wait_for_timeout(100)
        ok('tap starts listening', 'listening' in await mode())
        await pg.evaluate("__recs.at(-1).say([['my mother is 62 and wants old age pension', false]]); __recs.at(-1).end()")
        await pg.wait_for_timeout(300)
        ok('interim-only speech is used', 'BPL' in await pg.text_content('#reply'))

        # 2. Voice never says "end" -> stuck speaking? Tap once should interrupt and listen
        ok('speaking after reply', 'speaking' in await mode())
        await pg.wait_for_timeout(400)
        await pg.click('#mic'); await pg.wait_for_timeout(100)
        ok('one tap while speaking starts listening', 'listening' in await mode())

        # 3. Duplicate results from some phones
        await pg.evaluate("__recs.at(-1).say([['yes', true], ['yes', true]]); __recs.at(-1).end()")
        await pg.wait_for_timeout(300)
        heard = await pg.text_content('#heard')
        ok('duplicate words dropped (heard: %s)' % heard.split('Not right')[0], heard.count('yes') == 1)

        # 4. Double tap within 350 ms starts only one session
        await pg.wait_for_timeout(400)
        n = await pg.evaluate("__recs.length")
        await pg.click('#mic'); await pg.click('#mic'); await pg.wait_for_timeout(100)
        n2 = await pg.evaluate("__recs.length")
        ok('double tap ignored (%d new session)' % (n2-n), n2 - n == 1 and 'listening' in await mode())

        # 5. A late "end" from an old session does not reset the button
        await pg.evaluate("__recs.at(-1).abort()")  # current session ends normally (no speech)
        await pg.wait_for_timeout(400)
        await pg.click('#mic'); await pg.wait_for_timeout(100)
        await pg.evaluate("__recs.at(-2).ended=false; __recs.at(-2).end()")  # stale end arrives late
        ok('stale end ignored', 'listening' in await mode())

        # 6. Tapping while listening stops and uses what was heard
        await pg.evaluate("__recs.at(-1).say([['yes', false]])")
        await pg.wait_for_timeout(400)
        await pg.click('#mic'); await pg.wait_for_timeout(300)
        ok('tap to stop keeps words', 'idle' in await mode() or 'speaking' in await mode())
        ok('list advanced', '3 of' in await pg.text_content('#reply') or '2 of' in await pg.text_content('#reply'))

        # 7. Hands-free: when speech really ends, it listens again by itself
        await pg.evaluate("window.__fireEnd = true")
        await pg.wait_for_timeout(400)
        await pg.click('.chip.primary')  # "I have it"
        await pg.wait_for_timeout(1200)
        ok('hands-free listens again after speaking', 'listening' in await mode())

        # 8. Mic blocked error shows a message and turns hands-free off
        await pg.evaluate("__recs.at(-1).err('not-allowed'); __recs.at(-1).end()")
        await pg.wait_for_timeout(200)
        ok('blocked mic explained', await pg.is_visible('#banner') and not await pg.is_checked('#handsFree'))

        # 9. Watchdog: speech that never ends still finishes
        await pg.evaluate("window.__fireEnd = false; document.getElementById('handsFree').checked = true")
        await pg.wait_for_timeout(400)
        await pg.fill('#typed', 'next'); await pg.press('#typed', 'Enter')
        await pg.wait_for_timeout(300)
        ok('speaking while voice runs', 'speaking' in await mode())
        await pg.wait_for_timeout(9000)
        ok('watchdog ends speaking and hands-free resumes', 'listening' in await mode())
        print('errors:', errs or 'none')
        await b.close()
asyncio.run(main())
