/* Typing engine: renders a passage, captures keystrokes, tracks WPM / accuracy. */
window.KS_Typer = (function () {
  const MAX_CHARS = 4000;

  function normalize(text) {
    return String(text || '')
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[–—]/g, '-').replace(/…/g, '...')
      .replace(/[^\x20-\x7E\s]/g, '')
      .replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
  }

  /**
   * opts: { box, text, timeLimit (s, 0 = none), strict (must fix key before advancing),
   *         keyboard (KS_KB instance), onStats(stats), onFinish(stats) }
   */
  function create(opts) {
    const text = normalize(opts.text);
    const box = opts.box;
    const kb = opts.keyboard || null;
    box.classList.add('typer');
    box.innerHTML = '<div class="typer-scroll"><div class="typer-text"></div></div>' +
      '<div class="typer-overlay">Click here or press any key to start typing</div>' +
      '<textarea class="typer-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Typing input"></textarea>';
    const scroll = box.querySelector('.typer-scroll');
    const textEl = box.querySelector('.typer-text');
    const input = box.querySelector('.typer-input');

    const frag = document.createDocumentFragment();
    const spans = [];
    for (const ch of text) {
      const s = document.createElement('span');
      s.textContent = ch;
      if (ch === ' ') s.className = 'sp';
      frag.appendChild(s);
      spans.push(s);
    }
    textEl.appendChild(frag);

    let pos = 0, keystrokes = 0, errors = 0, correctChars = 0;
    let startTime = 0, timer = null, finished = false, destroyed = false;
    const typed = [];

    function stats() {
      const secs = startTime ? (Date.now() - startTime) / 1000 : 0;
      const mins = Math.max(secs, 2) / 60;
      return {
        wpm: Math.round(correctChars / 5 / mins),
        accuracy: keystrokes ? Math.round(((keystrokes - errors) / keystrokes) * 1000) / 10 : 100,
        errors, chars: pos, total: text.length,
        seconds: Math.round(secs * 10) / 10,
        remaining: opts.timeLimit ? Math.max(0, Math.ceil(opts.timeLimit - secs)) : null,
        progress: text.length ? pos / text.length : 0,
      };
    }

    function updateCursor() {
      textEl.querySelectorAll('.cur').forEach(s => s.classList.remove('cur'));
      if (pos < spans.length) {
        const s = spans[pos];
        s.classList.add('cur');
        const lineH = s.offsetHeight || 32;
        const target = Math.max(0, s.offsetTop - lineH * 0.9);
        if (Math.abs(scroll.scrollTop - target) > 2) scroll.scrollTop = target;
        if (kb) kb.showChar(text[pos]);
      } else if (kb) kb.home();
    }

    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      box.classList.add('done');
      textEl.querySelectorAll('.cur').forEach(s => s.classList.remove('cur'));
      input.blur();
      if (kb) kb.home();
      opts.onStats && opts.onStats(stats());
      opts.onFinish && opts.onFinish(stats());
    }

    function begin() {
      if (startTime) return;
      startTime = Date.now();
      box.classList.add('started');
      timer = setInterval(() => {
        const st = stats();
        opts.onStats && opts.onStats(st);
        if (opts.timeLimit && st.remaining <= 0) finish();
      }, 200);
    }

    function typeChar(c) {
      if (finished || destroyed || pos >= text.length) return;
      begin();
      const expected = text[pos];
      keystrokes++;
      const ok = c === expected;
      if (kb) kb.flash(expected, ok);
      if (!ok) {
        errors++;
        if (opts.strict) {
          const s = spans[pos];
          s.classList.add('bad-try');
          setTimeout(() => s.classList.remove('bad-try'), 250);
          opts.onStats && opts.onStats(stats());
          return;
        }
      }
      typed[pos] = c;
      spans[pos].classList.add(ok ? 'ok' : 'bad');
      if (ok) correctChars++;
      pos++;
      if (pos >= text.length) return finish();
      updateCursor();
      opts.onStats && opts.onStats(stats());
    }

    function backspace() {
      if (finished || pos === 0) return;
      pos--;
      if (typed[pos] === text[pos]) correctChars--;
      typed[pos] = undefined;
      spans[pos].classList.remove('ok', 'bad');
      updateCursor();
    }

    function onKeyDown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Backspace') { e.preventDefault(); backspace(); return; }
      if (e.key === 'Enter') { e.preventDefault(); typeChar(' '); return; }
      if (e.key && e.key.length === 1) { e.preventDefault(); typeChar(e.key); }
    }
    // Fallback for on-screen (mobile) keyboards that don't send key values
    function onInput(e) {
      const v = input.value;
      input.value = '';
      if (e.inputType === 'deleteContentBackward') return backspace();
      for (const c of v) typeChar(c);
    }
    function focus() { if (!finished) input.focus({ preventScroll: true }); }

    input.addEventListener('keydown', onKeyDown);
    input.addEventListener('input', onInput);
    input.addEventListener('focus', () => box.classList.add('focused'));
    input.addEventListener('blur', () => box.classList.remove('focused'));
    box.addEventListener('click', focus);
    // Start typing anywhere on the page
    function globalKey(e) {
      if (destroyed || finished || document.activeElement === input) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        focus();
        onKeyDown(e);
      }
    }
    document.addEventListener('keydown', globalKey);

    updateCursor();
    opts.onStats && opts.onStats(stats());

    return {
      text, focus, stats,
      destroy() { destroyed = true; clearInterval(timer); document.removeEventListener('keydown', globalKey); },
      get finished() { return finished; },
    };
  }

  return { create, normalize, MAX_CHARS };
})();
