/* ==========================================================================
   main.js — interaction layer (classic script, works from file:// too)
   Lenis smooth scroll, glass light + selection lens, reveals, theme switch
   with a circular reveal, segmented skills, dock magnification, Lottie,
   contact form and a Dynamic Island toast. GSAP drives the hero parallax.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  doc.classList.add('ui-on');

  /* -------------------------------------------------------- Smooth scroll */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    if (window.gsap) {
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  var easeOutExpo = function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };

  function goTo(target, done) {
    var offset = window.innerWidth <= 760 ? -76 : -92;
    if (lenis) {
      lenis.scrollTo(target, { offset: target === 0 ? 0 : offset, duration: 1.6, easing: easeOutExpo, onComplete: done });
      return;
    }
    var y = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    if (done) setTimeout(done, reduce ? 50 : 900);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id || id === 'main') return;
    var el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    // Move the selection straight to where we are going, in one slide,
    // and hold it there while the page scrolls underneath.
    var dest = id === 'top' ? null : (NAV_IDS.indexOf(id) > -1 ? id : null);
    if (id === 'top' || dest) holdActive(dest);
    goTo(id === 'top' ? 0 : el, releaseActive);
    history.replaceState(null, '', '#' + id);
  });

  /* --------------------------------------------------- Dynamic Island toast */
  var island = $('#toast');
  var islandText = $('#toastText');
  var toastTimer;
  function toast(msg) {
    if (!island) return;
    islandText.textContent = msg;
    island.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { island.classList.remove('is-on'); }, 2800);
  }

  /* ---------------------------------------------------------------- Theme */
  var themeBtn = $('#themeToggle');
  var metaTheme = $('meta[name="theme-color"]');
  function applyThemeMeta() {
    var t = doc.getAttribute('data-theme');
    if (themeBtn) themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    if (metaTheme) metaTheme.setAttribute('content', t === 'dark' ? '#000000' : '#f2f2f7');
  }
  function setTheme(t) {
    doc.setAttribute('data-theme', t);
    applyThemeMeta();
  }
  function switchTheme(next, x, y) {
    if (document.startViewTransition && !reduce) {
      var r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      var vt = document.startViewTransition(function () { setTheme(next); });
      vt.ready.then(function () {
        doc.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 800, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
    } else {
      doc.classList.add('theme-fade');
      setTheme(next);
      setTimeout(function () { doc.classList.remove('theme-fade'); }, 700);
    }
  }
  applyThemeMeta();
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      var b = themeBtn.getBoundingClientRect();
      try { localStorage.setItem('theme', next); } catch (e) {}
      switchTheme(next, b.left + b.width / 2, b.top + b.height / 2);
    });
  }
  // Follow the system until the visitor picks a theme.
  var sysDark = window.matchMedia('(prefers-color-scheme: dark)');
  var onSys = function (e) {
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) {}
    if (!saved) switchTheme(e.matches ? 'dark' : 'light', window.innerWidth / 2, 0);
  };
  if (sysDark.addEventListener) sysDark.addEventListener('change', onSys);

  /* ------------------------------------------------------ Selection lens */
  // A drop of glass under the selected item. Each edge is its own spring:
  // the edge in the direction of travel is stiffer, so the drop stretches
  // as it moves, thins a little (keeping its volume) and settles softly.
  var LEAD = { k: 430, z: 0.74 };
  var TRAIL = { k: 175, z: 0.92 };

  function Lens(group) {
    this.g = group;
    this.el = $('.lens', group);
    this.l = this.r = this.vl = this.vr = this.tl = this.tr = 0;
    this.on = false;
    this.raf = 0;
    this.target = null;
    this.tick = this.tick.bind(this);
  }
  Lens.prototype.to = function (target, instant) {
    var g = this.g;
    this.target = target || null;
    if (!target || !target.offsetWidth) {
      g.classList.remove('has-lens');
      this.on = false;
      return;
    }
    this.tl = target.offsetLeft;
    this.tr = this.tl + target.offsetWidth;
    // The slide always runs: it is small, stays inside the bar, and was asked for.
    if (instant || !this.on) {
      // First appearance: place it, then let CSS drop it in with a spring.
      cancelAnimationFrame(this.raf); this.raf = 0;
      this.l = this.tl; this.r = this.tr; this.vl = this.vr = 0;
      this.render();
      g.classList.remove('is-moving');
      if (!this.on) { this.on = true; void this.el.offsetWidth; g.classList.add('has-lens'); }
      return;
    }
    if (!this.raf) {
      this.last = performance.now();
      g.classList.add('is-moving');
      this.raf = requestAnimationFrame(this.tick);
    }
  };
  Lens.prototype.refresh = function () { if (this.target) this.to(this.target, true); };
  Lens.prototype.tick = function (now) {
    var dt = Math.min(0.034, Math.max(0.001, (now - this.last) / 1000));
    this.last = now;
    var goingRight = (this.tl + this.tr) - (this.l + this.r) >= 0;
    var sl = goingRight ? TRAIL : LEAD, sr = goingRight ? LEAD : TRAIL;
    var n = 4, h = dt / n;
    for (var i = 0; i < n; i++) {
      this.vl += (-sl.k * (this.l - this.tl) - 2 * sl.z * Math.sqrt(sl.k) * this.vl) * h;
      this.l += this.vl * h;
      this.vr += (-sr.k * (this.r - this.tr) - 2 * sr.z * Math.sqrt(sr.k) * this.vr) * h;
      this.r += this.vr * h;
    }
    if (this.r - this.l < 12) { var c = (this.l + this.r) / 2; this.l = c - 6; this.r = c + 6; }
    var done = Math.abs(this.l - this.tl) < 0.15 && Math.abs(this.r - this.tr) < 0.15 && Math.abs(this.vl) < 3 && Math.abs(this.vr) < 3;
    if (done) {
      this.l = this.tl; this.r = this.tr; this.vl = this.vr = 0;
      this.render();
      this.raf = 0;
      this.g.classList.remove('is-moving');
      return;
    }
    this.render();
    this.raf = requestAnimationFrame(this.tick);
  };
  Lens.prototype.render = function () {
    var w = this.r - this.l;
    var natural = Math.max(1, this.tr - this.tl);
    var stretch = Math.max(0, w - natural) / natural;           // 0 at rest, ~1 when twice as long
    var sy = Math.max(0.8, 1 - stretch * 0.14);                  // thins as it stretches
    this.el.style.width = w.toFixed(2) + 'px';
    this.el.style.transform = 'translate3d(' + this.l.toFixed(2) + 'px,0,0) scaleY(' + sy.toFixed(4) + ')';
  };

  var lenses = $$('[data-lens-group]').map(function (g) { var L = new Lens(g); g._lens = L; return L; });
  function refreshLenses() { lenses.forEach(function (L) { L.refresh(); }); }
  window.addEventListener('resize', refreshLenses);

  /* ----------------------------------------------------------- Navigation */
  var NAV_IDS = ['about', 'skills', 'work', 'journey', 'contact'];
  var nav = $('#nav');
  var tabbar = $('#tabbar');
  var navGroups = $$('.nav__links, .tabbar');
  var activeId = undefined;
  var held = false, holdTimer = 0;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    navGroups.forEach(function (g) {
      var hit = null;
      $$('a', g).forEach(function (a) {
        var on = !!id && a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        if (on) hit = a;
      });
      if (g._lens) g._lens.to(hit);
    });
  }

  // Which section owns the middle of the screen right now?
  var trackIds = ['about', 'skills', 'work', 'journey', 'interests', 'contact'];
  var trackEls = trackIds.map(function (id) { return document.getElementById(id); });
  function currentSection() {
    var line = window.innerHeight * 0.45, id = null;
    for (var i = 0; i < trackEls.length; i++) {
      if (trackEls[i] && trackEls[i].getBoundingClientRect().top <= line) id = trackIds[i];
    }
    if (id === 'interests') id = 'journey';
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) id = 'contact';
    return id;
  }
  function holdActive(id) {
    held = true;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(releaseActive, 2400);   // in case the scroll is interrupted
    setActive(id);
  }
  function releaseActive() {
    held = false;
    clearTimeout(holdTimer);
    setActive(currentSection());
  }
  ['wheel', 'touchstart', 'keydown'].forEach(function (t) {
    window.addEventListener(t, function (e) {
      if (!held || (t === 'keydown' && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].indexOf(e.key) < 0)) return;
      // The visitor took over the scroll: follow them again.
      held = false; clearTimeout(holdTimer);
    }, { passive: true });
  });

  var lastY = window.scrollY, scrollRaf = 0;
  function onScroll() {
    scrollRaf = 0;
    var y = window.scrollY;
    nav.classList.toggle('is-compact', y > 40);
    if (tabbar) {
      var dy = y - lastY;
      if (dy > 4 && y > 240) tabbar.classList.add('is-min');
      else if (dy < -4 || y < 240) tabbar.classList.remove('is-min');
    }
    lastY = y;
    if (!held) setActive(currentSection());
  }
  window.addEventListener('scroll', function () { if (!scrollRaf) scrollRaf = requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();

  /* ------------------------------------------ Liquid glass refraction */
  // Chromium can run an SVG filter as a backdrop filter. We draw a
  // displacement map for each bar's exact shape: neutral in the middle,
  // bending the backdrop inward along the rim like a thick glass edge.
  var isChromium = !!(navigator.userAgentData && navigator.userAgentData.brands &&
    navigator.userAgentData.brands.some(function (b) { return /Chromium/.test(b.brand); }));
  function buildRefraction(el, id) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML =
      '<filter id="' + id + '" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB" x="0" y="0">' +
      '<feImage result="map" x="0" y="0" preserveAspectRatio="none"/>' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="soft"/>' +
      '<feDisplacementMap in="soft" in2="map" scale="56" xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter>';
    document.body.appendChild(svg);
    var filter = svg.firstChild, img = filter.firstChild;
    var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');

    function draw() {
      var w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      if (!w || !h) return;
      canvas.width = w; canvas.height = h;
      var data = ctx.createImageData(w, h), px = data.data;
      var r = h / 2, edge = Math.min(22, h * 0.42);
      var cx = w / 2, cy = h / 2, hx = w / 2 - r, hy = h / 2 - r;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var dx = x + 0.5 - cx, dy = y + 0.5 - cy;
          var qx = Math.abs(dx) - hx, qy = Math.abs(dy) - hy;
          var ox = Math.max(qx, 0), oy = Math.max(qy, 0);
          var dist = r - (Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0)); // depth inside the shape
          var nx = 0, ny = 0;
          if (ox > 0 || oy > 0) { var len = Math.hypot(ox, oy) || 1; nx = ox / len * Math.sign(dx); ny = oy / len * Math.sign(dy); }
          else if (qx > qy) nx = Math.sign(dx); else ny = Math.sign(dy);
          var m = dist < edge ? Math.pow(1 - Math.max(0, dist) / edge, 2) : 0;
          var o = (y * w + x) * 4;
          px[o] = 128 - nx * m * 127;
          px[o + 1] = 128 - ny * m * 127;
          px[o + 2] = 128;
          px[o + 3] = 255;
        }
      }
      ctx.putImageData(data, 0, 0);
      img.setAttribute('href', canvas.toDataURL());
      img.setAttribute('width', w); img.setAttribute('height', h);
      filter.setAttribute('width', w); filter.setAttribute('height', h);
    }
    draw();
    if ('ResizeObserver' in window) {
      var t = 0;
      new ResizeObserver(function () { clearTimeout(t); t = setTimeout(draw, 60); }).observe(el);
    }
  }
  if (isChromium && !reduce) {
    try {
      buildRefraction($('.nav__bar'), 'lg-nav');
      if (tabbar) buildRefraction(tabbar, 'lg-tab');
      doc.classList.add('refract');
    } catch (err) {}
  }

  /* ------------------------------------------------- Glass: light + tilt */
  if (finePointer && !reduce) {
    var lit = null, pending = null, rafId = 0;
    var flush = function () {
      rafId = 0;
      if (!pending) return;
      var e = pending; pending = null;
      var el = e.target.closest ? e.target.closest('.glass') : null;
      if (el !== lit) {
        if (lit) lit.classList.remove('is-lit');
        if (lit && lit.classList.contains('card')) { lit.style.setProperty('--rx', '0deg'); lit.style.setProperty('--ry', '0deg'); }
        lit = el;
        if (lit) lit.classList.add('is-lit');
      }
      if (!lit) return;
      var r = lit.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      lit.style.setProperty('--mx', x.toFixed(0) + 'px');
      lit.style.setProperty('--my', y.toFixed(0) + 'px');
      if (lit.classList.contains('card')) {
        var nx = x / r.width - 0.5, ny = y / r.height - 0.5;
        lit.style.setProperty('--ry', (nx * 5).toFixed(2) + 'deg');
        lit.style.setProperty('--rx', (-ny * 5).toFixed(2) + 'deg');
      }
    };
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      pending = e;
      if (!rafId) rafId = requestAnimationFrame(flush);
    }, { passive: true });
    document.addEventListener('pointerleave', function () {
      if (lit) { lit.classList.remove('is-lit'); lit.style.setProperty('--rx', '0deg'); lit.style.setProperty('--ry', '0deg'); lit = null; }
    });
  }

  /* --------------------------------------------------------- Counters */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (reduce) { el.textContent = target.toFixed(dec); return; }
    var start = null, dur = 1800;
    (function step(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / dur);
      var v = target * (1 - Math.pow(1 - p, 4));
      el.textContent = v.toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  /* ----------------------------------------------------------- Reveals */
  $$('[data-stagger]').forEach(function (parent) {
    var base = parent.hasAttribute('data-reveal') ? 160 : 0;
    $$('[data-reveal]', parent).forEach(function (el, i) { el.style.setProperty('--d', (base + i * 90) + 'ms'); });
  });

  function onRevealed(el) {
    $$('[data-count]', el).forEach(countUp);
    var rings = el.classList.contains('rings') ? el : $('.rings', el);
    if (rings) rings.classList.add('is-in');
  }

  if ('IntersectionObserver' in window && !reduce) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        onRevealed(en.target);
        revealIO.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach(function (el) { revealIO.observe(el); });
  } else {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); onRevealed(el); });
  }

  /* -------------------------------------------- Skills: segmented control */
  var tabs = $$('.segmented [role="tab"]');
  var segmented = $('.segmented');
  $$('.panel').forEach(function (p) {
    $$('.pills li', p).forEach(function (li, k) { li.style.setProperty('--k', k); });
  });
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.classList.toggle('is-active', on);
    });
    if (focus) tab.focus();
    if (segmented._lens) segmented._lens.to(tab);
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      selectTab(tabs[j], true);
    });
  });

  /* ------------------------------------------- Dock: magnify under pointer */
  var dock = $('#dock');
  if (dock && finePointer && !reduce) {
    var icons = $$('.dock__icon', dock);
    dock.addEventListener('pointermove', function (e) {
      icons.forEach(function (ic) {
        var r = ic.getBoundingClientRect();
        var d = Math.abs(e.clientX - (r.left + r.width / 2));
        var k = Math.max(0, 1 - d / 170);
        var mag = 1 + 0.32 * (0.5 - 0.5 * Math.cos(Math.PI * k));
        ic.style.setProperty('--mag', mag.toFixed(3));
      });
    });
    dock.addEventListener('pointerleave', function () {
      icons.forEach(function (ic) { ic.style.setProperty('--mag', '1'); });
    });
  }

  /* --------------------------------------------------------------- Lottie */
  function initLottie() {
    if (!window.lottie || !window.LOTTIE_DATA) return;
    $$('.lottie[data-lottie]').forEach(function (el, i) {
      var data = window.LOTTIE_DATA[el.getAttribute('data-lottie')];
      if (!data) return;
      var anim = window.lottie.loadAnimation({
        container: el, renderer: 'svg', loop: false, autoplay: false,
        animationData: JSON.parse(JSON.stringify(data)),
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true },
      });
      el.setAttribute('aria-hidden', 'true');
      el._lottie = anim;
      if (el.getAttribute('data-manual') === 'true') return;
      anim.addEventListener('DOMLoaded', function () {
        if (reduce || !('IntersectionObserver' in window)) { anim.goToAndStop(anim.totalFrames - 1, true); return; }
        anim.goToAndStop(0, true);
        var io = new IntersectionObserver(function (entries) {
          if (!entries[0].isIntersecting) return;
          setTimeout(function () { anim.goToAndPlay(0, true); }, 500 + i * 160);
          io.disconnect();
        }, { threshold: 0.6 });
        io.observe(el);
      });
    });
    $$('.dock__item').forEach(function (item) {
      item.addEventListener('pointerenter', function () {
        var l = $('.lottie', item);
        if (l && l._lottie && !reduce) l._lottie.goToAndPlay(0, true);
      });
    });
  }

  /* ---------------------------------------------------------- Contact form */
  var form = $('#contactForm');
  var formDone = $('#formDone');
  var EMAIL = 'anthonioalexdcosta@gmail.com';
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name, email = form.elements.email, message = form.elements.message;
      var bad = null;
      [name, email, message].forEach(function (f) {
        var ok = f.value.trim() !== '' && (f.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !bad) bad = f;
      });
      if (bad) {
        bad.focus();
        toast(bad === email ? 'Please enter a valid email' : 'Please fill in every field');
        return;
      }
      var subject = 'Portfolio enquiry from ' + name.value.trim();
      var body = message.value.trim() + '\n\n— ' + name.value.trim() + ' (' + email.value.trim() + ')';
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (formDone) {
        formDone.hidden = false;
        var tick = $('.lottie', formDone);
        if (tick && tick._lottie) tick._lottie.goToAndPlay(0, true);
      }
      toast('Opening your email app');
    });
    $$('input, textarea', form).forEach(function (f) {
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') f.setAttribute('aria-invalid', 'false'); });
    });
  }

  var copyBtn = $('#copyEmail');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var value = copyBtn.getAttribute('data-email');
      var done = function () {
        toast('Email copied');
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.textContent = 'Copy email'; }, 2000);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(done, function () { fallbackCopy(value); done(); });
      } else { fallbackCopy(value); done(); }
    });
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(Math.max(2025, new Date().getFullYear()));

  /* -------------------------------------------- Hero parallax (GSAP) */
  function initParallax() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST || reduce) return;
    gsap.registerPlugin(ST);
    if (lenis) lenis.on('scroll', ST.update);
    $$('#heroVisual [data-depth]').forEach(function (el) {
      var depth = parseFloat(el.getAttribute('data-depth'));
      gsap.to(el, {
        y: function () { return depth * window.innerHeight; },
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8, invalidateOnRefresh: true },
      });
    });
    window.addEventListener('load', function () { ST.refresh(); });
  }

  /* ----------------------------------------------- Hero: orbiting widgets */
  // The three widgets ride one tilted ring around the glass disc behind the
  // portrait. sin(angle) is the ring's depth: below zero the widget is on
  // the far side (behind the disc and the head, a little smaller), above
  // zero it swings in front of the body (a little larger). Where it crosses
  // sides it dims briefly, so the change of layer never pops.
  function initOrbit() {
    var visual = $('#heroVisual'), orb = $('.hero__orb'), orbWrap = $('.hero__orb-wrap');
    var wraps = $$('.widget-wrap', visual);
    if (!visual || !orb || !orbWrap || !wraps.length) return;
    var TURN = 36;                       // seconds per revolution
    var TILT = -0.16;                    // radians: the ring leans a little
    var starts = [-1.95, 0.25, 2.35];    // freelance near the head, CGPA right, focus front-left
    var items = wraps.map(function (w, i) {
      return { wrap: w, card: $('.widget', w), a: starts[i % starts.length], half: 0, i: i };
    });
    function measure() { items.forEach(function (it) { it.half = it.card.offsetWidth / 2; }); }
    measure();
    window.addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    var angle = 0, speed = 1, target = 1, last = 0, raf = 0, born = 0, onScreen = true;
    wraps.forEach(function (w) {
      w.addEventListener('pointerenter', function () { target = 0.12; });
      w.addEventListener('pointerleave', function () { target = 1; });
    });
    var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

    function frame(now) {
      raf = 0;
      if (!born) { born = now; last = now; }
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      speed += (target - speed) * Math.min(1, dt * 2.5);
      angle += dt * speed * (Math.PI * 2) / TURN;

      // Centre from layout (wrapper box + its parallax), not from the disc's
      // painted box, so the ring always circles the portrait.
      var vr = visual.getBoundingClientRect(), wr = orbWrap.getBoundingClientRect();
      var cx = wr.left + wr.width / 2 - vr.left;
      var cy = wr.top + wr.height / 2 + orb.offsetWidth * 0.04 - vr.top;
      var vw = document.documentElement.clientWidth;
      var small = vr.width < 520;
      var base = small ? 0.82 : 1;
      var Rx = vr.width * (small ? 0.36 : 0.42);
      var Ry = vr.height * 0.3;
      var absCx = vr.left + cx;
      var ct = Math.cos(TILT), st = Math.sin(TILT);

      items.forEach(function (it) {
        var th = angle + it.a;
        var c = Math.cos(th), sn = Math.sin(th);
        var sc = base * (0.93 + 0.12 * sn);
        var half = it.half * sc;
        // keep each card on screen: narrow its ring if it would leave the viewport
        var rx = Math.max(0, Math.min(Rx, vw - 12 - absCx - half, absCx - 12 - half));
        var px = rx * c, py = Ry * sn;
        var x = cx + px * ct - py * st;
        var y = cy + px * st + py * ct;
        var front = sn > 0;
        var dip = clamp01(Math.abs(sn) / 0.2);
        var appear = ease(clamp01((now - born - 650 - it.i * 180) / 1100));
        it.wrap.style.zIndex = front ? '4' : '0';
        it.wrap.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) translate(-50%,-50%)';
        it.card.style.scale = (sc * (0.72 + 0.28 * appear)).toFixed(4);
        it.card.style.opacity = (appear * (0.35 + 0.65 * dip * dip) * (front ? 1 : 0.92)).toFixed(3);
      });
      if (onScreen && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (onScreen) start(); }).observe(visual);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    start();
  }

  /* ------------------------------------------------------------------ Boot */
  function boot() {
    initLottie();
    initParallax();
    initOrbit();
    if (segmented && segmented._lens) segmented._lens.to($('[aria-selected="true"]', segmented), true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshLenses);
    window.addEventListener('load', refreshLenses);
    requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.add('is-ready'); }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
