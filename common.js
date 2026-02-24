(() => {
  "use strict";

  // ----------------------------
  // Settings
  // ----------------------------
  const HISTORY_BG = "assets/images/history-bg.png";
  const OWNER_KEY  = "vf_owner_mode";

  // For cover jumper (index)
  const JUMPER_IMG = "jumper.png";  // relative to the HTML page
  const ARC  = 110;
  const STEP = 0.012;
  const WAIT = 1500;

  // ----------------------------
  // Helpers
  // ----------------------------
  function runWhenImageReady(img, fn){
    if (!img) return;
    // cached online images often have complete=true already
    if (img.complete && img.naturalWidth > 0) fn();
    else img.addEventListener("load", fn, { once:true });
  }

  // ----------------------------
  // 0) Remove favicon.ico 404 noise
  // ----------------------------
  try {
    if (!document.querySelector('link[rel~="icon"]')) {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = "data:,";
      document.head.appendChild(link);
    }
  } catch {}

  // ----------------------------
  // 1) Inject base CSS once (NO #jumper corner styling!)
  // ----------------------------
  try {
    if (!document.getElementById("vfCommonCSS")) {
      const st = document.createElement("style");
      st.id = "vfCommonCSS";
      st.textContent = `
        /* Owner badge/button */
        #ownerBtn{
          position:fixed; left:14px; bottom:14px; z-index:999999;
          padding:7px 14px; border-radius:999px;
          border:2px solid rgba(255,210,0,.85);
          background:rgba(0,0,0,.55);
          color:#ffd200; font-weight:900;
          cursor:pointer;
          box-shadow:0 10px 24px rgba(0,0,0,.35);
        }
        #ownerBtn:hover{ transform:translateY(-1px); }
        #ownerBtn:active{ transform:translateY(0); }

        /* Owner counter panel (only visible in owner mode) */
        #ownerCounter{
          position:fixed; left:14px; bottom:54px; z-index:999999;
          padding:8px 12px; border-radius:12px;
          background:rgba(0,0,0,.60);
          color:#fff; font-weight:700;
          border:1px solid rgba(255,255,255,.18);
          display:none;
          backdrop-filter: blur(6px);
        }
        body.ownerMode #ownerCounter{ display:block; }

        /* Auto history background layer (only if a page has none) */
        .vf-history-bg{
          position:fixed; inset:0; z-index:-10;
          background-size:cover;
          background-position:center;
          background-repeat:no-repeat;
        }
        .vf-history-veil{
          position:fixed; inset:0; z-index:-9;
          background: radial-gradient(circle at 50% 40%, rgba(0,0,0,.10), rgba(0,0,0,.45));
        }

        /* Coverpage jumper + spots styling (only used if #stage exists) */
        #jumper{
          position:absolute;
          width:90px; height:90px;
          background:url("${JUMPER_IMG}") center/contain no-repeat;
          pointer-events:none;
          z-index:6;
          filter:drop-shadow(0 14px 16px rgba(0,0,0,.4));
        }
        .spot{
          position:absolute;
          border-radius:50%;
          transform:translate(-50%,-50%);
          z-index:3;
          cursor:pointer;
          background:transparent;
          outline:none;
        }
        body.debug .spot{
          background:rgba(0,255,255,.20);
          outline:2px dashed cyan;
        }
        .trail{
          position:absolute;
          width:18px; height:18px;
          border-radius:50%;
          transform:translate(-50%,-50%);
          background:radial-gradient(circle,#fff8a8,#ffd200 45%,rgba(255,210,0,0) 70%);
          pointer-events:none;
          z-index:5;
          animation:fade .7s linear forwards;
        }
        @keyframes fade{
          to{opacity:0; transform:translate(-50%,-50%) scale(2.2);}
        }
      `;
      document.head.appendChild(st);
    }
  } catch {}

  // ----------------------------
  // 2) Owner mode toggle
  // ----------------------------
  function setOwnerMode(on) {
    try { localStorage.setItem(OWNER_KEY, on ? "1" : "0"); } catch {}
    document.body.classList.toggle("ownerMode", !!on);
  }
  function getOwnerMode() {
    try { return localStorage.getItem(OWNER_KEY) === "1"; } catch { return false; }
  }
  function initOwner() {
    const btn = document.getElementById("ownerBtn");
    if (!btn) return;
    setOwnerMode(getOwnerMode());
    btn.addEventListener("click", () => {
      setOwnerMode(!document.body.classList.contains("ownerMode"));
    });
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "O" || e.key === "o")) {
        setOwnerMode(!document.body.classList.contains("ownerMode"));
      }
    });
  }

  // ----------------------------
  // 3) Simple local visitor counter (per browser)
  // ----------------------------
  function initLocalVisitorCounter() {
    const box = document.getElementById("ownerCounter");
    if (!box) return;
    const key = "vf_visits_total";
    let n = 0;
    try {
      n = parseInt(localStorage.getItem(key) || "0", 10);
      n = Number.isFinite(n) ? n : 0;
      n += 1;
      localStorage.setItem(key, String(n));
    } catch {}
    box.textContent = `Visitors (this browser): ${n}`;
  }

  // ----------------------------
  // 4) Coverpage jumper (BALL → BALL) in common.js (ONLINE SAFE)
  // Runs ONLY if #stage and #cover exist (your index page)
  // ----------------------------
  function initCoverJumper() {
    const stage = document.getElementById("stage");
    const img   = document.getElementById("cover");
    if (!stage || !img) return; // not index

    // Debug toggle: index.html?debug=1
    const params = new URLSearchParams(location.search);
    if (params.get("debug") === "1") document.body.classList.add("debug");

    // ensure jumper exists
    let jumper = document.getElementById("jumper");
    if (!jumper) {
      jumper = document.createElement("div");
      jumper.id = "jumper";
      stage.appendChild(jumper);
    }

    // EXACT balls from your old index (with labels + href)
    const balls = [
      {label:"Volleyball history",        x:19,y:25,r:150,href:"history.html"},
      {label:"Volleyball today",          x:13,y:43,r:150,href:"international_volleyball_today.html"},
      {label:"Health & Volleyball",       x:18,y:59,r:165,href:"health_volleyball.html"},
      {label:"Who can play volleyball?",  x:78,y:28,r:155,href:"who.html"},
      {label:"Championships & Stars",     x:63,y:43,r:170,href:"volleyball_business.html"},
      {label:"Beach Volleyball",          x:87,y:45,r:170,href:"beach.html"},
      {label:"How to improve",            x:71,y:60,r:170,href:"improve.html"},
      {label:"Basics to Perfection",      x:86,y:60,r:170,href:"from_basics_to_perfection.html"},
      {label:"Important note",            x:61,y:72,r:145,href:"important_note.html"},
      {label:"Check your progress",       x:74,y:83,r:175,href:"progress.html"},
      {label:"Bibliography and contact",  x:16,y:84,r:210,href:"bibliography_contact.html"}
    ]; // :contentReference[oaicite:2]{index=2}

    function imageRect(){
      const sw = stage.clientWidth, sh = stage.clientHeight;
      const iw = img.naturalWidth || 1, ih = img.naturalHeight || 1;
      const sr = sw/sh, ir = iw/ih;
      let w,h,x,y;
      // match your index: object-fit:contain
      if(ir > sr){ w = sw; h = sw/ir; x = 0; y = (sh - h)/2; }
      else       { h = sh; w = sh*ir; y = 0; x = (sw - w)/2; }
      return {x,y,w,h};
    }

    function responsivePx(px){
      const minDim = Math.min(stage.clientWidth, stage.clientHeight);
      const scale = Math.max(0.78, Math.min(1.18, minDim / 900));
      return Math.round(px * scale);
    }

    function buildSpots(){
      stage.querySelectorAll(".spot").forEach(e=>e.remove());
      const r = imageRect();
      balls.forEach(b=>{
        const a = document.createElement("a");
        a.className = "spot";
        a.href = b.href;
        if (b.label) {
          a.setAttribute("aria-label", b.label);
          if (document.body.classList.contains("debug")) a.title = b.label;
        }
        const cx = r.x + (b.x/100)*r.w;
        const cy = r.y + (b.y/100)*r.h;
        a.style.left = cx + "px";
        a.style.top  = cy + "px";
        const d = responsivePx(b.r);
        a.style.width  = d + "px";
        a.style.height = d + "px";
        stage.appendChild(a);
      });
    }

    let idx = 0;
    let pos = {x:0,y:0};

    function trail(x,y){
      const t = document.createElement("div");
      t.className = "trail";
      t.style.left = x + "px";
      t.style.top  = y + "px";
      stage.appendChild(t);
      setTimeout(()=>t.remove(), 700);
    }

    function hop(){
      const r = imageRect();
      const b = balls[idx];
      const tx = r.x + (b.x/100)*r.w;
      const ty = r.y + (b.y/100)*r.h;

      let t = 0;
      const sx = pos.x, sy = pos.y;

      function anim(){
        t += STEP;
        if (t >= 1){
          pos = {x:tx, y:ty};
          idx = (idx + 1) % balls.length;
          setTimeout(hop, WAIT);
          return;
        }
        const x = sx + (tx - sx)*t;
        const y = sy + (ty - sy)*t - Math.sin(t*Math.PI)*ARC;

        jumper.style.transform = `translate(${x - 45}px, ${y - 45}px)`;
        trail(x,y);
        requestAnimationFrame(anim);
      }
      anim();
    }

    // ✅ ONLINE SAFE START (works even if image was cached already)
    runWhenImageReady(img, () => {
      buildSpots();
      const r = imageRect();
      pos.x = r.x + (balls[0].x/100)*r.w;
      pos.y = r.y + (balls[0].y/100)*r.h;
      jumper.style.transform = `translate(${pos.x - 45}px, ${pos.y - 45}px)`;
      setTimeout(hop, 900);
    });

    window.addEventListener("resize", buildSpots);
  }

  // ----------------------------
  // 5) Auto-apply history background if missing
  // (skip index because it has #cover image)
  // ----------------------------
  function pageAlreadyHasBg() {
    if (document.getElementById("cover")) return true; // index coverpage
    if (document.querySelector(".bg")) return true;
    const bgImg = getComputedStyle(document.body).backgroundImage;
    return bgImg && bgImg !== "none";
  }
  function applyHistoryBgIfNeeded() {
    if (pageAlreadyHasBg()) return;
    const bg = document.createElement("div");
    bg.className = "vf-history-bg";
    bg.style.backgroundImage = `url("${HISTORY_BG}")`;
    const veil = document.createElement("div");
    veil.className = "vf-history-veil";
    document.body.prepend(veil);
    document.body.prepend(bg);
  }

  // ----------------------------
  // 6) YouTube decorator (kept)
  // ----------------------------
  function isYouTubeIframe(el) {
    if (!el || el.tagName !== "IFRAME") return false;
    const src = (el.getAttribute("src") || "").toLowerCase();
    return src.includes("youtube.com") || src.includes("youtube-nocookie.com") || src.includes("youtu.be");
  }
  function extractVideoId(src) {
    try {
      const u = new URL(src, location.href);
      if (u.pathname.includes("/embed/")) return u.pathname.split("/embed/")[1].split("/")[0] || "";
      const v = u.searchParams.get("v");
      if (v) return v;
      if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "") || "";
    } catch {}
    return "";
  }
  function toWatchUrl(src) {
    const id = extractVideoId(src);
    return id ? `https://www.youtube.com/watch?v=${id}` : src;
  }
  function ensureWrapped(iframe) {
    if (iframe.closest(".ytFrameWrap")) return iframe.closest(".ytFrameWrap");
    const wrap = document.createElement("div");
    wrap.className = "ytFrameWrap";
    const glow = document.createElement("div");
    glow.className = "ytGlow";
    const inner = document.createElement("div");
    inner.className = "ytInner";
    const parent = iframe.parentNode;
    parent.insertBefore(wrap, iframe);
    parent.removeChild(iframe);
    inner.appendChild(iframe);
    wrap.appendChild(glow);
    wrap.appendChild(inner);
    glow.style.background = "radial-gradient(circle at 50% 40%, rgba(255,230,0,.25), rgba(0,0,0,0) 60%)";
    return wrap;
  }
  function ensureOpenButton(wrap, iframe) {
    if (wrap.querySelector(".ytOpenBtn")) return;
    const a = document.createElement("a");
    a.className = "ytOpenBtn";
    a.href = toWatchUrl(iframe.getAttribute("src") || "");
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "▶ Open on YouTube";
    wrap.appendChild(a);
  }
  function decorateYT(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("iframe").forEach((ifr) => {
      if (!isYouTubeIframe(ifr)) return;
      const wrap = ensureWrapped(ifr);
      ensureOpenButton(wrap, ifr);
    });
  }

  // YouTube CSS
  try {
    if (!document.getElementById("commonYTcss")) {
      const st = document.createElement("style");
      st.id = "commonYTcss";
      st.textContent = `
        .ytFrameWrap{position:relative;border-radius:18px;overflow:hidden;background:rgba(0,0,0,.35);
          border:1px solid rgba(255,255,255,.18);box-shadow:0 18px 40px rgba(0,0,0,.45);}
        .ytFrameWrap::after{content:"";position:absolute;inset:0;pointer-events:none;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.10);}
        .ytFrameWrap iframe{display:block;width:100%;height:100%;border:0;}
        .ytGlow{position:absolute;inset:-30px;z-index:0;pointer-events:none;filter:blur(16px);
          opacity:.25;transform:scale(1.05);}
        .ytInner{position:relative;z-index:1;}
        .ytOpenBtn{position:absolute;left:12px;bottom:12px;z-index:5;display:inline-flex;align-items:center;
          gap:8px;padding:8px 12px;border-radius:999px;background:rgba(0,0,0,.65);color:#ffe600;font-weight:900;
          font-size:12px;text-decoration:none;border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(6px);}
        .ytOpenBtn:hover{transform:translateY(-1px);} .ytOpenBtn:active{transform:translateY(0);}
      `;
      document.head.appendChild(st);
    }
  } catch {}

  // ----------------------------
  // Boot
  // ----------------------------
  function boot() {
    applyHistoryBgIfNeeded();
    initOwner();
    initLocalVisitorCounter();
    initCoverJumper(); // ✅ ball-to-ball jumper, online safe, index only
    decorateYT(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.tagName === "IFRAME") decorateYT(node.parentElement || document);
          else decorateYT(node);
        }
      }
    });
    try { mo.observe(document.documentElement, { childList: true, subtree: true }); } catch {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();