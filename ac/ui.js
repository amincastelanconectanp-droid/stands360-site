/* Capa de diseño base (sonidos sutiles, toque, foco y accesibilidad). Se carga en todos los productos. */
(() => {
  if (window.__acui) return; window.__acui = true;
  const KEY = "ac-snd";
  const css = `
  :where(button,[role=button],a.btn,.btn,input[type=submit],summary){transition:transform .08s ease,filter .15s ease}
  :where(button,[role=button],a.btn,.btn,input[type=submit]):active:not(:disabled){transform:scale(.96);filter:brightness(.93)}
  :where(a,button,input,select,textarea,summary,[tabindex]):focus-visible{outline:2px solid #2B5FD9;outline-offset:2px}
  @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
  .acui-snd{position:fixed;left:max(12px,env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483000;width:36px;height:36px;border-radius:12px;border:1px solid rgba(128,128,128,.28);background:rgba(20,22,28,.55);color:#fff;display:grid;place-items:center;cursor:pointer;opacity:.55;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:0}
  .acui-snd:hover,.acui-snd:focus-visible{opacity:1}
  @media (prefers-reduced-transparency:reduce){.acui-snd{backdrop-filter:none;background:#14161c}}
  @media print{.acui-snd{display:none}}`;
  const st = document.createElement("style"); st.id = "acui-css"; st.textContent = css; (document.head || document.documentElement).appendChild(st);

  let on = true, ctx = null;
  try { on = localStorage.getItem(KEY) !== "0"; } catch (e) {}
  function tone(f, d, v, t0 = 0, f2){
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime + t0, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + 0.03);
  }
  const SFX = {
    tap(){ tone(2100, 0.028, 0.03, 0, 1500); },
    tab(){ tone(1400, 0.04, 0.028, 0, 1100); },
    open(){ tone(620, 0.08, 0.03, 0, 820); },
    close(){ tone(820, 0.07, 0.025, 0, 600); },
    ok(){ tone(988, 0.1, 0.035); tone(1319, 0.16, 0.03, 0.075); }
  };
  const play = n => { if (!on || document.documentElement.dataset.acSnd === "off") return; try { SFX[n](); } catch (e) {} };
  window.acSound = play;

  document.addEventListener("pointerdown", e => {
    const t = e.target.closest && e.target.closest("button,a,[role=button],[role=tab],summary,label,input[type=checkbox],input[type=radio],select,.btn,[data-int],[data-prop],tbody tr");
    if (!t || t.classList.contains("acui-snd")) return;
    if (t.closest("nav,[role=tablist],.tabs,.bnav,.navl")) play("tab");
    else if (t.matches("[data-close],[data-closem],.x,[aria-label*=errar i],[aria-label*=lose i]")) play("close");
    else play("tap");
  }, true);
  document.addEventListener("toggle", e => { if (e.target.tagName === "DETAILS") play(e.target.open ? "open" : "close"); }, true);
  try {
    const cb = navigator.clipboard && navigator.clipboard.writeText && navigator.clipboard.writeText.bind(navigator.clipboard);
    if (cb) navigator.clipboard.writeText = t => cb(t).then(r => { play("ok"); return r; });
  } catch (e) {}

  const ON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>';
  const OFF = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>';
  function mountBtn(){
    if (document.getElementById("sndBtn") || document.querySelector(".acui-snd") || document.documentElement.dataset.acSnd === "nobtn") return;
    const b = document.createElement("button"); b.type = "button"; b.className = "acui-snd";
    const draw = () => { b.innerHTML = on ? ON : OFF; b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-label", on ? "Sonidos activados" : "Sonidos desactivados"); b.title = on ? "Sonidos activados" : "Sonidos desactivados"; };
    b.addEventListener("click", () => { on = !on; try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {} draw(); if (on) play("ok"); });
    draw(); document.body.appendChild(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountBtn); else mountBtn();
})();
