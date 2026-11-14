/* Single-page app: routing and views. */
(function () {
  const { PASSAGES, COMMON_WORDS, LESSONS } = window.KS_DATA;
  const KB = window.KS_KB, Typer = window.KS_Typer, Store = window.KS_Store;
  const view = document.getElementById('view');
  let cleanups = [];
  let pendingResult = null; // a guest's last score, saved if they sign up

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = sel => view.querySelector(sel);
  const onCleanup = fn => cleanups.push(fn);
  const go = hash => { location.hash = hash; };

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2800);
  }

  // ---------- Shared pieces ----------
  function legendHTML() {
    const order = ['lp', 'lr', 'lm', 'li', 'rt', 'ri', 'rm', 'rr', 'rp'];
    return '<div class="legend">' + order.map(f => `<span><i style="background:${KB.FINGERS[f].color}"></i>${f === 'rt' ? 'Thumbs' : KB.FINGERS[f].name}</span>`).join('') + '</div>';
  }

  /** Acts out a sequence of characters with the hands, looping. Returns a stop function. */
  function runDemo(kb, chars, { interval = 900, loop = true, pauseAfter = 1200 } = {}) {
    let i = 0, stopped = false, t;
    const tick = () => {
      if (stopped) return;
      if (i >= chars.length) {
        kb.home();
        if (!loop) return;
        i = 0;
        t = setTimeout(tick, pauseAfter);
        return;
      }
      kb.showChar(chars[i++]);
      t = setTimeout(() => { if (!stopped) { kb.showKeys([], { move: true }); t = setTimeout(tick, interval * 0.35); } }, interval * 0.65);
    };
    t = setTimeout(tick, 400);
    return () => { stopped = true; clearTimeout(t); };
  }

  function statsBarHTML(withTime = true) {
    return `<div class="stats">
      <div class="stat"><b id="s-wpm">0</b><span>WPM</span></div>
      <div class="stat"><b id="s-acc">100%</b><span>Accuracy</span></div>
      ${withTime ? '<div class="stat"><b id="s-time">0s</b><span>Time</span></div>' : ''}
      <div class="stat"><b id="s-err">0</b><span>Errors</span></div>
      <div class="progress"><div id="s-prog"></div></div>
    </div>`;
  }
  function paintStats(st) {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set('s-wpm', st.wpm);
    set('s-acc', st.accuracy + '%');
    set('s-time', st.remaining != null ? st.remaining + 's left' : Math.floor(st.seconds) + 's');
    set('s-err', st.errors);
    const p = document.getElementById('s-prog');
    if (p) p.style.width = (st.progress * 100).toFixed(1) + '%';
  }

  function randomWords(n = 40) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)]);
    return out.join(' ');
  }

  // ---------- Nav ----------
  function renderNav(path) {
    const u = Store.current();
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + path));
    document.getElementById('nav-account').innerHTML = u
      ? `<a href="#/dashboard" class="user-chip" title="Your dashboard"><span class="avatar">${esc(u.name[0].toUpperCase())}</span>${esc(u.name)}</a><button class="btn ghost sm" id="logout">Log out</button>`
      : `<a href="#/login" class="btn ghost sm">Sign in</a><a href="#/signup" class="btn sm">Sign up free</a>`;
    const lo = document.getElementById('logout');
    if (lo) lo.onclick = async () => { await Store.logOut(); toast('You are logged out.'); if (location.hash === '#/' || !location.hash) route(); else go('#/'); };
  }

  // ---------- Home ----------
  function homeView() {
    const u = Store.current();
    view.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Free typing practice · No account required</p>
        <h1>Learn to type without looking.</h1>
        <p class="lead">Practice with real passages, follow a step-by-step course with see-through hands that show exactly which finger to use, and track your progress over time.</p>
        <div class="cta">
          <a class="btn lg" href="#/practice">Start typing — free</a>
          <a class="btn ghost lg" href="#/course">Take the course</a>
        </div>
        ${u ? '' : '<p class="muted small">Want to keep your scores and upload your own texts? <a href="#/signup">Create a free account</a>.</p>'}
      </div>
      <div class="hero-kb card"><div id="hero-kb"></div><p class="caption">Each key is tinted by the finger that presses it.</p></div>
    </section>
    <section class="features">
      <a class="feature card" href="#/practice"><div class="ficon">⌨</div><h3>Free practice</h3><p>Timed or untimed tests on passages and common words. Live WPM, accuracy and error tracking.</p></a>
      <a class="feature card" href="#/course"><div class="ficon">✋</div><h3>Guided course</h3><p>${LESSONS.length} lessons from the home row to numbers and symbols, with highlighted diagrams and animated hands.</p></a>
      <a class="feature card" href="#/prompts"><div class="ficon">⇪</div><h3>Your own prompts</h3><p>Upload a text file or paste anything — notes, code, lyrics you wrote — and practice with it.</p></a>
      <a class="feature card" href="#/dashboard"><div class="ficon">📈</div><h3>Track progress</h3><p>With an account, every score is saved so you can watch your speed and accuracy climb.</p></a>
    </section>`;
    const kb = KB.create($('#hero-kb'), { hands: true });
    onCleanup(runDemo(kb, 'hello world'.split(''), { interval: 700 }));
  }

  // ---------- Practice ----------
  function practiceView(params) {
    const u = Store.current();
    const promptOpts = u && u.prompts.length
      ? `<optgroup label="My prompts">${u.prompts.map(p => `<option value="prompt:${p.id}">${esc(p.title)}</option>`).join('')}</optgroup>` : '';
    view.innerHTML = `
    <section class="page">
      <div class="page-head">
        <div><h1>Typing practice</h1><p class="muted">Free for everyone. ${u ? 'Your scores are saved automatically.' : '<a href="#/signup">Sign up</a> to save your scores.'}</p></div>
      </div>
      <div class="toolbar card">
        <label>Text
          <select id="src">
            <optgroup label="Words"><option value="words">Random common words</option></optgroup>
            <optgroup label="Passages">${PASSAGES.map(p => `<option value="p:${p.id}">${esc(p.title)} · ${p.level}</option>`).join('')}</optgroup>
            ${promptOpts}
            <optgroup label="Other"><option value="custom">Paste my own text (one time)</option></optgroup>
          </select>
        </label>
        <label>Time limit
          <select id="time"><option value="0">None</option><option value="30">30 seconds</option><option value="60">1 minute</option><option value="120">2 minutes</option></select>
        </label>
        <label class="check"><input type="checkbox" id="showkb" checked> Keyboard &amp; hands guide</label>
        <button class="btn ghost" id="restart" title="Restart (Esc)">↻ Restart</button>
      </div>
      <div class="card custom" id="custom" hidden>
        <label for="custom-text"><span>Paste any text to practice with${u ? '' : ' (it will not be saved — <a href="#/signup">sign up</a> to keep prompts)'}:</span></label>
        <textarea id="custom-text" rows="4" placeholder="Paste or type your text here…"></textarea>
        <button class="btn" id="custom-go">Use this text</button>
      </div>
      ${statsBarHTML()}
      <div id="box"></div>
      <div id="result"></div>
      <div id="kbwrap" class="kb-wrap"><div id="kb"></div>${legendHTML()}</div>
      <p class="muted small center">Tip: press <kbd>Esc</kbd> to restart. Mistakes can be fixed with <kbd>Backspace</kbd>.</p>
    </section>`;

    const src = $('#src'), time = $('#time'), showkb = $('#showkb');
    let typer = null, kb = null, customText = '';
    if (params.get('prompt')) src.value = 'prompt:' + params.get('prompt');
    if (params.get('src')) src.value = params.get('src');
    try { const pref = localStorage.getItem('ks_showkb'); if (pref === '0') showkb.checked = false; } catch {}

    function textFor(v) {
      if (v === 'words') return randomWords(time.value === '0' ? 35 : 120);
      if (v.startsWith('p:')) return PASSAGES.find(p => p.id === v.slice(2)).text;
      if (v.startsWith('prompt:')) { const p = Store.getPrompt(v.slice(7)); return p ? p.text : ''; }
      if (v === 'custom') return customText;
      return '';
    }

    function start() {
      if (typer) typer.destroy();
      $('#result').innerHTML = '';
      $('#custom').hidden = src.value !== 'custom';
      $('#kbwrap').hidden = !showkb.checked;
      kb = showkb.checked ? KB.create($('#kb'), { hands: true }) : null;
      const text = textFor(src.value);
      if (!text) {
        $('#box').innerHTML = `<div class="typer empty">${src.value === 'custom' ? 'Paste some text above and press “Use this text”.' : 'This prompt could not be found.'}</div>`;
        if (kb) kb.home();
        paintStats({ wpm: 0, accuracy: 100, errors: 0, seconds: 0, remaining: null, progress: 0 });
        return;
      }
      typer = Typer.create({
        box: $('#box'), text, keyboard: kb, timeLimit: +time.value,
        onStats: paintStats,
        onFinish: st => showResult(st, src.options[src.selectedIndex].text),
      });
    }

    function showResult(st, label) {
      if (st.chars < 5) { $('#result').innerHTML = ''; return; }
      const result = { wpm: st.wpm, accuracy: st.accuracy, errors: st.errors, seconds: st.seconds, chars: st.chars, source: label, kind: 'practice' };
      const user = Store.current();
      let saveNote;
      if (user) {
        const best = Math.max(0, ...user.scores.map(s => s.wpm));
        Store.addScore(result).catch(e => toast('Score not saved: ' + e.message));
        saveNote = st.wpm > best && user.scores.length ? `<p class="good">🎉 New personal best! (previous ${best} WPM)</p>` : '<p class="muted">Saved to your <a href="#/dashboard">dashboard</a>.</p>';
      } else {
        pendingResult = result;
        saveNote = `<p class="muted">This score isn't saved yet.</p><a class="btn" href="#/signup">Sign up free to save it</a>`;
      }
      $('#result').innerHTML = `
        <div class="result card">
          <h2>Nice work!</h2>
          <div class="result-nums">
            <div><b>${st.wpm}</b><span>words per minute</span></div>
            <div><b>${st.accuracy}%</b><span>accuracy</span></div>
            <div><b>${st.errors}</b><span>errors</span></div>
            <div><b>${Math.round(st.seconds)}s</b><span>time</span></div>
          </div>
          ${saveNote}
          <button class="btn ghost" id="again">Try again</button>
        </div>`;
      $('#again').onclick = start;
      $('#result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    src.onchange = start;
    time.onchange = start;
    showkb.onchange = () => { try { localStorage.setItem('ks_showkb', showkb.checked ? '1' : '0'); } catch {} start(); };
    $('#restart').onclick = start;
    $('#custom-go').onclick = () => {
      customText = Typer.normalize($('#custom-text').value);
      if (!customText) return toast('Please paste some text first.');
      start();
      typer && typer.focus();
    };
    const esc_ = e => { if (e.key === 'Escape') { e.preventDefault(); start(); } };
    document.addEventListener('keydown', esc_);
    onCleanup(() => { document.removeEventListener('keydown', esc_); typer && typer.destroy(); });
    start();
  }

  // ---------- Course ----------
  function courseView(params) {
    const u = Store.current();
    const progress = (u && u.progress) || {};
    const lesson = LESSONS.find(l => l.id === params.get('l')) || null;

    const sidebar = `<aside class="lessons card">
      <h3>Lessons</h3>
      <ol>${LESSONS.map((l, i) => `<li><a href="#/course?l=${l.id}" class="${lesson && lesson.id === l.id ? 'active' : ''}">
        <span class="num ${progress[l.id] ? 'done' : ''}">${progress[l.id] ? '✓' : i + 1}</span>
        <span><b>${esc(l.title)}</b><small>${esc(l.blurb)}</small></span></a></li>`).join('')}</ol>
      ${u ? '' : '<p class="muted small"><a href="#/signup">Sign up</a> to save your course progress.</p>'}
    </aside>`;

    if (!lesson) {
      const doneCount = Object.keys(progress).length;
      view.innerHTML = `<section class="page course">
        ${sidebar}
        <div class="course-main">
          <div class="card intro">
            <h1>Touch typing course</h1>
            <p class="lead">${LESSONS.length} short lessons. Each one walks you through highlighted keyboard diagrams, step by step, with transparent hands that show which finger to use — then you practice with a guided drill.</p>
            ${u ? `<p><b>${doneCount}</b> of ${LESSONS.length} lessons complete.</p>` : ''}
            <a class="btn lg" href="#/course?l=${(LESSONS.find(l => !progress[l.id]) || LESSONS[0]).id}">${doneCount ? 'Continue' : 'Start lesson 1'}</a>
          </div>
          <div class="card"><div id="kb"></div>${legendHTML()}<p class="caption">Each color is one finger. Your index fingers cover two columns each.</p></div>
        </div></section>`;
      const kb = KB.create($('#kb'), { hands: true });
      onCleanup(runDemo(kb, 'asdf jkl;'.split(''), { interval: 650 }));
      return;
    }

    const idx = LESSONS.indexOf(lesson);
    const next = LESSONS[idx + 1];
    let step = 0, stopDemo = null, typer = null, kb = null;
    view.innerHTML = `<section class="page course">${sidebar}<div class="course-main" id="cm"></div></section>`;
    const cm = $('#cm');
    onCleanup(() => { stopDemo && stopDemo(); typer && typer.destroy(); });

    function pills(activeIdx) {
      return `<div class="pills">${lesson.steps.map((s, i) => `<button class="pill ${i === activeIdx ? 'on' : ''} ${i < activeIdx || activeIdx === -1 ? 'past' : ''}" data-step="${i}">${i + 1}</button>`).join('')}
        <button class="pill drill ${activeIdx === -1 ? 'on' : ''}" data-step="drill">Practice</button></div>`;
    }
    function bindPills() {
      cm.querySelectorAll('.pill').forEach(b => (b.onclick = () => (b.dataset.step === 'drill' ? showDrill() : showStep(+b.dataset.step))));
    }

    function showStep(i) {
      stopDemo && stopDemo(); stopDemo = null;
      typer && typer.destroy(); typer = null;
      step = i;
      const s = lesson.steps[i];
      cm.innerHTML = `
        <div class="card step">
          <div class="step-head"><span class="eyebrow">Lesson ${idx + 1} · ${esc(lesson.title)}</span>${pills(i)}</div>
          <h2><span class="stepno">Step ${i + 1} of ${lesson.steps.length}</span>${esc(s.title)}</h2>
          <p class="step-text">${s.text}</p>
          <div class="diagram"><div id="kb"></div>${legendHTML()}</div>
          ${s.demo ? '<p class="caption">Watch the highlighted finger reach for each key, then return home.</p>' : ''}
          <div class="step-nav">
            <button class="btn ghost" id="prev" ${i === 0 ? 'disabled' : ''}>← Back</button>
            <button class="btn" id="next">${i === lesson.steps.length - 1 ? 'Start practice drill →' : 'Next step →'}</button>
          </div>
        </div>`;
      kb = KB.create($('#kb'), { hands: true });
      if (s.demo) stopDemo = runDemo(kb, s.demo, { interval: 1000 });
      else kb.showKeys(s.keys || [], { move: false });
      $('#prev').onclick = () => showStep(i - 1);
      $('#next').onclick = () => (i === lesson.steps.length - 1 ? showDrill() : showStep(i + 1));
      bindPills();
    }

    function showDrill() {
      stopDemo && stopDemo(); stopDemo = null;
      typer && typer.destroy();
      cm.innerHTML = `
        <div class="card step">
          <div class="step-head"><span class="eyebrow">Lesson ${idx + 1} · ${esc(lesson.title)}</span>${pills(-1)}</div>
          <h2><span class="stepno">Practice drill</span>Type the text below</h2>
          <p class="step-text">The next key glows and the see-through hand shows which finger to use. You must press the correct key to move on — accuracy first!</p>
          ${statsBarHTML(false)}
          <div id="box"></div>
          <div id="result"></div>
          <div class="diagram"><div id="kb"></div>${legendHTML()}</div>
        </div>`;
      kb = KB.create($('#kb'), { hands: true });
      typer = Typer.create({
        box: $('#box'), text: lesson.drill, keyboard: kb, strict: true,
        onStats: paintStats,
        onFinish: st => {
          const user = Store.current();
          const result = { wpm: st.wpm, accuracy: st.accuracy, errors: st.errors, seconds: st.seconds, chars: st.chars, source: 'Lesson ' + (idx + 1) + ': ' + lesson.title, kind: 'lesson' };
          if (user) {
            Promise.all([Store.setProgress(lesson.id, st), Store.addScore(result)])
              .catch(e => toast('Progress not saved: ' + e.message));
          } else pendingResult = result;
          $('#result').innerHTML = `<div class="result card">
            <h2>Lesson complete!</h2>
            <div class="result-nums"><div><b>${st.wpm}</b><span>WPM</span></div><div><b>${st.accuracy}%</b><span>accuracy</span></div><div><b>${st.errors}</b><span>wrong keys</span></div></div>
            ${st.accuracy < 90 ? '<p class="muted">Tip: aim for 90%+ accuracy before moving on. Slow down and watch the guide hands.</p>' : ''}
            ${user ? '<p class="muted">Progress saved.</p>' : '<p class="muted"><a href="#/signup">Sign up free</a> to save your course progress.</p>'}
            <div class="row"><button class="btn ghost" id="redo">Try again</button>
            ${next ? `<a class="btn" href="#/course?l=${next.id}">Next lesson: ${esc(next.title)} →</a>` : '<a class="btn" href="#/practice">Course finished — go practice!</a>'}</div>
          </div>`;
          $('#redo').onclick = showDrill;
          if (user) {
            const num = view.querySelector(`.lessons a[href="#/course?l=${lesson.id}"] .num`);
            if (num) { num.classList.add('done'); num.textContent = '✓'; }
          }
        },
      });
      bindPills();
      typer.focus();
    }

    showStep(0);
  }

  // ---------- Prompts ----------
  function promptsView() {
    const u = Store.current();
    if (!u) {
      view.innerHTML = `<section class="page narrow"><div class="card gate">
        <div class="ficon big">⇪</div>
        <h1>Practice with your own text</h1>
        <p class="lead">Create a free account to upload text files or paste your own prompts — work emails, essays, code, anything — and keep them for practice anytime.</p>
        <div class="cta"><a class="btn lg" href="#/signup?next=/prompts">Sign up free</a><a class="btn ghost lg" href="#/login?next=/prompts">Sign in</a></div>
        <p class="muted small">Just want to try once? <a href="#/practice?src=custom">Paste text in practice mode</a> — no account needed.</p>
      </div></section>`;
      return;
    }
    view.innerHTML = `<section class="page">
      <div class="page-head"><div><h1>My prompts</h1><p class="muted">Upload or paste your own text, then practice with it.</p></div></div>
      <div class="prompts-grid">
        <form class="card" id="pform">
          <h3>Add a prompt</h3>
          <label class="drop" id="drop">
            <input type="file" id="file" accept=".txt,.md,.text,.csv,text/plain">
            <span><b>Upload a text file</b><br><small>.txt or .md · drag &amp; drop or click</small></span>
          </label>
          <label>Title<input id="ptitle" maxlength="60" placeholder="e.g. My cover letter" required></label>
          <label>Text<textarea id="ptext" rows="7" placeholder="…or paste your text here" required></textarea></label>
          <p class="muted small" id="pcount">0 characters</p>
          <button class="btn" type="submit">Save prompt</button>
        </form>
        <div id="plist"></div>
      </div></section>`;

    function renderList() {
      const user = Store.current();
      $('#plist').innerHTML = user.prompts.length
        ? user.prompts.map(p => {
            const words = p.text.split(/\s+/).filter(Boolean).length;
            return `<div class="card prompt">
              <div><h3>${esc(p.title)}</h3><p class="muted small">${words} words · added ${new Date(p.created).toLocaleDateString()}</p>
              <p class="excerpt">${esc(p.text.slice(0, 160))}${p.text.length > 160 ? '…' : ''}</p></div>
              <div class="row"><a class="btn sm" href="#/practice?prompt=${p.id}">Practice</a><button class="btn ghost sm danger" data-del="${p.id}">Delete</button></div>
            </div>`;
          }).join('')
        : '<div class="card empty-state"><p>No prompts yet. Add your first one — it will show up here and in the practice menu.</p></div>';
      $('#plist').querySelectorAll('[data-del]').forEach(b => (b.onclick = async () => {
        if (!confirm('Delete this prompt?')) return;
        try { await Store.deletePrompt(b.dataset.del); renderList(); toast('Prompt deleted.'); }
        catch (e) { toast(e.message); }
      }));
    }

    const ptext = $('#ptext'), ptitle = $('#ptitle');
    const count = () => {
      const n = Typer.normalize(ptext.value).length;
      $('#pcount').textContent = `${n.toLocaleString()} characters` + (ptext.value.length > Typer.MAX_CHARS ? ` (only the first ${Typer.MAX_CHARS.toLocaleString()} are used)` : '');
    };
    ptext.oninput = count;

    function readFile(file) {
      if (!file) return;
      if (file.size > 500 * 1024) return toast('That file is too large (max 500 KB).');
      const r = new FileReader();
      r.onload = () => {
        ptext.value = String(r.result);
        if (!ptitle.value) ptitle.value = file.name.replace(/\.[^.]+$/, '').slice(0, 60);
        count();
        toast('File loaded — review it and press Save.');
      };
      r.onerror = () => toast('Could not read that file.');
      r.readAsText(file);
    }
    $('#file').onchange = e => readFile(e.target.files[0]);
    const drop = $('#drop');
    ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('over')));
    drop.addEventListener('drop', e => { e.preventDefault(); readFile(e.dataTransfer.files[0]); });

    $('#pform').onsubmit = async e => {
      e.preventDefault();
      const text = Typer.normalize(ptext.value);
      if (text.length < 10) return toast('Prompt text should be at least 10 characters.');
      const btn = $('#pform button[type=submit]');
      btn.disabled = true;
      try {
        await Store.addPrompt(ptitle.value.trim() || 'Untitled', text);
        ptext.value = ''; ptitle.value = ''; $('#file').value = ''; count();
        renderList();
        toast('Prompt saved!');
      } catch (ex) { toast(ex.message); }
      finally { btn.disabled = false; }
    };
    renderList();
  }

  // ---------- Dashboard ----------
  function chartSVG(scores) {
    const data = scores.slice(-30);
    if (data.length < 2) return '<p class="muted">Complete at least two tests to see your progress chart.</p>';
    const W = 640, H = 220, L = 40, R = 14, T = 14, B = 28;
    const max = Math.max(20, Math.ceil(Math.max(...data.map(d => d.wpm)) / 10) * 10);
    const x = i => L + (i * (W - L - R)) / (data.length - 1);
    const y = v => T + (H - T - B) * (1 - v / max);
    const ticks = [0, max / 2, max];
    const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.wpm).toFixed(1)}`).join(' ');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Words per minute over your last ${data.length} tests">
      ${ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" class="grid"/><text x="${L - 8}" y="${y(t) + 4}" class="axis" text-anchor="end">${t}</text>`).join('')}
      <polyline points="${L},${y(0)} ${pts} ${W - R},${y(0)}" class="area"/>
      <polyline points="${pts}" class="line"/>
      ${data.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.wpm)}" r="4" class="dot"><title>${d.wpm} WPM · ${d.accuracy}% · ${new Date(d.date).toLocaleDateString()}</title></circle>`).join('')}
      <text x="${L}" y="${H - 8}" class="axis">Older</text><text x="${W - R}" y="${H - 8}" class="axis" text-anchor="end">Most recent</text>
    </svg>`;
  }

  function dashboardView() {
    const u = Store.current();
    if (!u) { go('#/login?next=/dashboard'); return; }
    const sc = u.scores;
    const avg = k => (sc.length ? Math.round((sc.reduce((a, s) => a + s[k], 0) / sc.length) * 10) / 10 : 0);
    const best = sc.length ? Math.max(...sc.map(s => s.wpm)) : 0;
    const last10 = sc.slice(-10);
    const recentAvg = last10.length ? Math.round(last10.reduce((a, s) => a + s.wpm, 0) / last10.length) : 0;
    const done = Object.keys(u.progress).length;
    view.innerHTML = `<section class="page">
      <div class="page-head"><div><h1>Hi, ${esc(u.name)}</h1><p class="muted">Member since ${new Date(u.created).toLocaleDateString()}</p></div>
        <a class="btn" href="#/practice">Practice now</a></div>
      <div class="tiles">
        <div class="tile card"><span>Best speed</span><b>${best}<small> WPM</small></b></div>
        <div class="tile card"><span>Last 10 average</span><b>${recentAvg}<small> WPM</small></b></div>
        <div class="tile card"><span>Average accuracy</span><b>${avg('accuracy')}<small>%</small></b></div>
        <div class="tile card"><span>Tests taken</span><b>${sc.length}</b></div>
        <div class="tile card"><span>Course</span><b>${done}<small> / ${LESSONS.length} lessons</small></b></div>
      </div>
      <div class="card"><h3>Speed over time</h3>${chartSVG(sc)}</div>
      <div class="dash-grid">
        <div class="card"><h3>Recent tests</h3>
          ${sc.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Text</th><th>WPM</th><th>Accuracy</th></tr></thead><tbody>
          ${sc.slice(-15).reverse().map(s => `<tr><td>${new Date(s.date).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td>${esc(s.source)}</td><td><b>${s.wpm}</b></td><td>${s.accuracy}%</td></tr>`).join('')}
          </tbody></table></div>` : '<p class="muted">No scores yet — <a href="#/practice">take your first test</a>.</p>'}
        </div>
        <div class="card"><h3>Course progress</h3>
          <ul class="course-prog">${LESSONS.map((l, i) => {
            const p = u.progress[l.id];
            return `<li class="${p ? 'done' : ''}"><a href="#/course?l=${l.id}"><span class="num ${p ? 'done' : ''}">${p ? '✓' : i + 1}</span>${esc(l.title)}</a>${p ? `<small>${p.bestWpm} WPM · ${p.bestAcc}%</small>` : ''}</li>`;
          }).join('')}</ul>
        </div>
      </div>
      <div class="card account-actions">
        <h3>Account</h3>
        <p class="muted small">Signed in${u.email ? ' as <b>' + esc(u.email) + '</b>' : ''} with ${{ 'google.com': 'Google', 'microsoft.com': 'Microsoft' }[u.provider] || 'email'}. Your scores, prompts and progress sync across devices.</p>
        ${u.provider === 'password' && !u.emailVerified ? '<p class="note small">Please verify your email address — check your inbox for the link. <button class="linkish" id="resend">Resend link</button></p>' : ''}
        <div class="row"><button class="btn ghost sm" id="clear">Clear score history</button><button class="btn ghost sm danger" id="delacct">Delete account</button></div>
      </div>
    </section>`;
    const resend = $('#resend');
    if (resend) resend.onclick = async () => {
      try { await Store.resendVerification(); toast('Verification email sent.'); } catch (e) { toast(e.message); }
    };
    $('#clear').onclick = async () => {
      if (!confirm('Clear all saved scores? This cannot be undone.')) return;
      try { await Store.clearScores(); toast('Scores cleared.'); route(); } catch (e) { toast(e.message); }
    };
    $('#delacct').onclick = async () => {
      if (!confirm('Delete your account, scores and prompts? This cannot be undone.')) return;
      try { await Store.deleteAccount(); toast('Account deleted.'); go('#/'); } catch (e) { toast(e.message); }
    };
  }

  // ---------- Auth ----------
  const GOOGLE_ICON = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const MS_ICON = '<svg viewBox="0 0 21 21" width="18" height="18" aria-hidden="true"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>';

  function authView(params, mode) {
    if (Store.current()) { go('#' + (params.get('next') || '/dashboard')); return; }
    const next = params.get('next') || '/dashboard';
    const isUp = mode === 'signup';
    const q = params.get('next') ? '?next=' + encodeURIComponent(next) : '';
    const ready = Store.configured;
    view.innerHTML = `<section class="page narrow"><div class="card auth">
      <h1>${isUp ? 'Create your free account' : 'Sign in to Keystride'}</h1>
      <p class="muted">Save your scores, upload your own prompts and track course progress on any device.</p>
      ${pendingResult ? `<p class="note">Your last score (<b>${pendingResult.wpm} WPM</b>, ${pendingResult.accuracy}%) will be saved to your account.</p>` : ''}
      ${ready ? '' : '<p class="note">Account sign-in hasn’t been switched on for this site yet. You can still use everything as a guest.</p>'}
      <div class="providers">
        <button class="btn provider" id="g-btn" ${ready ? '' : 'disabled'}>${GOOGLE_ICON}<span>Continue with Google</span></button>
        <button class="btn provider" id="ms-btn" ${ready ? '' : 'disabled'}>${MS_ICON}<span>Continue with Microsoft <small>(Outlook, Hotmail, Live)</small></span></button>
      </div>
      <div class="divider"><span>or use your email</span></div>
      <div class="tabs"><a href="#/login${q}" class="${isUp ? '' : 'on'}">Sign in</a><a href="#/signup${q}" class="${isUp ? 'on' : ''}">Create account</a></div>
      <form id="aform">
        ${isUp ? '<label>Your name<input id="aname" autocomplete="name" maxlength="60" required></label>' : ''}
        <label>Email<input id="aemail" type="email" autocomplete="email" required></label>
        <label>Password<input id="ap" type="password" autocomplete="${isUp ? 'new-password' : 'current-password'}" required minlength="6"></label>
        ${isUp ? '<label>Confirm password<input id="ap2" type="password" autocomplete="new-password" required minlength="6"></label>' : ''}
        <p class="error" id="aerr" role="alert"></p>
        <button class="btn lg block" type="submit" ${ready ? '' : 'disabled'}>${isUp ? 'Create account' : 'Sign in'}</button>
        ${isUp ? '' : '<button type="button" class="linkish" id="forgot">Forgot your password?</button>'}
      </form>
      <div class="divider"><span>or</span></div>
      <a class="btn ghost lg block" href="#/practice" id="guest">Continue as guest</a>
      <p class="muted small center">Guests can use practice and the full course. Scores aren’t saved until you sign in.</p>
    </div></section>`;

    const err = $('#aerr');
    const busy = on => view.querySelectorAll('.auth button').forEach(b => (b.disabled = on || !ready));
    async function finish(promise, welcome) {
      err.textContent = '';
      busy(true);
      try {
        const user = await promise();
        if (pendingResult) { await Store.addScore(pendingResult).catch(() => {}); pendingResult = null; toast(`Welcome, ${user.name}! Your score was saved.`); }
        else toast(welcome(user));
        go('#' + next);
      } catch (ex) { err.textContent = ex.message; busy(false); }
    }
    $('#g-btn').onclick = () => finish(Store.signInGoogle, u => `Welcome, ${u.name}!`);
    $('#ms-btn').onclick = () => finish(Store.signInMicrosoft, u => `Welcome, ${u.name}!`);
    $('#aform').onsubmit = e => {
      e.preventDefault();
      const email = $('#aemail').value, pw = $('#ap').value;
      if (isUp) {
        if (pw !== $('#ap2').value) { err.textContent = 'Passwords do not match.'; return; }
        finish(() => Store.signUpEmail($('#aname').value, email, pw), u => `Welcome, ${u.name}! We sent a verification link to your email.`);
      } else finish(() => Store.signInEmail(email, pw), u => `Welcome back, ${u.name}!`);
    };
    const forgot = $('#forgot');
    if (forgot) forgot.onclick = async () => {
      err.textContent = '';
      try { await Store.resetPassword($('#aemail').value); toast('If that email has an account, a reset link is on its way.'); }
      catch (ex) { err.textContent = ex.message; }
    };
    if (ready) (isUp ? $('#aname') : $('#aemail')).focus();
  }

  // ---------- Router ----------
  const ROUTES = {
    '/': homeView,
    '/practice': practiceView,
    '/course': courseView,
    '/prompts': promptsView,
    '/dashboard': dashboardView,
    '/login': p => authView(p, 'login'),
    '/signup': p => authView(p, 'signup'),
  };

  function route() {
    cleanups.forEach(fn => { try { fn(); } catch {} });
    cleanups = [];
    const [path, qs] = (location.hash.slice(1) || '/').split('?');
    const params = new URLSearchParams(qs || '');
    renderNav(path);
    (ROUTES[path] || homeView)(params);
    window.scrollTo(0, 0);
    document.getElementById('nav-links').classList.remove('open');
  }

  window.addEventListener('hashchange', route);
  document.getElementById('menu-btn').onclick = () => document.getElementById('nav-links').classList.toggle('open');
  view.innerHTML = '<p class="muted center" style="padding:3rem 0">Loading…</p>';
  Store.init().then(() => {
    route();
    // Re-draw the nav if the sign-in state changes later (e.g. signed out in another tab)
    Store.onChange(() => renderNav((location.hash.slice(1) || '/').split('?')[0]));
  });
})();
