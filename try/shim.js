/* Loaded first in every page of the demo on the quotation link.
   - the clock is pinned, so sample plans and dates stay valid;
   - the demo keeps its data under its own name in this browser, memory if the browser says no;
   - nothing leaves: only this demo's own folder can be read;
   - a mouse can drag what a finger would swipe;
   - the frame around it hears what happened, by message. */
(function () {
  'use strict';
  var me = document.currentScript, APP = me.getAttribute('data-app'), R = window;
  var qs = new URLSearchParams(location.search), PIN = '2026-11-01T13:36:00';
  var ROOT = new URL('./', me.src).pathname, HOME = location.origin;
  document.documentElement.setAttribute('spellcheck', 'false');

  /* ---- the clock ---- */
  (function () {
    var D0 = Date, base = new D0(PIN).getTime(), t0 = D0.now();
    function now() { return base + (D0.now() - t0); }
    function D() { var a = arguments; if (!(this instanceof D)) return new D0(now()).toString(); if (a.length === 0) return new D0(now()); return new (Function.prototype.bind.apply(D0, [null].concat([].slice.call(a))))(); }
    D.prototype = D0.prototype; D.now = now; D.parse = D0.parse; D.UTC = D0.UTC; window.Date = D;
  })();

  /* ---- storage: the demo's own drawer, memory if the browser says no ---- */
  var ROLE = null;
  function drawer(getReal, prefix) {
    var mem = {}, real = null;
    try { real = getReal(); real.getItem('x'); } catch (e) { real = null; }
    function keys() {
      var out = [];
      if (real) { try { for (var i = 0; i < real.length; i++) { var k = real.key(i); if (k && k.indexOf(prefix) === 0) out.push(k.slice(prefix.length)); } return out; } catch (e) { } }
      return Object.keys(mem);
    }
    var api = {
      getItem: function (k) { k = String(k); if (real) { try { var v = real.getItem(prefix + k); if (v !== null) return v; } catch (e) { } } return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function (k, v) { k = String(k); v = String(v); mem[k] = v; if (real) { try { real.setItem(prefix + k, v); } catch (e) { } } },
      removeItem: function (k) { k = String(k); delete mem[k]; if (real) { try { real.removeItem(prefix + k); } catch (e) { } } },
      clear: function () { keys().forEach(api.removeItem); },
      key: function (i) { return keys()[i] || null; }
    };
    Object.defineProperty(api, 'length', { get: function () { return keys().length; } });
    return new Proxy(api, {
      get: function (t, p) { if (p in t) return t[p]; if (typeof p !== 'string') return undefined; var v = api.getItem(p); return v === null ? undefined : v; },
      set: function (t, p, v) { api.setItem(p, v); return true; },
      has: function (t, p) { return p in t || api.getItem(p) !== null; },
      deleteProperty: function (t, p) { api.removeItem(p); return true; },
      ownKeys: function () { return keys(); },
      getOwnPropertyDescriptor: function (t, p) { var v = api.getItem(p); return v === null ? undefined : { value: v, enumerable: true, configurable: true, writable: true }; }
    });
  }
  var LS = drawer(function () { return R.localStorage; }, 'live.' + APP + '.'), SS = drawer(function () { return R.sessionStorage; }, 'live.' + APP + '.');
  try { Object.defineProperty(R, 'localStorage', { value: LS, configurable: true }); Object.defineProperty(R, 'sessionStorage', { value: SS, configurable: true }); } catch (e) { }

  /* who is signed in stays with this tab, so Reach in one tab and Pulse in another do not swap people */
  (function () {
    var as = qs.get('liveas'), lang = qs.get('livelang'), cfg = (R.LIVE_APP_SETUP || {});
    if (as) SS.setItem('role', as);
    ROLE = as || SS.getItem('role');
    if (lang && cfg.langKey) LS.setItem(cfg.langKey, lang);
    if (ROLE && cfg.sessions && cfg.sessions[ROLE]) { Object.keys(cfg.sessions[ROLE]).forEach(function (k) { var v = cfg.sessions[ROLE][k]; if (v === null) LS.removeItem(k); else LS.setItem(k, v); }); }
    if (as || lang) { qs.delete('liveas'); qs.delete('livelang'); var s = qs.toString(); try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) { } }
  })();

  /* ---- nothing leaves ---- */
  var fetch0 = R.fetch ? R.fetch.bind(R) : null;
  var NO = 'This demo has no connection.';
  R.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || String(input), abs;
    try { abs = new URL(url, location.href); } catch (e) { return Promise.reject(new TypeError('Bad address')); }
    if (abs.protocol === 'blob:' || abs.protocol === 'data:') return fetch0(input, init);
    if (abs.origin !== HOME || abs.pathname.indexOf(ROOT) !== 0) return Promise.reject(new TypeError(NO));
    return fetch0(input, init);
  };
  R.XMLHttpRequest = function () { throw new Error(NO); };
  if (navigator.sendBeacon) { try { navigator.sendBeacon = function () { return true; }; } catch (e) { } }
  R.WebSocket = function () { throw new Error(NO); };
  R.EventSource = function () { throw new Error(NO); };
  R.open = function (u) {
    var a = String(u || '');
    if (/^https?:|^mailto:|^tel:|^whatsapp:/i.test(a)) { post({ live: 'outside' }); return null; }
    return null;
  };

  /* ---- to the frame around the demo ---- */
  function post(m) { try { if (R.parent !== R) R.parent.postMessage(m, HOME); } catch (e) { } }
  window.__livePost = post;
  R.addEventListener('message', function (e) {
    var m = e.data; if (!m || e.origin !== HOME) return;
    if (m.live && e.source !== R.parent) post(m);
  });
  R.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(a.getAttribute('href') || '') && a.origin !== HOME) { e.preventDefault(); e.stopPropagation(); post({ live: 'outside' }); }
  }, true);

  /* a touch that closed a list keeps its click from falling on what lay under the list */
  window.__noGhost = function (e) {
    if (e && e.pointerType === 'mouse') return;
    var off = function (ev) { ev.preventDefault(); ev.stopPropagation(); R.removeEventListener('click', off, true); };
    R.addEventListener('click', off, true);
    setTimeout(function () { R.removeEventListener('click', off, true); }, 700);
  };

  /* ---- a mouse does what a finger does: drag to scroll, on both axes, snapping rows included ---- */
  (function () {
    if (R.matchMedia && R.matchMedia('(pointer: coarse)').matches) return;
    var D = null, stopClick = false;
    var typing = function (e) { var t = e.target; return t && t.nodeType === 1 && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable); };
    var cap0 = Element.prototype.setPointerCapture;
    Element.prototype.setPointerCapture = function (id) { D = null; return cap0.call(this, id); };
    var can = function (el, ax) {
      var st = getComputedStyle(el), o = ax === 'x' ? st.overflowX : st.overflowY;
      if (el === document.scrollingElement || el === document.documentElement || el === document.body) return ax === 'y' ? document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight + 2 && el === document.scrollingElement : false;
      return /(auto|scroll)/.test(o) && (ax === 'x' ? el.scrollWidth > el.clientWidth + 2 : el.scrollHeight > el.clientHeight + 2);
    };
    var find = function (t, ax) { for (var el = t; el && el.nodeType === 1; el = el.parentElement) if (can(el, ax)) return el; return ax === 'y' && can(document.scrollingElement, 'y') ? document.scrollingElement : null; };
    R.addEventListener('mousedown', function (e) {
      if (e.button !== 0 || typing(e) || (e.target.closest && e.target.closest('[data-nodrag],input,select,textarea'))) return;
      D = { x: e.clientX, y: e.clientY, t: e.target, on: false, ax: '', box: null, sx: 0, sy: 0, vx: 0, lx: e.clientX, ly: e.clientY, lt: performance.now(), vy: 0 };
    }, true);
    R.addEventListener('mousemove', function (e) {
      if (!D) return;
      var dx = e.clientX - D.x, dy = e.clientY - D.y;
      if (!D.on) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        var ax = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y', box = find(D.t, ax);
        if (!box) { D = null; return; }
        D.on = true; D.ax = ax; D.box = box; D.sx = box.scrollLeft; D.sy = box.scrollTop; D.snap = getComputedStyle(box).scrollSnapType; D.beh = box.style.scrollBehavior;
        box.style.scrollSnapType = 'none'; box.style.scrollBehavior = 'auto'; document.documentElement.classList.add('live-drag');
      }
      e.preventDefault();
      var t = performance.now(), dt = Math.max(1, t - D.lt); D.vx = (e.clientX - D.lx) / dt; D.vy = (e.clientY - D.ly) / dt; D.lx = e.clientX; D.ly = e.clientY; D.lt = t;
      if (D.ax === 'x') D.box.scrollLeft = D.sx - dx; else D.box.scrollTop = D.sy - dy;
    }, true);
    function finish(d) {
      var box = d.box, snap = d.snap && d.snap !== 'none', v = d.ax === 'x' ? d.vx : d.vy, n = 0;
      document.documentElement.classList.remove('live-drag');
      function done() {
        if (snap && d.ax === 'x') {
          var kids = [].slice.call(box.children), r = box.getBoundingClientRect(), c = r.left + r.width / 2, best = null, bd = 1e9;
          kids.forEach(function (k) { var q = k.getBoundingClientRect(), g = Math.abs(q.left + q.width / 2 - c); if (q.width && g < bd) { bd = g; best = q; } });
          box.style.scrollBehavior = 'smooth'; if (best) box.scrollLeft += best.left + best.width / 2 - c;
          setTimeout(function () { box.style.scrollSnapType = ''; box.style.scrollBehavior = d.beh; }, 420);
        } else { box.style.scrollSnapType = ''; box.style.scrollBehavior = d.beh; }
      }
      function coast() {
        if (Math.abs(v) < .05 || n++ > 40) return done();
        if (d.ax === 'x') box.scrollLeft -= v * 16; else box.scrollTop -= v * 16;
        v *= .92; requestAnimationFrame(coast);
      }
      coast();
    }
    R.addEventListener('mouseup', function () { if (D && D.on) { stopClick = true; setTimeout(function () { stopClick = false; }, 60); finish(D); } D = null; }, true);
    R.addEventListener('click', function (e) { if (stopClick) { e.preventDefault(); e.stopPropagation(); stopClick = false; } }, true);
    R.addEventListener('dragstart', function (e) { if (!typing(e)) e.preventDefault(); }, true);
  })();

  /* the look of a phone: no desktop bars */
  document.addEventListener('DOMContentLoaded', function () {
    var st = document.createElement('style');
    st.textContent = 'html{scrollbar-width:none}::-webkit-scrollbar{display:none;width:0;height:0}html.live-drag,html.live-drag *{user-select:none!important;cursor:grabbing!important}' + ((R.LIVE_APP_SETUP || {}).css || '');
    document.head.appendChild(st);
    post({ live: 'page', app: APP, at: location.pathname.split('/').pop() });
  });
  R.addEventListener('error', function (e) { post({ live: 'error', msg: String(e.message || '').slice(0, 200) }); });
})();
