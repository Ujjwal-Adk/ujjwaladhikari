(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var small = matchMedia("(max-width: 860px)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Year ---------- */
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Projects (data lives in content.js) ---------- */
  (function renderProjects() {
    var grid = $("#projectGrid");
    var list = window.PROJECTS || [];
    var esc = function (s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; };

    if (!list.length) {
      grid.innerHTML =
        '<div class="empty reveal">' +
        '<p class="label"><span>&lt;coming-soon/&gt;</span></p>' +
        "<h3>New projects are on the way.</h3>" +
        "<p>I'm learning by building, and I'll add my projects here as soon as they're ready to share. In the meantime you can follow my code on GitHub.</p>" +
        '<a class="btn btn-ghost magnetic" href="' + esc(window.GITHUB_URL) + '" target="_blank" rel="noopener"><span>Visit my GitHub</span></a>' +
        "</div>";
      return;
    }

    grid.innerHTML = list.map(function (p) {
      return '<article class="project tilt reveal">' +
        (p.image ? '<div class="shot"><img src="' + esc(p.image) + '" alt="Screenshot of ' + esc(p.title) + '" loading="lazy" /></div>' : "") +
        '<div class="body"><h3>' + esc(p.title) + "</h3><p>" + esc(p.description || "") + "</p>" +
        (p.tech && p.tech.length ? '<ul class="tags">' + p.tech.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
        '<div class="plinks">' +
        (p.live ? '<a href="' + esc(p.live) + '" target="_blank" rel="noopener">Live site</a>' : "") +
        (p.repo ? '<a href="' + esc(p.repo) + '" target="_blank" rel="noopener">Code</a>' : "") +
        "</div></div></article>";
    }).join("");
  })();

  /* ---------- Upwork link (set UPWORK_URL in content.js) ---------- */
  if (window.UPWORK_URL) {
    $$("[data-upwork]").forEach(function (el) {
      el.hidden = false;
      var a = el.tagName === "A" ? el : $("a", el);
      a.href = window.UPWORK_URL; a.target = "_blank"; a.rel = "noopener";
    });
  }

  /* ---------- Theme toggle ---------- */
  $("#theme").addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!reduce && typeof Lenis === "function") {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }
  var menu = $("#menu"), burger = $("#burger");
  function closeMenu() {
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      var target = id.length > 1 ? $(id) : null;
      if (id === "#top") target = document.body;
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(id === "#top" ? 0 : target, { offset: -40 });
      else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
  });
  burger.addEventListener("click", function () {
    var open = !menu.classList.contains("open");
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ---------- Hero: split text ---------- */
  var idx = 0;
  $$(".hero h1 .line").forEach(function (line, li) {
    var text = line.textContent;
    line.textContent = "";
    line.setAttribute("aria-hidden", "true");
    text.split("").forEach(function (ch) {
      var s = document.createElement("span");
      s.className = "ch";
      s.textContent = ch;
      s.style.setProperty("--i", idx++);
      line.appendChild(s);
    });
  });

  /* ---------- Hero: logo intro ---------- */
  var stage = $("#logoStage");
  var svg = $("svg", stage);
  if (svg) {
    ["light-person", "palm-growth", "bird-freedom", "code-webdev"].forEach(function (id) {
      var g = svg.getElementById ? svg.getElementById(id) : $("#" + id, svg);
      if (g) g.classList.add("part");
    });
    $$("#outline path", svg).forEach(function (p) {
      p.style.setProperty("--len", Math.ceil(p.getTotalLength()) + 2);
    });
  }
  function start() {
    root.classList.add("ready");
    stage.classList.add("play");
  }
  var started = false;
  function go() { if (!started) { started = true; requestAnimationFrame(function () { requestAnimationFrame(start); }); } }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); setTimeout(go, 800); } else { go(); }

  /* ---------- Scroll reveal ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach(function (el) {
    var sibs = $$(".reveal", el.parentElement).filter(function (s) { return s.parentElement === el.parentElement; });
    el.style.setProperty("--rd", Math.min(sibs.indexOf(el), 5) * 90 + "ms");
    io.observe(el);
  });

  /* ---------- Scroll: progress bar, nav, active link, timeline ---------- */
  var bar = $(".progress i"), nav = $("#nav"), tls = $$(".timeline");
  var links = $$("#menu a").filter(function (a) { return a.getAttribute("href").length > 1 && !a.classList.contains("nav-cta"); });
  var sections = links.map(function (a) { return $(a.getAttribute("href")); });
  var ticking = false;
  function onScroll() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    nav.classList.toggle("stuck", y > 20);
    var cur = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle("active", i === cur); });
    tls.forEach(function (tl) {
      var r = tl.getBoundingClientRect();
      var p = (innerHeight * 0.7 - r.top) / r.height;
      tl.style.setProperty("--tl", Math.max(0, Math.min(1, p)));
    });
    ticking = false;
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Hero light follows the pointer ---------- */
  var hero = $(".hero");
  if (fine && !reduce) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      $(".sunrise", hero).style.setProperty("--mx", nx * 60 + "px");
      $(".sunrise", hero).style.setProperty("--my", ny * 40 + "px");
      svg.style.transform = "translate(" + nx * -14 + "px," + ny * -14 + "px) rotate(" + nx * 3 + "deg)";
    });
    hero.addEventListener("pointerleave", function () { svg.style.transform = ""; });
  }

  /* ---------- Cursor, magnetic buttons, tilt ---------- */
  if (fine && !reduce) {
    var cur = $(".cursor"), dot = $(".cursor-dot");
    var tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate(" + tx + "px," + ty + "px)";
      document.body.classList.add("has-cursor");
    });
    document.addEventListener("pointerleave", function () { document.body.classList.remove("has-cursor"); });
    (function loop() {
      cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
      cur.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(loop);
    })();
    $$("a, button, input, textarea, .tilt").forEach(function (el) {
      el.addEventListener("pointerenter", function () { cur.classList.add("big"); });
      el.addEventListener("pointerleave", function () { cur.classList.remove("big"); });
    });

    $$(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + dx * 0.25 + "px," + dy * 0.35 + "px)";
        $("span", el).style.transform = "translate(" + dx * 0.08 + "px," + dy * 0.12 + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
        $("span", el).style.transform = "";
      });
    });

    $$(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--px", x * 100 + "%");
        el.style.setProperty("--py", y * 100 + "%");
        el.style.transform = "perspective(900px) rotateX(" + (0.5 - y) * 7 + "deg) rotateY(" + (x - 0.5) * 9 + "deg) translateY(-4px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Floating light motes ---------- */
  var canvas = $("#motes");
  if (canvas && !reduce) {
    var ctx = canvas.getContext("2d"), W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
    var motes = [], visible = true;
    var count = small ? 22 : 46;
    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function make(initial) {
      return { x: Math.random() * W, y: initial ? Math.random() * H : H + 10, r: Math.random() * 2.2 + 0.6, v: Math.random() * 0.35 + 0.12, s: Math.random() * Math.PI * 2, a: Math.random() * 0.5 + 0.25 };
    }
    size();
    for (var i = 0; i < count; i++) motes.push(make(true));
    addEventListener("resize", size);
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(hero);
    (function draw(t) {
      requestAnimationFrame(draw);
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.y -= m.v;
        m.x += Math.sin(t / 1800 + m.s) * 0.25;
        if (m.y < -10) motes[i] = make(false);
        var fade = Math.min(1, m.y / (H * 0.35), (H - m.y) / 60 + 0.2);
        var g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 5);
        g.addColorStop(0, "rgba(242,199,102," + m.a * Math.max(0, fade) + ")");
        g.addColorStop(1, "rgba(229,165,35,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 5, 0, 6.283); ctx.fill();
      }
    })(0);
  }

  /* ---------- Contact form: opens the visitor's email app ---------- */
  var form = $("#form"), note = $("#formNote");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements, ok = true;
    ["name", "email", "message"].forEach(function (n) {
      var bad = !f[n].value.trim() || (n === "email" && !/^\S+@\S+\.\S+$/.test(f[n].value));
      f[n].setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad) ok = false;
    });
    note.className = "form-note";
    if (!ok) { note.textContent = "Please fill in your name, a valid email and a message."; note.classList.add("err"); return; }
    var subject = f.subject.value.trim() || "Hello from your portfolio";
    var body = f.message.value.trim() + "\n\n" + f.name.value.trim() + "\n" + f.email.value.trim();
    location.href = "mailto:ujjwal.official010@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    note.textContent = "Thanks, " + f.name.value.trim() + "! Your email app should open with the message ready to send.";
    note.classList.add("ok");
  });
})();
