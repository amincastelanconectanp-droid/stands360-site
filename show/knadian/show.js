// STANDS 360 · Show de luz y video mapping · motor compartido (panel de control + reproductor del proyector)
window.S360SHOW = (function () {
  const CFG = { url: 'https://mcxqcipylkiulakyiguh.supabase.co', key: 'sb_publishable_1TIdgBhFGR4zlEJJOySNnw_-Ggm5SjH', stand: 'knadian' };
  const COLORS = { calido: [255, 176, 92], maple: [226, 38, 44], azul: [70, 120, 255], blanco: [255, 244, 228] };
  const SCENES = [
    { id: 'ambiente', name: 'Ambiente', desc: 'Luz cálida que respira suave. Para todo el día.', loop: true },
    { id: 'bienvenida', name: 'Bienvenida', desc: 'Líneas de luz suben por la escalera y se dibuja el balcón.', loop: true },
    { id: 'ola', name: 'Lluvia de hojas', desc: 'Hojas de maple bajan por la escalera hasta el piso.', loop: true },
    { id: 'logo', name: 'Logo Knadian', desc: 'El logo aparece en el muro y la luz recorre el balcón.', loop: true },
    { id: 'ganador', name: '¡Ganador Arcade!', desc: 'Destellos y confeti de luz para celebrar a quien gana.', loop: false, dur: 12 },
    { id: 'show', name: 'Show completo (60 s)', desc: 'Bienvenida, lluvia de hojas, logo y final.', loop: false, dur: 60 },
    { id: 'apagado', name: 'Apagar', desc: 'Proyector en negro y LED en luz base.', loop: true }
  ];
  const TOKEN = new URLSearchParams(location.search).get('k') || '';
  const chName = () => 's360-show-' + CFG.stand + '-' + TOKEN;

  // ------------- dibujo de escenas -------------
  // ctx: 2D, w,h del lienzo, t segundos desde inicio de escena, st = {color, bri, speed}, zone: 'muro'|'escalera'|'balcon'|'preview'
  const leaves = [];
  for (let i = 0; i < 42; i++) leaves.push({ x: Math.random(), y: Math.random(), s: .5 + Math.random(), r: Math.random() * 6.28, v: .5 + Math.random() });
  function leaf(c, x, y, s, rot, col, a) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.globalAlpha = a; c.fillStyle = col; c.beginPath();
    const P = [[0, -1], [.18, -.55], [.5, -.72], [.38, -.3], [.86, -.36], [.62, -.06], [.72, .1], [.25, .12], [.3, .42], [.05, .3], [0, .72], [-.05, .3], [-.3, .42], [-.25, .12], [-.72, .1], [-.62, -.06], [-.86, -.36], [-.38, -.3], [-.5, -.72], [-.18, -.55]];
    P.forEach((p, i) => i ? c.lineTo(p[0] * 40, p[1] * 40) : c.moveTo(p[0] * 40, p[1] * 40)); c.closePath(); c.fill(); c.restore();
  }
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  function sceneAt(id, t) { // el show completo encadena escenas
    if (id !== 'show') return [id, t];
    const seq = [['bienvenida', 14], ['ola', 16], ['logo', 18], ['ganador', 12]];
    let acc = 0; for (const [s, d] of seq) { if (t < acc + d) return [s, t - acc]; acc += d; } return ['ambiente', t - acc];
  }
  function draw(c, w, h, id, t0, st, zone) {
    const [sid, tt] = sceneAt(id, t0); const t = tt * (st.speed || 1);
    const col = COLORS[st.color] || COLORS.calido, bri = (st.bri == null ? 1 : st.bri);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    if (sid === 'apagado') return;
    c.globalAlpha = bri;
    if (sid === 'ambiente') {
      const a = .25 + .2 * Math.sin(t * 1.2); const g = c.createRadialGradient(w / 2, h * .6, 10, w / 2, h * .6, Math.max(w, h) * .7);
      g.addColorStop(0, rgba(col, a)); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    if (sid === 'bienvenida') {
      const n = 9; c.lineWidth = Math.max(3, h * .012); c.strokeStyle = rgba(col, .95); c.shadowColor = rgba(col, 1); c.shadowBlur = 25;
      for (let i = 0; i < n; i++) { const p = Math.min(1, Math.max(0, t * .5 - i * .12)); if (!p) continue; const y = h * (1 - (i + .5) / n); c.beginPath(); c.moveTo(0, y); c.lineTo(w * p, y); c.stroke(); }
      c.strokeRect(w * .03, h * .03, w * .94 * Math.min(1, Math.max(0, t * .25 - .6)), h * .94); c.shadowBlur = 0;
    }
    if (sid === 'ola') {
      leaves.forEach((L, i) => { const y = ((L.y + t * .12 * L.v) % 1.15) - .1; const x = L.x + Math.sin(t * L.v + i) * .03;
        leaf(c, x * w, y * h, L.s * h / 430, L.r + t * L.v, i % 4 ? rgba(col, 1) : rgba(COLORS.maple, 1), .9); });
    }
    if (sid === 'logo') {
      const p = Math.min(1, t / 3); const x = (t * .35 % 1.4 - .2) * w; const g = c.createLinearGradient(x - w * .12, 0, x + w * .12, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, rgba(col, .8)); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      if (zone !== 'escalera') { c.globalAlpha = bri * p; c.fillStyle = '#f4ede0'; c.font = `800 ${Math.round(h * .22)}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle';
        const fs = Math.round(h * .22); c.textAlign = 'left'; const wK = c.measureText('K').width, wN = c.measureText('NADIAN').width, gap = fs * .62, x0 = w / 2 - (wK + gap + wN) / 2;
        c.fillText('K', x0, h * .45); c.fillText('NADIAN', x0 + wK + gap, h * .45); leaf(c, x0 + wK + gap / 2, h * .41, fs / 105, 0, rgba(COLORS.maple, 1), bri * p); c.textAlign = 'center';
        c.fillStyle = '#e8b93c'; c.font = `700 ${Math.round(h * .09)}px Arial`; c.fillText('Autopartes', w / 2 + h * .2, h * .66); }
    }
    if (sid === 'ganador') {
      const f = (Math.sin(t * 14) > .6 && t < 2.5) ? .9 : 0; if (f) { c.fillStyle = rgba(COLORS.blanco, f); c.fillRect(0, 0, w, h); }
      for (let i = 0; i < 90; i++) { const a = i * 2.4, r = (t * 260 + i * 9) % (Math.max(w, h)); const x = w / 2 + Math.cos(a) * r, y = h / 2 + Math.sin(a) * r * .7;
        c.fillStyle = [rgba(col, 1), rgba(COLORS.maple, 1), '#e8b93c', '#ffffff'][i % 4]; c.fillRect(x, y, h * .012, h * .012); }
      if (zone !== 'escalera') { c.fillStyle = '#fff'; c.font = `900 ${Math.round(h * .16)}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.globalAlpha = bri * Math.min(1, t); c.fillText('¡GANADOR!', w / 2, h / 2); }
    }
    c.globalAlpha = 1;
  }
  // color del LED para el simulador / puente (0..1 a lo largo de la tira)
  function ledAt(id, t0, st, u) {
    const [sid, tt] = sceneAt(id, t0); const t = tt * (st.speed || 1); const col = COLORS[st.color] || COLORS.calido; const b = st.bri == null ? 1 : st.bri;
    let k = 0, c = col;
    if (sid === 'apagado') { k = .12; c = COLORS.calido; }
    else if (sid === 'ambiente') k = .45 + .25 * Math.sin(t * 1.2);
    else if (sid === 'bienvenida') k = u < (t * .25 % 1.2) ? 1 : .08;
    else if (sid === 'ola') k = .5 + .5 * Math.sin((u * 10 - t * 3));
    else if (sid === 'logo') { const x = t * .35 % 1.4 - .2; k = Math.max(.15, 1 - Math.abs(u - x) * 6); }
    else if (sid === 'ganador') { k = (Math.sin(t * 14 + u * 20) > 0) ? 1 : .1; c = [col, COLORS.maple, [232, 185, 60]][Math.floor(u * 30 + t * 6) % 3]; }
    return [c[0] * k * b, c[1] * k * b, c[2] * k * b];
  }
  // ------------- tiempo real -------------
  async function connect(role, onCmd, onPeers) {
    if (!TOKEN || !window.supabase) return null;
    const sb = window.supabase.createClient(CFG.url, CFG.key);
    const ch = sb.channel(chName(), { config: { presence: { key: role + '-' + Math.random().toString(36).slice(2, 7) }, broadcast: { self: false } } });
    ch.on('broadcast', { event: 'cmd' }, p => onCmd && onCmd(p.payload));
    ch.on('presence', { event: 'sync' }, () => { const s = ch.presenceState(); const roles = Object.keys(s).map(k => k.split('-')[0]); onPeers && onPeers(roles); });
    await new Promise(r => ch.subscribe(async s => { if (s === 'SUBSCRIBED') { await ch.track({ role, at: Date.now() }); r(); } }));
    return { send: st => ch.send({ type: 'broadcast', event: 'cmd', payload: st }) };
  }
  return { SCENES, COLORS, TOKEN, draw, ledAt, connect };
})();
