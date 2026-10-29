/* Motor da apresentação: modal de etapas, contadores, ligações entre etapas e animações. */
(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const query = new URLSearchParams(location.search);
  const App = (window.App = {});

  App.speed = parseFloat(query.get('speed') || localStorage.getItem('apres-speed') || '1') || 1;
  const factor = () => App.speed * (reduce ? 4 : 1);
  App.ms = (ms) => ms / factor();
  App.wait = (ms) => new Promise((r) => setTimeout(r, App.ms(ms)));

  App.$ = (s, el) => (el || document).querySelector(s);
  App.$$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  App.h = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  App.fmt = (n) => Number(n).toLocaleString('pt-BR');
  App.brl = (n) => 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const strip = (s) => String(s).replace(/<[^>]+>/g, '');

  /* Lojas com movimento na competência 08/2026: código, lançamentos, débito (= crédito). */
  App.LOJAS = [
    ['001', 474, 162660.83], ['002', 426, 130930.33], ['003', 629, 207119.73], ['004', 321, 98236.37],
    ['005', 475, 148879.12], ['006', 401, 122458.09], ['007', 539, 176483.31], ['008', 459, 169120.84],
    ['010', 535, 221279.73], ['011', 253, 92663.64], ['012', 326, 101283.02], ['013', 578, 194984.64],
    ['014', 527, 169429.99], ['015', 443, 134555.00], ['016', 428, 137345.09], ['018', 483, 82363.65],
    ['031', 556, 295385.50],
  ];
  App.TOTAL = 2645178.88;

  /* ------------------------------------------------------------- ícones */
  const I = (App.icon = {
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    hand: '<svg viewBox="0 0 24 24"><path d="M5 19l1.2-4.4L15.5 5.3a1.8 1.8 0 012.6 0l.6.6a1.8 1.8 0 010 2.6L9.4 17.8z"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M12 6.5v7M12 17.5v.3"/></svg>',
  });

  const file = (ext, color) =>
    `<svg viewBox="0 0 40 40"><path d="M9 3h15l9 9v25H9z" fill="#fff" stroke="#9aa3b5" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M24 3v9h9" fill="#eef1f6" stroke="#9aa3b5" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M13 16h12M13 20.5h12" stroke="#c6ccd8" stroke-width="2" stroke-linecap="round"/>` +
    `<rect x="4" y="24" width="25" height="11" rx="3" fill="${color}"/>` +
    `<text x="16.5" y="32.4" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="8" font-weight="800" fill="#fff">${ext}</text></svg>`;
  const sys = (txt, color) =>
    `<svg viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="10" fill="${color}"/>` +
    `<text x="20" y="${txt.length > 2 ? 24.5 : 26}" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="${txt.length > 2 ? 11 : 15}" font-weight="800" fill="#fff">${txt}</text></svg>`;
  const tile = (color, inner) => `<svg viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="10" fill="${color}"/>${inner}</svg>`;
  const W = 'fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';

  App.art = {
    file, sys,
    excel: '<svg viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="10" fill="#1d6f42"/><rect x="22" y="9" width="10" height="22" rx="2" fill="#fff" opacity=".22"/><path d="M10.5 13l9.5 14M20 13l-9.5 14" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></svg>',
    excelMini: '<svg viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="9" fill="#fff"/><path d="M12 12l16 16M28 12L12 28" stroke="#1d6f42" stroke-width="4.4" stroke-linecap="round"/></svg>',
    txt: file('TXT', '#6c8ebf'),
    csv: file('CSV', '#d79b00'),
    xlsx: file('XLSX', '#1d6f42'),
    clock: tile('#6c8ebf', `<circle cx="20" cy="20" r="10" ${W}/><path d="M20 14v6.5l4.2 2.6" ${W}/>`),
    clockRm: tile('#0e8088', `<circle cx="20" cy="20" r="10" ${W}/><path d="M20 14v6.5l4.2 2.6" ${W}/>`),
    close: tile('#6c8ebf', `<path d="M13 10h10l5 5v15H13z" ${W}/><path d="M16.5 20.5l3 3 5-6" ${W}/>`),
    closeRm: tile('#0e8088', `<path d="M13 10h10l5 5v15H13z" ${W}/><path d="M16.5 20.5l3 3 5-6" ${W}/>`),
    export: tile('#6c8ebf', `<path d="M13 22v7h14v-7" ${W}/><path d="M20 10v13M15 15l5-5 5 5" ${W}/>`),
    users: tile('#5f8f4e', `<circle cx="16" cy="16" r="4" ${W}/><path d="M9 29c0-4 3.2-7 7-7s7 3 7 7" ${W}/><circle cx="26" cy="15" r="3.2" ${W}/><path d="M25 21.5c3 .3 6 2.6 6 6.5" ${W}/>`),
    upload: tile('#5f8f4e', `<path d="M12 24v5h16v-5" ${W}/><path d="M20 11v13M15 19l5 5 5-5" ${W}/>`),
    bank: tile('#5f8f4e', `<path d="M10 16l10-6 10 6M12 17v9M17 17v9M23 17v9M28 17v9M10 29h20" ${W}/>`),
    ledger: tile('#5f8f4e', `<rect x="11" y="10" width="18" height="20" rx="2" ${W}/><path d="M15 16h10M15 20h10M15 24h6" ${W}/>`),
    history: tile('#5f8f4e', `<path d="M12 20a8 8 0 108-8 8 8 0 00-6.3 3" ${W}/><path d="M12 11v4.5h4.5M20 15.5v5l3 2" ${W}/>`),
    server: tile('#7b5ea7', `<rect x="11" y="10" width="18" height="8" rx="2" ${W}/><rect x="11" y="22" width="18" height="8" rx="2" ${W}/><path d="M15 14h.1M15 26h.1" ${W}/>`),
    folder: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill="#ffe2a8" stroke="#d79b00" stroke-width="1.6"/></svg>',
    rm: sys('RM', '#0e8088'),
    rp: sys('RP', '#5f8f4e'),
    dom: sys('D', '#6c8ebf'),
  };

  /* Preenche os <span data-art="..."> do HTML. Aceita "nome" ou "sys:TXT:#cor" / "file:EXT:#cor". */
  App.paintArt = function (root) {
    App.$$('[data-art]', root).forEach((el) => {
      const [kind, a, b] = el.dataset.art.split(':');
      const v = App.art[kind];
      el.innerHTML = typeof v === 'function' ? v(a, b) : v || '';
    });
    App.$$('.node', root).forEach((n) => {
      if (!App.$('.node-check', n)) n.appendChild(App.h('span', 'node-check', I.check));
    });
  };

  /* ---------------------------------------------------------- barra topo */
  App.initToolbar = function () {
    const sp = App.$('#speed');
    if (sp) {
      const label = () => (sp.textContent = 'Velocidade ' + (App.speed >= 2 ? '2×' : '1×'));
      label();
      sp.addEventListener('click', () => {
        App.speed = App.speed >= 2 ? 1 : 2;
        localStorage.setItem('apres-speed', String(App.speed));
        label();
      });
    }
    const rs = App.$('#restart');
    if (rs) rs.addEventListener('click', () => location.reload());
  };

  /* ----------------------------------------------------------- contadores */
  App.counters = {};
  App.initCounters = function (defs) {
    const bar = App.$('#counters');
    defs.forEach((d) => {
      const c = App.h('div', 'counter tone-' + d.tone);
      c.innerHTML =
        `<span class="counter-value">${App.fmt(d.value || 0)}</span><span class="counter-label">${d.label}</span>` +
        (d.hint ? `<span class="counter-hint">${d.hint}</span>` : '');
      bar.appendChild(c);
      App.counters[d.key] = { el: c, value: d.value || 0, out: App.$('.counter-value', c) };
    });
  };
  App.countUp = function (el, from, to, ms, fmt) {
    const f = fmt || App.fmt;
    const t0 = performance.now();
    const d = Math.max(1, App.ms(ms || 700));
    return new Promise((res) => {
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / d);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = f(from + (to - from) * e);
        if (p < 1) requestAnimationFrame(tick);
        else { el.textContent = f(to); res(); }
      };
      requestAnimationFrame(tick);
    });
  };
  App.setCount = function (key, target) {
    const c = App.counters[key];
    const from = c.value;
    c.value = target;
    c.el.classList.remove('bump');
    void c.el.offsetWidth;
    c.el.classList.add('bump');
    return App.countUp(c.out, from, target, 700, (v) => App.fmt(Math.round(v)));
  };
  App.count = (key, delta) => App.setCount(key, App.counters[key].value + delta);

  /* ---------------------------------------------------------------- modal */
  App.modal = function (o) {
    const back = App.h('div', 'modal-backdrop');
    const box = App.h('div', `modal modal-${o.layout || 'files'} tone-${o.tone || 'dom'}`);
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', strip(o.title));
    const side = o.layout === 'api'
      ? '<div class="panel"></div><div class="log"><div class="log-head"><i></i>Registro de chamadas</div><div class="log-lines"></div></div>'
      : '<div class="preview"></div>';
    box.innerHTML =
      `<header class="modal-head"><div class="modal-icon">${o.icon || ''}</div><div>` +
      `<div class="modal-kicker"><span class="loader-dot"></span><span class="modal-status">Carregando…</span></div>` +
      `<h2>${o.title}</h2>${o.subtitle ? `<p>${o.subtitle}</p>` : ''}</div></header>` +
      (o.layout === 'api' ? '<div class="modal-flow"></div>' : '') +
      `<div class="modal-body"><ol class="steps"></ol><div class="modal-side">${side}</div></div>` +
      '<footer class="modal-foot"><div class="modal-progress"><span></span></div><div class="modal-actions"></div></footer>';
    back.appendChild(box);
    document.body.appendChild(back);
    void back.offsetWidth;
    back.classList.add('open');

    const stepsEl = App.$('.steps', box);
    const statusEl = App.$('.modal-status', box);
    const barEl = App.$('.modal-progress span', box);
    const actions = App.$('.modal-actions', box);
    const logEl = App.$('.log-lines', box);
    let total = o.steps || 0;
    let done = 0;

    const m = {
      el: box,
      preview: App.$('.preview', box),
      panel: App.$('.panel', box),
      flowEl: App.$('.modal-flow', box),
    };
    m.status = (t) => (statusEl.textContent = t);
    m.progress = (f) => (barEl.style.width = Math.round(Math.min(1, f) * 100) + '%');
    m.addTotal = (n) => { total += n; m.progress(done / total); };
    const tick = () => { done++; if (total) m.progress(done / total); };
    m.recover = () => box.classList.remove('failed');

    m.step = function (label, detail) {
      const li = App.h('li', 'step pending');
      li.innerHTML =
        `<span class="step-icon"></span><div class="step-text"><div class="step-label">${label}</div>` +
        `${detail ? `<div class="step-detail">${detail}</div>` : ''}</div><span class="step-tag"></span>`;
      stepsEl.appendChild(li);
      li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      const icon = App.$('.step-icon', li);
      const tag = App.$('.step-tag', li);
      const set = (state, svg, text) => {
        li.className = 'step ' + state;
        icon.innerHTML = svg || '';
        if (text) { tag.textContent = text; tag.classList.add('show'); } else tag.classList.remove('show');
      };
      const s = {
        el: li,
        loading() { set('loading'); m.status('Carregando · ' + strip(label)); return s; },
        waiting(text) { set('waiting', '', text); m.status('Aguardando · ' + strip(label)); return s; },
        done(text) { set('done', I.check, text); tick(); return s; },
        manual(text) { set('manual', I.hand, text || 'feito à mão'); tick(); return s; },
        warn(text) { set('warn', I.alert, text); tick(); return s; },
        error(text) { set('error', I.x, text); box.classList.add('failed'); m.status('Erro · ' + strip(label)); return s; },
        async run(ms, text) { s.loading(); await App.wait(ms || 900); return s.done(text); },
      };
      return s;
    };

    m.action = function (label, cls) {
      return new Promise((res) => {
        const b = App.h('button', 'btn ' + (cls || 'primary attention'), label);
        actions.appendChild(b);
        b.focus({ preventScroll: true });
        b.addEventListener('click', () => { b.disabled = true; b.remove(); res(); }, { once: true });
      });
    };
    m.finish = function (label, cls) {
      box.classList.add('finished');
      box.classList.remove('failed');
      m.status('Concluído');
      m.progress(1);
      return m.action(label || 'Continuar', cls || 'ok attention');
    };
    m.close = async function () {
      back.classList.remove('open');
      back.classList.add('closing');
      await App.wait(320);
      back.remove();
    };

    m.log = function (method, path, status, tone) {
      if (!logEl) return;
      const t = new Date();
      const hh = [t.getHours(), t.getMinutes(), t.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
      const line = App.h('div', 'log-line');
      line.innerHTML = `<span class="t">${hh}</span><span class="m">${method}</span><span class="p">${path}</span><span class="s ${tone || ''}">${status}</span>`;
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    };
    m.setPanel = function (html) {
      if (!m.panel) return null;
      m.panel.innerHTML = html;
      return m.panel;
    };
    return m;
  };

  /* -------------------------------------------- janelas de arquivo (preview) */
  App.textFile = function (parent, o) {
    const w = App.h('div', 'win ' + (o.tone || ''));
    const icon = o.icon || App.art.txt;
    w.innerHTML = `<div class="win-bar">${icon}<span>${o.file}</span><span class="dots"><i></i><i></i><i></i></span></div>` +
      (o.bar || '') + '<pre class="txt"></pre>';
    const pre = App.$('.txt', w);
    const lines = o.lines.map((text, i) => {
      const sp = App.h('span', 'ln' + (i === 0 && o.header ? ' head' : '') + (text.startsWith('…') ? ' more' : ''));
      sp.style.setProperty('--i', i);
      sp.textContent = text;
      pre.appendChild(sp);
      return sp;
    });
    parent.appendChild(w);
    return { el: w, pre, lines };
  };

  App.excel = function (parent, o) {
    const kind = o.kind || 'excel';
    const w = App.h('div', 'win ' + kind);
    const cols = o.head.length;
    const icon = { excel: App.art.excelMini, dom: App.art.dom, rp: App.art.rp, rm: App.art.rm }[kind];
    w.innerHTML =
      `<div class="win-bar">${icon}<span>${o.file}${kind === 'excel' ? ' — Excel' : ''}</span><span class="dots"><i></i><i></i><i></i></span></div>` +
      (o.bar || '') +
      (o.formula ? `<div class="xl-formula"><b>fx</b><span>${o.formula}</span></div>` : '') +
      `<div class="xl-wrap"><table class="xl"><thead><tr><th></th>${Array.from({ length: cols }, (_, i) => `<th>${String.fromCharCode(65 + i)}</th>`).join('')}</tr></thead><tbody></tbody></table></div>` +
      `<div class="xl-tabs">${(o.sheets || ['Plan1']).map((s, i) => `<span class="${i === (o.active || 0) ? 'on' : ''}">${s}</span>`).join('')}</div>`;
    const tbody = App.$('tbody', w);
    const mk = (cells, i, cls) => {
      const tr = App.h('tr', cls || '');
      tr.style.setProperty('--i', i);
      tr.innerHTML = `<td class="rn">${i + 1}</td>` + cells.map((c) => {
        const num = typeof c === 'number' || /^R?\$?\s?-?[\d.]+,\d{2}$/.test(String(c));
        return `<td class="${num ? 'n' : ''}">${typeof c === 'number' ? App.brl(c).replace('R$ ', '') : c}</td>`;
      }).join('');
      tbody.appendChild(tr);
      return tr;
    };
    mk(o.head, 0, 'hdr');
    const rows = o.rows.map((r, i) => mk(r, i + 1));
    parent.appendChild(w);
    return { el: w, rows, tabs: App.$$('.xl-tabs span', w) };
  };

  App.sweep = async function (rows, ms) {
    for (const r of rows) {
      r.classList.add('scan');
      r.scrollIntoView({ block: 'nearest' });
      await App.wait(ms || 110);
      r.classList.remove('scan');
      r.classList.add('seen');
    }
  };

  App.type = async function (el, text, ms) {
    el.classList.add('caret');
    for (const ch of text) {
      el.textContent += ch;
      await App.wait(ms || 110);
    }
    el.classList.remove('caret');
  };

  App.chips17 = function (parent) {
    const box = App.h('div', 'chips17');
    const chips = App.LOJAS.map(([c]) => {
      const s = App.h('span', '', c);
      box.appendChild(s);
      return s;
    });
    parent.appendChild(box);
    return chips;
  };

  App.bar = function (parent) {
    const b = App.h('div', 'bar', '<span></span>');
    parent.appendChild(b);
    const span = App.$('span', b);
    return (f, ms) => span.animate([{ width: span.style.width || '0%' }, { width: f * 100 + '%' }],
      { duration: App.ms(ms || 600), fill: 'forwards', easing: 'ease-out' }).finished.then(() => (span.style.width = f * 100 + '%'));
  };

  /* --------------------------------------------------- arquivo voando */
  App.fly = function (fromEl, toEl, html) {
    return new Promise((res) => {
      const a = fromEl.getBoundingClientRect();
      const b = toEl.getBoundingClientRect();
      const el = App.h('div', 'flyer', html);
      document.body.appendChild(el);
      const w = el.offsetWidth;
      const hh = el.offsetHeight;
      const x1 = a.left + a.width / 2 - w / 2, y1 = a.top + a.height / 2 - hh / 2;
      const x2 = b.left + b.width / 2 - w / 2, y2 = b.top + b.height / 2 - hh / 2;
      const cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - 90;
      const frames = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14, u = 1 - t;
        const x = u * u * x1 + 2 * u * t * cx + t * t * x2;
        const y = u * u * y1 + 2 * u * t * cy + t * t * y2;
        const sc = 1 + 0.2 * Math.sin(Math.PI * t);
        const rot = (t < 0.5 ? -5 : 5) * Math.sin(Math.PI * t);
        frames.push({ transform: `translate(${x}px, ${y}px) scale(${sc}) rotate(${rot}deg)`, opacity: t > 0.93 ? 0.15 : 1 });
      }
      el.animate(frames, { duration: App.ms(1050), easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' })
        .finished.then(() => {
          el.remove();
          toEl.classList.remove('receive');
          void toEl.offsetWidth;
          toEl.classList.add('receive');
          res();
        });
    });
  };

  /* ---------------------------------------------- ligações no palco (SVG) */
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  };
  App.svgEl = svgEl;

  App.links = function (stage) {
    const svg = svgEl('svg', { class: 'links' });
    const defs = svgEl('defs');
    [['man', '#d79b00'], ['int', '#8a93a5'], ['api', '#7b5ea7'], ['err', '#c0392b']].forEach(([k, c]) => {
      const mk = svgEl('marker', { id: 'arrow-' + k, viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
      mk.appendChild(svgEl('path', { d: 'M0 0L10 5L0 10z', fill: c }));
      defs.appendChild(mk);
    });
    svg.appendChild(defs);
    stage.appendChild(svg);
    const list = [];

    function geom(a, b) {
      const s = stage.getBoundingClientRect();
      const A = a.getBoundingClientRect(), B = b.getBoundingClientRect();
      const ax = A.left - s.left, ay = A.top - s.top, bx = B.left - s.left, by = B.top - s.top;
      let p1, p2, c1, c2;
      if (B.left >= A.right - 4) {
        p1 = [ax + A.width, ay + A.height / 2]; p2 = [bx - 4, by + B.height / 2];
        const dx = Math.max(30, (p2[0] - p1[0]) / 2);
        c1 = [p1[0] + dx, p1[1]]; c2 = [p2[0] - dx, p2[1]];
      } else if (B.right <= A.left + 4) {
        p1 = [ax, ay + A.height / 2]; p2 = [bx + B.width + 4, by + B.height / 2];
        const dx = Math.max(30, (p1[0] - p2[0]) / 2);
        c1 = [p1[0] - dx, p1[1]]; c2 = [p2[0] + dx, p2[1]];
      } else if (B.top >= A.bottom) {
        p1 = [ax + A.width / 2, ay + A.height]; p2 = [bx + B.width / 2, by - 4];
        const dy = (p2[1] - p1[1]) / 2;
        c1 = [p1[0], p1[1] + dy]; c2 = [p2[0], p2[1] - dy];
      } else {
        p1 = [ax + A.width / 2, ay]; p2 = [bx + B.width / 2, by + B.height + 4];
        const dy = (p1[1] - p2[1]) / 2;
        c1 = [p1[0], p1[1] - dy]; c2 = [p2[0], p2[1] + dy];
      }
      return `M${p1.join(' ')} C${c1.join(' ')} ${c2.join(' ')} ${p2.join(' ')}`;
    }

    function placeLabel(item) {
      if (!item.text) return;
      const L = item.path.getTotalLength();
      const pt = item.path.getPointAtLength(L / 2);
      item.text.setAttribute('x', pt.x);
      item.text.setAttribute('y', pt.y - 8);
    }

    function add(a, b, tone, label, opts) {
      const o = opts || {};
      const path = svgEl('path', { d: geom(a, b), class: 'link tone-' + tone });
      svg.appendChild(path);
      const item = { path, a, b };
      if (label) {
        item.text = svgEl('text', { class: 'link-label tone-' + tone, 'text-anchor': 'middle' });
        item.text.textContent = label;
      }
      list.push(item);
      const finish = () => {
        path.setAttribute('marker-end', `url(#arrow-${tone})`);
        path.classList.add(o.solid ? 'solid' : 'drawn');
        if (item.text) { svg.appendChild(item.text); placeLabel(item); }
      };
      if (o.instant) { finish(); return Promise.resolve(item); }
      const L = path.getTotalLength();
      path.style.strokeDasharray = L;
      path.style.strokeDashoffset = L;
      return path.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: App.ms(o.ms || 750), easing: 'ease-out' })
        .finished.then(() => {
          path.style.strokeDasharray = '';
          path.style.strokeDashoffset = '';
          finish();
          return item;
        });
    }

    const redraw = () => list.forEach((l) => { l.path.setAttribute('d', geom(l.a, l.b)); placeLabel(l); });
    window.addEventListener('resize', redraw);
    return { add, redraw, svg, list };
  };

  /* ------------------------------ faixa animada da API dentro do modal */
  App.flow = function (container) {
    const W = 900, H = 128, Y = 64, NW = 196, NH = 62;
    const nodes = {
      rm: { x: 120, label: 'TOTVS RM', sub: 'folha de pagamento', color: '#0e8088' },
      srv: { x: 450, label: 'Servidor de Integração', sub: 'API REST /api/v1', color: '#7b5ea7' },
      rp: { x: 780, label: 'RP Info', sub: 'RP Services API', color: '#5f8f4e' },
    };
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' });
    const defs = svgEl('defs');
    const f = svgEl('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
    f.appendChild(svgEl('feGaussianBlur', { stdDeviation: '2.4', result: 'b' }));
    const merge = svgEl('feMerge');
    merge.appendChild(svgEl('feMergeNode', { in: 'b' }));
    merge.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
    f.appendChild(merge);
    defs.appendChild(f);
    svg.appendChild(defs);

    const lines = {};
    [['rm', 'srv'], ['srv', 'rp']].forEach(([a, b]) => {
      const x1 = nodes[a].x + NW / 2, x2 = nodes[b].x - NW / 2;
      const base = svgEl('line', { x1, y1: Y, x2, y2: Y, stroke: '#dcd5ea', 'stroke-width': 4, 'stroke-linecap': 'round' });
      const dash = svgEl('line', { x1, y1: Y, x2, y2: Y, stroke: '#7b5ea7', 'stroke-width': 3, 'stroke-dasharray': '7 7', opacity: '.35' });
      dash.style.animation = 'march 1s linear infinite';
      svg.appendChild(base);
      svg.appendChild(dash);
      lines[a + '-' + b] = dash;
    });
    const lineFor = (a, b) => lines[a + '-' + b] || lines[b + '-' + a];

    Object.entries(nodes).forEach(([id, n]) => {
      const g = svgEl('g', { class: 'fnode' });
      const r = svgEl('rect', { x: n.x - NW / 2, y: Y - NH / 2, width: NW, height: NH, rx: 14, fill: '#fff', stroke: n.color, 'stroke-width': 2.5 });
      r.style.transformBox = 'fill-box';
      r.style.transformOrigin = 'center';
      const t = svgEl('text', { x: n.x, y: Y - 3, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: '#1d2433', 'font-family': 'Segoe UI,Arial,sans-serif' });
      t.textContent = n.label;
      const s = svgEl('text', { x: n.x, y: Y + 16, 'text-anchor': 'middle', 'font-size': 11.5, fill: '#5b6475', 'font-family': 'Segoe UI,Arial,sans-serif' });
      s.textContent = n.sub;
      g.appendChild(r); g.appendChild(t); g.appendChild(s);
      svg.appendChild(g);
      n.rect = r;
    });
    const layer = svgEl('g');
    svg.appendChild(layer);
    container.appendChild(svg);

    function mark(id, state) {
      const n = nodes[id];
      const color = state === 'error' ? '#c0392b' : state === 'ok' ? '#2e7d32' : n.color;
      n.rect.setAttribute('stroke', color);
      n.rect.setAttribute('fill', state === 'error' ? '#fff3f1' : state === 'active' ? '#faf7ff' : '#fff');
      n.rect.setAttribute('stroke-width', state ? 3.5 : 2.5);
    }
    function active(id) { Object.keys(nodes).forEach((k) => mark(k, k === id ? 'active' : null)); }

    function label(x, text, color) {
      const t = svgEl('text', { x, y: Y - 16, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 800, fill: color, 'font-family': 'Segoe UI,Arial,sans-serif', 'paint-order': 'stroke', stroke: '#fbfaff', 'stroke-width': 5 });
      t.textContent = text;
      layer.appendChild(t);
      t.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: App.ms(250), fill: 'forwards' });
      return t;
    }

    function packet(from, to, o) {
      const opt = o || {};
      const a = nodes[from].x, b = nodes[to].x, dir = Math.sign(b - a);
      const x1 = a + dir * NW / 2, x2 = b - dir * NW / 2;
      const color = opt.color || '#7b5ea7';
      const count = opt.count || 1, gap = opt.gap || 170, dur = opt.dur || 700;
      const ln = lineFor(from, to);
      ln.setAttribute('opacity', '1');
      ln.setAttribute('stroke', color);
      const lbl = opt.label ? label((x1 + x2) / 2, opt.label, color) : null;
      const one = (delay) => new Promise((res) => setTimeout(() => {
        const c = svgEl('circle', { r: opt.r || 7, cy: Y, cx: x1, fill: color, filter: 'url(#glow)' });
        layer.appendChild(c);
        const t0 = performance.now(), d = App.ms(dur);
        const step = (t) => {
          const p = Math.min(1, (t - t0) / d);
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          c.setAttribute('cx', x1 + (x2 - x1) * e);
          if (p < 1) requestAnimationFrame(step);
          else {
            c.remove();
            nodes[to].rect.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }],
              { duration: App.ms(260) });
            res();
          }
        };
        requestAnimationFrame(step);
      }, App.ms(delay)));
      const all = [];
      for (let i = 0; i < count; i++) all.push(one(i * gap));
      return Promise.all(all).then(() => {
        ln.setAttribute('opacity', '.35');
        ln.setAttribute('stroke', '#7b5ea7');
        if (lbl) lbl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: App.ms(400), fill: 'forwards' }).finished.then(() => lbl.remove());
      });
    }

    return { packet, active, mark };
  };
})();
