// STANDS 360 · Puente del show de luces LED (KNADIAN)
// Corre en la mini PC del stand, conectada al mismo router que los controladores WLED.
// Escucha el panel (stands360.com/show/knadian/?k=CODIGO), calcula cada pixel con el mismo motor del 3D
// y lo manda a las tiras por DDP (UDP 4048) a 40 cuadros por segundo. Así todo el stand va exacto con la música.
// Uso:  npm i @supabase/supabase-js@2.45.4
//       SHOW_K=CODIGO VERSION=V1 WLED_IPS=192.168.4.21,192.168.4.22,... node puente-led.mjs
//       PRUEBA=1 ...  -> recorre cada controlador en blanco para revisar el cableado
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
import dgram from 'dgram';
import fs from 'fs';
const require = createRequire(import.meta.url);
const L = require('./ledshow.js');

const CODIGO = process.env.SHOW_K || 'PONER_CODIGO_DEL_SHOW';
const VERSION = (process.env.VERSION || 'V1').toUpperCase();
const IPS = (process.env.WLED_IPS || '').split(',').filter(Boolean);      // un IP por controlador, en el orden del mapa (C1, C2, ...)
const FPS = 40;
const D = JSON.parse(fs.readFileSync(`./leds_${VERSION}.json`, 'utf8'));
const X = L.prep(D), RGB = new Float32Array(X.n * 3);
// orden de cableado de cada controlador (según el mapa de pixeles)
const NC = Math.max(...D.fx.map(f => f.c)) + 1;
const ORDER = Array.from({ length: NC }, () => []);
D.fx.filter(f => f.c >= 0).sort((a, b) => a.c - b.c || a.a - b.a).forEach(f => { for (let i = f.p0; i < f.p1; i++) ORDER[f.c].push(i); });
if (IPS.length < NC) console.log(`Ojo: el mapa de ${VERSION} usa ${NC} controladores y solo diste ${IPS.length} IPs.`);
// salas y bodega (luz fija) van al último IP extra si existe
const SALAS = []; D.fx.filter(f => f.c < 0).forEach(f => { for (let i = f.p0; i < f.p1; i++) SALAS.push(i); });
if (IPS.length > NC && SALAS.length) ORDER.push(SALAS);

const udp = dgram.createSocket('udp4'); let seq = 0;
function ddp(ip, buf) {                                   // DDP: paquetes de hasta 480 pixeles
  const MAX = 1440; seq = (seq % 15) + 1;
  for (let off = 0; off < buf.length; off += MAX) {
    const len = Math.min(MAX, buf.length - off), h = Buffer.alloc(10);
    h[0] = 0x40 | (off + len >= buf.length ? 0x01 : 0); h[1] = seq; h[2] = 0x0B; h[3] = 1; h.writeUInt32BE(off, 4); h.writeUInt16BE(len, 8);
    udp.send(Buffer.concat([h, buf.subarray(off, off + len)]), 4048, ip);
  }
}
let ST = { scene: 'ambiente', at: Date.now(), bri: .9, speed: 1, color: 'calido' };
const gam = (v) => Math.round(255 * Math.pow(Math.min(1, Math.max(0, v)), 1.8));
function tick() {
  let t = (Date.now() - ST.at) / 1000; const sc = L.SCENES.find(s => s.id === ST.scene) || L.SCENES[0];
  if (!sc.loop && t > sc.dur) { ST = { ...ST, scene: 'ambiente', at: Date.now() }; t = 0; }
  if (process.env.PRUEBA) { const c = Math.floor(Date.now() / 3000) % ORDER.length; ORDER.forEach((o, j) => { const b = Buffer.alloc(o.length * 3, j === c ? 180 : 0); if (IPS[j]) ddp(IPS[j], b); }); return; }
  L.frame(X, ST.scene, t, ST, RGB);
  ORDER.forEach((o, j) => { if (!IPS[j]) return; const b = Buffer.alloc(o.length * 3);
    o.forEach((i, k) => { b[k * 3] = gam(RGB[i * 3]); b[k * 3 + 1] = gam(RGB[i * 3 + 1]); b[k * 3 + 2] = gam(RGB[i * 3 + 2]); }); ddp(IPS[j], b); });
}
setInterval(tick, 1000 / FPS);

const sb = createClient('https://mcxqcipylkiulakyiguh.supabase.co', 'sb_publishable_1TIdgBhFGR4zlEJJOySNnw_-Ggm5SjH');
const ch = sb.channel('s360-show-knadian-' + CODIGO, { config: { presence: { key: 'led-puente' } } });
ch.on('broadcast', { event: 'cmd' }, ({ payload: p }) => {
  if (!p || !p.scene || (p.v && p.v !== VERSION)) return;
  ST = { ...p }; console.log(new Date().toLocaleTimeString(), 'escena:', p.scene, 'brillo', Math.round((p.bri ?? 1) * 100) + '%');
});
ch.subscribe(async s => { if (s === 'SUBSCRIBED') { await ch.track({ role: 'led', v: VERSION }); console.log(`Puente LED ${VERSION} en línea · ${X.n} pixeles · ${NC} controladores. Esperando escenas…`); ch.send({ type: 'broadcast', event: 'cmd', payload: { ask: true } }); } });
