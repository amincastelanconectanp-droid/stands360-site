// STANDS 360 · Motor del show de luces LED (el mismo código corre en el 3D, en el panel y en el puente que manda los pixeles al stand)
(function (root) {
  const C = { calido: [1, .62, .3], maple: [.95, .08, .1], azul: [.2, .38, 1], blanco: [1, .93, .82], oro: [1, .72, .2] };
  const SCENES = [
    { id: 'ambiente', name: 'Ambiente', desc: 'Luz cálida que respira suave. Para todo el día.', loop: true },
    { id: 'bienvenida', name: 'Bienvenida', desc: 'La luz sube desde el piso y se encienden los logos.', loop: true },
    { id: 'maple', name: 'Ola maple', desc: 'Ondas rojas y blancas salen de la hoja de maple.', loop: true },
    { id: 'carrera', name: 'Carrera de luz', desc: 'Cometas de luz recorren las orillas del stand.', loop: true },
    { id: 'logo', name: 'Logo Knadian', desc: 'Los logos laten al ritmo y el resto queda dorado.', loop: true },
    { id: 'ganador', name: '¡Ganador Arcade!', desc: 'Destellos y confeti de colores para quien gana.', loop: false, dur: 12 },
    { id: 'show', name: 'Show completo (60 s)', desc: 'El espectáculo con música, de principio a fin.', loop: false, dur: 60 },
    { id: 'apagado', name: 'Luz base', desc: 'Todo en luz cálida tenue. Las salas no cambian.', loop: true }
  ];
  const BPM = 120, BEAT = 60 / BPM;
  const cl = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  const mix = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  const sc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const hsv = (h) => { h = ((h % 1) + 1) % 1 * 6; const i = h | 0, f = h - i, q = 1 - f; return [[1, f, 0], [q, 1, 0], [0, 1, f], [0, q, 1], [f, 0, 1], [1, 0, q]][i]; };
  const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  const pulse = (t, k) => Math.exp(-((t % BEAT) / BEAT) * (k || 6));              // golpe en cada tiempo
  // contexto por versión: centro de la hoja, alturas, zonas
  function prep(data) {
    const P = data.pix, F = data.fx, n = P.length, zi = new Uint8Array(n), Z = ['perimetro', 'aristas', 'logos', 'maple', 'nichos', 'escalera', 'plafon', 'banda', 'salas', 'servicio'];
    let zmax = 0, cx = 0, cy = 0, cz = 0, cm = 0;
    for (let i = 0; i < n; i++) { const z = F[P[i][3]].z; zi[i] = Math.max(0, Z.indexOf(z)); zmax = Math.max(zmax, P[i][2]); if (z === 'maple') { cx += P[i][0]; cy += P[i][1]; cz += P[i][2]; cm++; } }
    const ctr = cm ? [cx / cm, cy / cm, cz / cm] : (data.center || [3, 0, 3]);
    const dist = new Float32Array(n); let dmax = 0;
    for (let i = 0; i < n; i++) { const d = Math.hypot(P[i][0] - ctr[0], P[i][1] - ctr[1], P[i][2] - ctr[2]); dist[i] = d; dmax = Math.max(dmax, d); }
    return { P, F, n, zi, Z, zmax, ctr, dist, dmax };
  }
  function sceneAt(id, t) {
    if (id !== 'show') return [id, t, 0];
    return ['show', t, 1];
  }
  // color de un pixel  (0..1 por canal)
  function px(X, i, id, t, st) {
    const z = X.Z[X.zi[i]], p = X.P[i], u = p[4], h = p[2] / (X.zmax || 6), d = X.dist[i] / (X.dmax || 10);
    const base = C[st.color] || C.calido, b = st.bri == null ? 1 : st.bri, sp = st.speed || 1; t *= sp;
    if (z === 'salas' || z === 'servicio') return sc(C.blanco, .85 * b);          // las salas y la bodega nunca entran al show
    const soft = z === 'plafon' ? .55 : 1;
    let c;
    if (id === 'apagado') c = sc(C.calido, .14);
    else if (id === 'ambiente') c = sc(base, .5 + .2 * Math.sin(t * 1.1 - h * 2 + u * 3));
    else if (id === 'bienvenida') { const lv = (t * .22) % 1.4; c = h < lv ? sc(base, 1) : sc(base, .06); if (z === 'logos') c = sc(C.blanco, cl((t * .22 % 1.4 - .55) * 3) * 1.2); }
    else if (id === 'maple') { const w = .5 + .5 * Math.sin(d * 18 - t * 5); c = mix(C.blanco, C.maple, w > .5 ? 1 : 0.15); c = sc(c, .25 + .75 * w); if (z === 'maple') c = sc(C.maple, .8 + .2 * Math.sin(t * 6)); }
    else if (id === 'carrera') { let k = 0; for (let j = 0; j < 3; j++) { const ph = ((u - t * .18 - j / 3) % 1 + 1) % 1; k = Math.max(k, Math.exp(-ph * 22)); } c = mix(sc(base, .08), C.blanco, k); if (z === 'logos' || z === 'maple') c = sc(base, .6); }
    else if (id === 'logo') { const k = pulse(t, 4); c = (z === 'logos' || z === 'maple') ? sc(z === 'maple' ? C.maple : C.blanco, .45 + .75 * k) : sc(C.oro, .22 + .1 * k); }
    else if (id === 'ganador') { const fl = t < 2.5 && Math.sin(t * 40) > .3; const sp2 = hash(i * 1.7 + Math.floor(t * 12)) > .82; c = fl ? sc(C.blanco, 1.2) : sp2 ? hsv(hash(i) + t * .3) : sc(hsv(u + t * .4), .25); }
    else c = showAt(X, i, t, st, z, u, h, d, base);
    return sc(c, b * soft);
  }
  // el show de 60 s, amarrado a la música (120 BPM)
  function showAt(X, i, t, st, z, u, h, d, base) {
    const k = pulse(t, 5), bar = Math.floor(t / (BEAT * 4));
    if (t < 8) {                                   // intro: la luz nace del piso
      const lv = t / 8 * 1.1; return h < lv ? sc(C.calido, cl((lv - h) * 4) * .7) : [0, 0, 0];
    }
    if (t < 16) {                                  // se encienden logos y aristas con cada golpe
      if (z === 'logos' || z === 'maple') { const on = (X.P[i][3] % 8) < (t - 8) * 1.2; return on ? sc(z === 'maple' ? C.maple : C.blanco, .5 + .8 * k) : [0, 0, 0]; }
      if (z === 'aristas' || z === 'escalera') return u < (t - 8) / 8 ? sc(C.oro, .5 + .5 * k) : [0, 0, 0];
      return sc(C.calido, .18 + .25 * k);
    }
    if (t < 32) {                                  // coro: carrera + ola, rojo/blanco alternado por compás
      const A = bar % 2 ? C.maple : C.blanco, B = bar % 2 ? C.blanco : C.maple;
      let q = 0; for (let j = 0; j < 4; j++) { const ph = ((u - t * .25 - j / 4) % 1 + 1) % 1; q = Math.max(q, Math.exp(-ph * 18)); }
      if (z === 'logos' || z === 'maple') return sc(B, .5 + .8 * k);
      if (z === 'plafon') return sc(A, .2 + .6 * k);
      return mix(sc(A, .1 + .25 * k), sc(B, 1.1), q);
    }
    if (t < 40) {                                  // pausa: la hoja late lento y salen ondas
      const w = .5 + .5 * Math.sin(d * 14 - (t - 32) * 3.2);
      if (z === 'maple' || z === 'logos') return sc(C.maple, .55 + .45 * Math.sin((t - 32) * 3.14));
      return mix(sc(C.azul, .12), sc(C.maple, .9), w * w);
    }
    if (t < 52) {                                  // subida: arcoíris que acelera y destellos
      const v = (t - 40) / 12, sp = hash(i * 3.1 + Math.floor(t * (6 + v * 18))) > .9 - v * .25;
      if (sp) return sc(C.blanco, 1.2);
      return sc(hsv(u * 2 + h - t * (.2 + v * .8)), .25 + .5 * v);
    }
    if (t < 54) return sc(C.blanco, 1.3 * (1 - (t - 52) / 2 * .4));          // golpe final
    const f = cl((60 - t) / 6);                    // cierre: queda el logo y luz cálida
    return (z === 'logos' || z === 'maple') ? sc(z === 'maple' ? C.maple : C.blanco, .9) : sc(C.calido, .2 + .45 * f);
  }
  // llena un Float32Array (r,g,b por pixel)
  function frame(X, id, t, st, out) {
    const sc0 = SCENES.find(s => s.id === id) || SCENES[0];
    for (let i = 0; i < X.n; i++) { const c = px(X, i, id, t, st); out[i * 3] = c[0]; out[i * 3 + 1] = c[1]; out[i * 3 + 2] = c[2]; }
    return out;
  }
  const api = { C, SCENES, BPM, prep, frame, px };
  if (typeof module !== 'undefined') module.exports = api; else root.S360LED = api;
})(typeof self !== 'undefined' ? self : this);
