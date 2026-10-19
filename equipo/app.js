(function () {
  "use strict";
  var S = window.S360, sb = S.sb, esc = S.esc, $ = S.$, app = $("#app");
  var C = '<div class="brand">stands<b>360</b> <span class="pill">Equipo</span></div>';
  function k(h) { app.innerHTML = h; window.scrollTo(0, 0); }
  function q(m, bad) {
    var t = document.createElement("div");
    t.className = "toast"; t.textContent = m;
    if (bad) t.style.background = "#ef6b6b";
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, bad ? 5000 : 2200);
  }
  function D(msg) { S360EQ.loginCode(msg); }
  async function j() {
    var s = await sb.auth.getSession();
    if (!s.data.session) return D();
    var r = await sb.from("profiles").select("id,nombre,rol,activo").eq("id", s.data.session.user.id).maybeSingle();
    var n = r.data;
    if (n && n.rol === "proveedor" && n.activo !== false) return S360EQ.mountTeam(n);
    var admin = n && ["admin", "jefe", "vendedor"].indexOf(n.rol) > -1;
    k('<div class="authwrap"><div class="card auth">' + C + "<h1>" + (admin ? "Tienes sesión del panel" : "Este código ya no está activo") + '</h1><p class="hint">' + (admin ? "Esta sesión es de administrador. Para entrar como equipo, cierra la sesión y escribe tu código." : "Pídele a Israel que te confirme tu código.") + '</p>' + (admin ? '<a class="btn" style="text-align:center" href="/admin/">Ir al panel</a>' : "") + '<button class="btn ghost" id="out" type="button">' + (admin ? "Cerrar sesión y entrar con código" : "Entrar con otro código") + "</button></div></div>");
    $("#out").onclick = async function () { await sb.auth.signOut(); D(); };
  }
  S360EQ.init({ k: k, q: q, C: C, D: D, j: j, team: true, N: function () { return ""; }, P: function () {}, home: function () {}, reload: function () {}, setTab: function () {}, getG: function () { return {}; }, getP: function () { return null; } });
  j();
})();
