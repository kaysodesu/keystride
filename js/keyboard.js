/* SVG keyboard diagram with color-coded finger zones and transparent animated hands. */
window.KS_KB = (function () {
  const U = 48, GAP = 5, PAD = 14;
  const NS = 'http://www.w3.org/2000/svg';

  const K = (id, label, w = 1, shift = null) => ({ id, label, w, shift });
  const L = c => K(c, c.toUpperCase(), 1, c.toUpperCase());
  const P = (c, s) => K(c, c, 1, s);

  const ROWS = [
    [P('`', '~'), P('1', '!'), P('2', '@'), P('3', '#'), P('4', '$'), P('5', '%'), P('6', '^'), P('7', '&'), P('8', '*'), P('9', '('), P('0', ')'), P('-', '_'), P('=', '+'), K('Backspace', 'Backspace', 2)],
    [K('Tab', 'Tab', 1.5), ...'qwertyuiop'.split('').map(L), P('[', '{'), P(']', '}'), K('\\', '\\', 1.5, '|')],
    [K('Caps', 'Caps', 1.75), ...'asdfghjkl'.split('').map(L), P(';', ':'), P("'", '"'), K('Enter', 'Enter', 2.25)],
    [K('ShiftL', 'Shift', 2.25), ...'zxcvbnm'.split('').map(L), P(',', '<'), P('.', '>'), P('/', '?'), K('ShiftR', 'Shift', 2.75)],
    [K('CtrlL', 'Ctrl', 1.25), K('WinL', 'Win', 1.25), K('AltL', 'Alt', 1.25), K('Space', '', 6.25), K('AltR', 'Alt', 1.25), K('WinR', 'Win', 1.25), K('Menu', 'Menu', 1.25), K('CtrlR', 'Ctrl', 1.25)],
  ];

  const FINGERS = {
    lp: { name: 'Left pinky', color: '#e0557a' },
    lr: { name: 'Left ring', color: '#f08a3c' },
    lm: { name: 'Left middle', color: '#d6a51c' },
    li: { name: 'Left index', color: '#3fae5a' },
    lt: { name: 'Left thumb', color: '#7b8794' },
    rt: { name: 'Right thumb', color: '#7b8794' },
    ri: { name: 'Right index', color: '#2b9fd6' },
    rm: { name: 'Right middle', color: '#5b6ee8' },
    rr: { name: 'Right ring', color: '#9a5be0' },
    rp: { name: 'Right pinky', color: '#d14fc0' },
  };
  const FINGER_OF = {};
  const assign = (f, ids) => ids.forEach(i => (FINGER_OF[i] = f));
  assign('lp', ['`', '1', 'q', 'a', 'z', 'Tab', 'Caps', 'ShiftL', 'CtrlL', 'WinL']);
  assign('lr', ['2', 'w', 's', 'x']);
  assign('lm', ['3', 'e', 'd', 'c']);
  assign('li', ['4', '5', 'r', 't', 'f', 'g', 'v', 'b']);
  assign('ri', ['6', '7', 'y', 'u', 'h', 'j', 'n', 'm']);
  assign('rm', ['8', 'i', 'k', ',']);
  assign('rr', ['9', 'o', 'l', '.']);
  assign('rp', ['0', '-', '=', 'p', '[', ']', '\\', ';', "'", '/', 'Backspace', 'Enter', 'ShiftR', 'CtrlR', 'Menu', 'WinR']);
  assign('lt', ['AltL']);
  assign('rt', ['Space', 'AltR']);

  // Geometry
  const GEO = {};
  ROWS.forEach((row, r) => {
    let x = 0;
    row.forEach(k => {
      GEO[k.id] = { key: k, x: PAD + x * U + GAP / 2, y: PAD + r * U + GAP / 2, w: k.w * U - GAP, h: U - GAP, cx: PAD + (x + k.w / 2) * U, cy: PAD + r * U + U / 2 };
      x += k.w;
    });
  });
  const KB_W = 15 * U + 2 * PAD, KB_H = 5 * U + 2 * PAD, HAND_H = KB_H + 175;

  // Character -> key(s)
  const CHAR = {};
  ROWS.flat().forEach(k => {
    if (k.id.length === 1) {
      CHAR[k.id] = { id: k.id, shift: false };
      if (k.shift) CHAR[k.shift] = { id: k.id, shift: true };
    }
  });
  CHAR[' '] = { id: 'Space', shift: false };
  CHAR['\n'] = { id: 'Enter', shift: false };

  function keysForChar(ch) {
    const c = CHAR[ch];
    if (!c) return [];
    if (!c.shift) return [c.id];
    return [handOf(FINGER_OF[c.id]) === 'L' ? 'ShiftR' : 'ShiftL', c.id];
  }
  const handOf = f => (f ? f[0].toUpperCase() : null);

  // ---------- Hands geometry ----------
  const HOME_KEY = { lp: 'a', lr: 's', lm: 'd', li: 'f', ri: 'j', rm: 'k', rr: 'l', rp: ';' };
  const HOME_TIP = {};
  Object.entries(HOME_KEY).forEach(([f, k]) => (HOME_TIP[f] = { x: GEO[k].cx, y: GEO[k].cy }));
  HOME_TIP.lt = { x: GEO.Space.cx - 30, y: GEO.Space.cy + 4 };
  HOME_TIP.rt = { x: GEO.Space.cx + 30, y: GEO.Space.cy + 4 };
  const KN_OFF = { lp: [24, 150], lr: [12, 162], lm: [0, 166], li: [-14, 160] };
  const BASE_K = {};
  Object.entries(KN_OFF).forEach(([f, [dx, dy]]) => {
    BASE_K[f] = { x: HOME_TIP[f].x + dx, y: HOME_TIP[f].y + dy };
    const rf = 'r' + f[1];
    BASE_K[rf] = { x: HOME_TIP[rf].x - dx, y: HOME_TIP[rf].y + dy };
  });
  BASE_K.lt = { x: BASE_K.li.x + 2, y: BASE_K.li.y + 74 };
  BASE_K.rt = { x: BASE_K.ri.x - 2, y: BASE_K.ri.y + 74 };
  const WIDTH = { lp: 21, lr: 24, lm: 25, li: 25, lt: 28, rt: 28, ri: 25, rm: 25, rr: 24, rp: 21 };
  const HAND_FINGERS = { L: ['lp', 'lr', 'lm', 'li', 'lt'], R: ['rp', 'rr', 'rm', 'ri', 'rt'] };

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const a in attrs) e.setAttribute(a, attrs[a]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function create(container, opts = {}) {
    const { hands = true, zones = true } = opts;
    const H = hands ? HAND_H : KB_H;
    const svg = el('svg', { viewBox: `0 0 ${KB_W} ${H}`, class: 'kb' + (zones ? ' zones' : ''), role: 'img', 'aria-label': 'Keyboard diagram showing which finger presses each key' });
    el('rect', { x: 2, y: 2, width: KB_W - 4, height: KB_H - 4, rx: 14, class: 'kb-case' }, svg);

    const keyEls = {};
    Object.values(GEO).forEach(g => {
      const f = FINGER_OF[g.key.id];
      const grp = el('g', { class: 'key', 'data-id': g.key.id }, svg);
      el('rect', { x: g.x, y: g.y, width: g.w, height: g.h, rx: 7, class: 'base' }, grp);
      const tint = el('rect', { x: g.x, y: g.y, width: g.w, height: g.h, rx: 7, class: 'tint' }, grp);
      tint.style.fill = f ? FINGERS[f].color : 'transparent';
      tint.style.fillOpacity = zones && f ? 0.2 : 0;
      const k = g.key;
      const isChar = k.id.length === 1;
      if (isChar && k.shift && k.shift !== k.label) {
        el('text', { x: g.cx, y: g.cy - 7, class: 'lbl sm' }, grp).textContent = k.shift;
        el('text', { x: g.cx, y: g.cy + 12, class: 'lbl' }, grp).textContent = k.label;
      } else {
        el('text', { x: g.cx, y: g.cy + 5, class: 'lbl' + (isChar ? '' : ' xs') }, grp).textContent = k.label;
      }
      if (k.id === 'f' || k.id === 'j') el('rect', { x: g.cx - 7, y: g.y + g.h - 10, width: 14, height: 3, rx: 1.5, class: 'bump' }, grp);
      keyEls[k.id] = { grp, tint, f, labels: grp.querySelectorAll('text') };
    });

    // Hands
    const handEls = {};
    let state = null;
    if (hands) {
      const handsLayer = el('g', { class: 'hands' }, svg);
      ['L', 'R'].forEach(side => {
        const g = el('g', { class: 'hand', opacity: 0.42 }, handsLayer);
        const palmOutline = el('path', { class: 'palm-o' }, g);
        const outlines = {}, fills = {};
        HAND_FINGERS[side].forEach(f => (outlines[f] = el('line', { class: 'fin-o', 'stroke-width': WIDTH[f] + 4 }, g)));
        const palmFill = el('path', { class: 'palm-f' }, g);
        HAND_FINGERS[side].forEach(f => (fills[f] = el('line', { class: 'fin-f', 'stroke-width': WIDTH[f] }, g)));
        handEls[side] = { palmOutline, palmFill, outlines, fills };
      });
      // highlight overlay (colored active finger)
      const hl = el('g', { class: 'hl-layer' }, svg);
      Object.keys(FINGERS).forEach(f => {
        const line = el('line', { class: 'fin-hl', 'stroke-width': WIDTH[f], stroke: FINGERS[f].color }, hl);
        const tip = el('circle', { class: 'tip-hl', r: WIDTH[f] / 2 + 4, stroke: FINGERS[f].color }, hl);
        handEls[f] = { line, tip };
      });
      state = targetState({});
      apply(state);
    }
    container.innerHTML = '';
    container.appendChild(svg);

    let active = new Set(); // highlighted fingers
    let anim = null;

    function targetState(moves) {
      // moves: {L: {f, x, y}, R: {...}}
      const s = {};
      ['L', 'R'].forEach(side => {
        const m = moves[side];
        let sx = 0, sy = 0;
        if (m) {
          const h = HOME_TIP[m.f];
          sx = (m.x - h.x) * 0.3;
          sy = (m.y - h.y) * 0.3;
        }
        HAND_FINGERS[side].forEach(f => {
          const k = BASE_K[f], t = HOME_TIP[f];
          const tip = m && m.f === f ? { x: m.x, y: m.y } : { x: t.x + sx, y: t.y + sy };
          s[f] = { kx: k.x + sx, ky: k.y + sy, tx: tip.x, ty: tip.y };
        });
      });
      return s;
    }

    function palmPath(s, side) {
      const fs = HAND_FINGERS[side];
      const p = fs.map(f => [s[f].kx, s[f].ky]);
      const dir = side === 'L' ? 1 : -1;
      const pinky = p[0], index = p[3];
      const pts = [[pinky[0] - 4 * dir, pinky[1] + 4], p[1], p[2], index, [index[0] - 6 * dir, index[1] + 60], [index[0] - 18 * dir, HAND_H + 40], [pinky[0] + 18 * dir, HAND_H + 40]];
      return 'M' + pts.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L') + ' Z';
    }

    function setLine(line, v) {
      line.setAttribute('x1', v.kx); line.setAttribute('y1', v.ky);
      line.setAttribute('x2', v.tx); line.setAttribute('y2', v.ty);
    }

    function apply(s) {
      ['L', 'R'].forEach(side => {
        const h = handEls[side];
        const d = palmPath(s, side);
        h.palmOutline.setAttribute('d', d);
        h.palmFill.setAttribute('d', d);
        HAND_FINGERS[side].forEach(f => {
          setLine(h.outlines[f], s[f]);
          setLine(h.fills[f], s[f]);
          setLine(handEls[f].line, s[f]);
          handEls[f].tip.setAttribute('cx', s[f].tx);
          handEls[f].tip.setAttribute('cy', s[f].ty);
        });
      });
    }

    function animateTo(target, ms = 170) {
      if (!hands) return;
      if (anim) cancelAnimationFrame(anim);
      const from = JSON.parse(JSON.stringify(state));
      const t0 = performance.now();
      const step = now => {
        const t = Math.min(1, (now - t0) / ms);
        const e = 1 - Math.pow(1 - t, 3);
        const s = {};
        for (const f in target) {
          s[f] = {};
          for (const k in target[f]) s[f][k] = from[f][k] + (target[f][k] - from[f][k]) * e;
        }
        state = s;
        apply(s);
        anim = t < 1 ? requestAnimationFrame(step) : null;
      };
      anim = requestAnimationFrame(step);
    }

    function setActiveFingers(fs) {
      active = new Set(fs);
      if (!hands) return;
      Object.keys(FINGERS).forEach(f => svg.querySelector('.hl-layer').classList.toggle('on-' + f, active.has(f)));
      Object.keys(FINGERS).forEach(f => {
        handEls[f].line.classList.toggle('on', active.has(f));
        handEls[f].tip.classList.toggle('on', active.has(f));
      });
    }

    function highlightKeys(ids) {
      Object.entries(keyEls).forEach(([id, k]) => {
        const on = ids.includes(id);
        k.grp.classList.toggle('target', on);
        k.tint.style.fillOpacity = on ? 1 : zones && k.f ? 0.2 : 0;
      });
    }

    // Public API
    return {
      svg,
      /** Highlight keys; optionally move fingers to press them (one finger per hand). */
      showKeys(ids, { move = true } = {}) {
        ids = ids.filter(id => GEO[id]);
        highlightKeys(ids);
        const fingers = [...new Set(ids.map(id => FINGER_OF[id]).filter(Boolean))];
        setActiveFingers(fingers);
        if (!hands) return;
        const moves = {};
        if (move) {
          ids.forEach(id => {
            const f = FINGER_OF[id];
            if (!f) return;
            const side = handOf(f);
            if (!moves[side]) moves[side] = { f, x: GEO[id].cx, y: GEO[id].cy + (id === 'Space' ? 2 : 0) };
          });
          // keep thumbs at their natural spot on the space bar
          ['L', 'R'].forEach(s => {
            if (moves[s] && moves[s].f[1] === 't' && moves[s].f && ids.includes('Space')) {
              moves[s].x = HOME_TIP[moves[s].f].x; moves[s].y = HOME_TIP[moves[s].f].y + 4;
            }
          });
        }
        animateTo(targetState(moves));
      },
      showChar(ch, opts) { this.showKeys(keysForChar(ch), opts); },
      home() { highlightKeys([]); setActiveFingers([]); if (hands) animateTo(targetState({})); },
      flash(ch, ok) {
        const ids = keysForChar(ch);
        const id = ids[ids.length - 1];
        const k = id && keyEls[id];
        if (!k) return;
        k.grp.classList.remove('hit', 'miss');
        void k.grp.getBBox();
        k.grp.classList.add(ok ? 'hit' : 'miss');
        setTimeout(() => k.grp.classList.remove('hit', 'miss'), 220);
      },
    };
  }

  function fingerForChar(ch) {
    const ids = keysForChar(ch);
    return ids.length ? FINGER_OF[ids[ids.length - 1]] : null;
  }

  return { create, keysForChar, fingerForChar, FINGERS, FINGER_OF, CHAR };
})();
