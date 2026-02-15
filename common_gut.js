(function(){

  // ====== DEBUG (optional) ======
  // Wenn du testen willst, ob common.js wirklich ausgeführt wird:
  // alert("common.js läuft ✅");

  // ====== TEIL 2: Ping an Flask (zeigt im Terminal: common.js EXECUTED) ======
  // Voraussetzung: visitor_counter.py hat Route /__common_ping
  try{
    fetch("/__common_ping?ts=" + Date.now(), { cache: "no-store" });
  }catch(e){}

  // ===== Inject CSS once =====
  try{
    if(!document.getElementById("ytAutoCss")){
      const st = document.createElement("style");
      st.id = "ytAutoCss";
      st.textContent = `
        .ytFallback{
          position:absolute;
          left:12px;
          bottom:12px;
          z-index:999999;
          padding:8px 10px;
          border-radius:999px;
          background:rgba(0,0,0,.65);
          border:1px solid rgba(255,255,255,.2);
          color:#ffe600;
          font-weight:900;
          text-decoration:none;
          font-size:12px;
        }
        .ytClickCover{
          position:absolute;
          inset:0;
          cursor:pointer;
          z-index:999998;
          background:transparent;
        }
        .ytClickCover::after{
          content:"▶ Play on YouTube";
          position:absolute;
          left:50%;
          top:50%;
          transform:translate(-50%,-50%);
          background:rgba(0,0,0,.65);
          color:#ffe600;
          padding:10px 16px;
          border-radius:999px;
          font-weight:900;
          font-size:14px;
          pointer-events:none;
          border:1px solid rgba(255,255,255,.18);
          box-shadow:0 18px 40px rgba(0,0,0,.45);
          backdrop-filter:blur(6px);
        }
      `;
      document.head.appendChild(st);
    }
  }catch(e){}

  function isYouTubeUrl(u){
    return /(^|\/\/)(www\.)?(youtube\.com|youtube-nocookie\.com)\//i.test(u)
        || /youtu\.be\//i.test(u);
  }

  function toNoCookie(url){
    try{
      if(/youtu\.be\//i.test(url)){
        const id = url.split("youtu.be/")[1].split(/[?&#]/)[0];
        url = "https://www.youtube-nocookie.com/embed/" + id;
      }
      return url
        .replace("www.youtube.com","www.youtube-nocookie.com")
        .replace("youtube.com","youtube-nocookie.com");
    }catch(e){
      return url;
    }
  }

  function ensureParams(src){
    try{
      const u = new URL(src, location.origin);
      if(!u.searchParams.has("playsinline")) u.searchParams.set("playsinline","1");
      if(!u.searchParams.has("rel")) u.searchParams.set("rel","0");
      if(!u.searchParams.has("modestbranding")) u.searchParams.set("modestbranding","1");
      if(!u.searchParams.has("origin")) u.searchParams.set("origin", location.origin);
      return u.toString();
    }catch(e){
      return src;
    }
  }

  function extractId(src){
    let m = src.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
    if(m) return m[1];
    m = src.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    return m ? m[1] : "";
  }

  function ensureParentPosition(el){
    const p = el.parentElement;
    if(!p) return null;
    try{
      if(getComputedStyle(p).position === "static"){
        p.style.position = "relative";
      }
    }catch(e){}
    return p;
  }

  function addFallback(iframe, id){
    if(!id) return;
    const p = ensureParentPosition(iframe);
    if(!p) return;
    if(p.querySelector(".ytFallback")) return;

    const a = document.createElement("a");
    a.className = "ytFallback";
    a.href = "https://www.youtube.com/watch?v=" + id;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "Open on YouTube";
    p.appendChild(a);
  }

  function addClickRedirect(iframe, id){
    if(!id) return;
    const p = ensureParentPosition(iframe);
    if(!p) return;
    if(p.querySelector(".ytClickCover")) return;

    const cover = document.createElement("div");
    cover.className = "ytClickCover";
    cover.title = "Play on YouTube";
    cover.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      window.open("https://www.youtube.com/watch?v=" + id, "_blank");
    }, true);

    p.appendChild(cover);
  }

  function fixOnce(){
    let found = 0;

    document.querySelectorAll("iframe").forEach(f=>{
      const src = f.getAttribute("src") || "";
      if(!src) return;
      if(!isYouTubeUrl(src)) return;
      if(f.dataset.ytfixed === "1") return;

      found++;

      const ns = ensureParams(toNoCookie(src));
      if(ns !== src) f.setAttribute("src", ns);

      f.setAttribute("loading","lazy");
      f.setAttribute("referrerpolicy","origin-when-cross-origin");
      if(!f.getAttribute("allow")){
        f.setAttribute("allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      }
      f.setAttribute("allowfullscreen","");

      const id = extractId(ns);
      addClickRedirect(f, id);
      addFallback(f, id);

      f.dataset.ytfixed = "1";
    });

    return found;
  }

  function run(){
    try{
      const found = fixOnce();
      if(found === 0){
        setTimeout(()=>{ try{ fixOnce(); }catch(e){} }, 1200);
      }
    }catch(e){}
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", run);
  }else{
    run();
  }
  // =========================================================
  // === VIDEO FRAME (Option A): Blur-Frame + Soft-Border  ====
  // === Paste this block near the END of common.js,         ===
  // === right BEFORE the final "})();"                      ===
  // =========================================================

  // 1) Inject CSS once
  try{
    if(!document.getElementById("vfOptionAStyle")){
      const st = document.createElement("style");
      st.id = "vfOptionAStyle";
      st.textContent = `
        /* Wrapper look */
        .vfWrap{
          position:relative !important;
          border-radius:22px;
          overflow:hidden;
          background:rgba(0,0,0,.55);
          box-shadow:
            0 0 0 2px rgba(255,230,0,.28),
            0 30px 80px rgba(0,0,0,.65);
        }

        /* Soft blur halo outside */
        .vfWrap::before{
          content:"";
          position:absolute;
          inset:-26px;
          z-index:0;
          background:
            radial-gradient(circle at 35% 25%, rgba(255,230,0,.22), rgba(0,0,0,0) 52%),
            radial-gradient(circle at 70% 70%, rgba(255,90,200,.18), rgba(0,0,0,0) 55%),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,.06), rgba(0,0,0,0) 60%),
            rgba(0,0,0,.55);
          filter: blur(22px);
          opacity:.75;
          pointer-events:none;
        }

        /* Keep real content above halo */
        .vfWrap > iframe{
          position:relative;
          z-index:1;
          width:100%;
          height:100%;
          border:0;
          display:block;
          background:#000;
        }

        /* Make your existing overlay + fallback always on top */
        .vfWrap .ytClickCover{ z-index: 3 !important; }
        .vfWrap .ytFallback{ z-index: 4 !important; }

        /* Optional: tiny inner vignette for “cinematic” look */
        .vfWrap::after{
          content:"";
          position:absolute;
          inset:0;
          z-index:2;
          pointer-events:none;
          background: radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 35%, rgba(0,0,0,.35) 100%);
          mix-blend-mode: multiply;
        }
      `;
      document.head.appendChild(st);
    }
  }catch(e){}

  // 2) Decorate all already-fixed YouTube iframes (no changes to your main logic needed)
  function decorateVideoFrames(){
    try{
      const iframes = document.querySelectorAll('iframe[data-ytfixed="1"], iframe[src*="youtube"], iframe[src*="youtu.be"], iframe[src*="youtube-nocookie"]');
      iframes.forEach((ifr)=>{
        const p = ifr.parentElement;
        if(!p) return;

        // If your code already set relative, fine; otherwise make safe
        try{
          if(getComputedStyle(p).position === "static") p.style.position = "relative";
        }catch(e){}

        // Add the wrapper class once
        if(!p.classList.contains("vfWrap")) p.classList.add("vfWrap");
      });
    }catch(e){}
  }

  // Run after your existing fix logic, and once again to catch late-loaded iframes
  try{
    setTimeout(decorateVideoFrames, 80);
    setTimeout(decorateVideoFrames, 1600);
  }catch(e){}

})();
