/*
 * Simulador de Consulta Clínica — motor de novela visual
 * Sin dependencias. Los casos se registran en window.CASOS (ver js/casos/).
 */
(function () {
  'use strict';

  // ------------------------------------------------------------ utilidades
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  const plano = (t) => String(t).replace(/\*\*/g, '');
  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ------------------------------------------------------------ almacenamiento
  const CLAVE = 'simclin:v1';
  const Store = {
    d: { progreso: {}, mejores: {}, notas: {}, historial: [] },
    cargar() {
      try {
        const raw = localStorage.getItem(CLAVE);
        if (raw) Object.assign(this.d, JSON.parse(raw));
      } catch (e) { /* almacenamiento no disponible */ }
    },
    guardar() {
      try { localStorage.setItem(CLAVE, JSON.stringify(this.d)); } catch (e) { /* noop */ }
    },
  };

  // ------------------------------------------------------------ estado global
  let caso = null; // datos del caso
  let S = null; // estado de la partida (serializable)
  let timerId = null;
  const D = { cola: [], ocupado: false, escribiendo: null, textoCompleto: '' };
  let hcVistas = 0;

  const casoPorId = (id) => (window.CASOS || []).find((c) => c.id === id);

  function nuevoEstado(c, modo) {
    return {
      caseId: c.id, modo, fase: -1, paso: 0, flags: {}, usados: {}, hc: {}, hcTotal: 0,
      tiempo: 0, estabilidad: 100, log: [], expr: c.exprInicial || 'neutral', monitor: null,
      restante: modo === 'examen' ? c.duracionExamen || 600 : null,
      terminado: false, motivoFin: null, faseIntroVista: {}, inicio: Date.now(),
    };
  }

  // ============================================================ AVATAR SVG
  function avatarSVG(av, expr) {
    const piel = av.piel || '#e8b892', sombra = av.sombra || '#d39a74', pelo = av.pelo || '#3a2418',
      iris = av.ojos || '#4a2f1f', bata = av.bata || '#9cc7e0';
    const ojoAbierto = (x, ry = 7) => `<ellipse cx="${x}" cy="142" rx="9" ry="${ry}" fill="#fff"/><circle cx="${x}" cy="143" r="5" fill="${iris}"/><circle cx="${x}" cy="143" r="2.4" fill="#111"/><circle cx="${x + 2}" cy="140.5" r="1.6" fill="#fff"/><path d="M${x - 10} ${141 - ry + 5} Q${x} ${134 - ry + 4} ${x + 10} ${141 - ry + 5}" stroke="#2a1a12" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    const ojoCerrado = (x, curva) => `<path d="M${x - 9} 143 Q${x} ${curva} ${x + 9} 143" stroke="#2a1a12" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    const cejas = {
      neutral: '<path d="M114 124 Q127 119 139 123" /><path d="M161 123 Q173 119 186 124" />',
      dolor: '<path d="M114 128 Q127 122 139 115" /><path d="M161 115 Q173 122 186 128" />',
      preocupada: '<path d="M114 125 Q127 121 139 117" /><path d="M161 117 Q173 121 186 125" />',
      alivio: '<path d="M114 122 Q127 117 139 121" /><path d="M161 121 Q173 117 186 122" />',
      sorpresa: '<path d="M114 116 Q127 108 139 114" /><path d="M161 114 Q173 108 186 116" />',
    };
    const ojos = {
      neutral: ojoAbierto(127) + ojoAbierto(173),
      dolor: ojoCerrado(127, 138) + ojoCerrado(173, 138) + '<path d="M118 150 L124 148 M182 150 L176 148" stroke="#2a1a12" stroke-width="1.5"/>',
      preocupada: ojoAbierto(127, 7.5) + ojoAbierto(173, 7.5),
      alivio: ojoCerrado(127, 135) + ojoCerrado(173, 135),
      sorpresa: ojoAbierto(127, 9) + ojoAbierto(173, 9),
    };
    const boca = {
      neutral: '<path d="M138 187 Q150 192 162 187" stroke="#8c3b32" stroke-width="3" fill="none" stroke-linecap="round"/>',
      dolor: '<path d="M135 191 Q150 180 165 191 Q150 187 135 191 Z" fill="#7a2c26"/><path d="M139 189 Q150 183 161 189" stroke="#fff" stroke-width="2.5" fill="none"/>',
      preocupada: '<path d="M140 190 Q150 185 160 190" stroke="#8c3b32" stroke-width="3" fill="none" stroke-linecap="round"/>',
      alivio: '<path d="M136 184 Q150 198 164 184" stroke="#8c3b32" stroke-width="3" fill="none" stroke-linecap="round"/>',
      sorpresa: '<ellipse cx="150" cy="190" rx="7" ry="9" fill="#7a2c26"/>',
    };
    const extra = {
      dolor: '<path d="M203 108 q-6 10 0 14 q6 -4 0 -14z" fill="#9fd6f5" opacity=".9"/>',
      alivio: '<ellipse cx="114" cy="165" rx="10" ry="5" fill="#f08a8a" opacity=".35"/><ellipse cx="186" cy="165" rx="10" ry="5" fill="#f08a8a" opacity=".35"/>',
      sorpresa: '<ellipse cx="114" cy="165" rx="9" ry="4" fill="#f08a8a" opacity=".25"/><ellipse cx="186" cy="165" rx="9" ry="4" fill="#f08a8a" opacity=".25"/>',
      preocupada: '', neutral: '',
    };
    const e = ojos[expr] ? expr : 'neutral';
    const cola = av.peinado === 'coleta' ? `<path d="M196 92 Q246 120 228 214 Q220 236 206 226 Q222 170 190 116 Z" fill="${pelo}"/>` : '';
    return `<svg viewBox="0 0 300 340" class="avatar-svg" role="img" aria-label="Paciente, expresión ${e}">
      <defs>
        <linearGradient id="gBata" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bata}"/><stop offset="1" stop-color="#7aa9c6"/></linearGradient>
        <pattern id="pBata" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.6" fill="#ffffff" opacity=".45"/></pattern>
      </defs>
      ${cola}
      <ellipse cx="150" cy="118" rx="68" ry="66" fill="${pelo}"/>
      <path d="M58 340 Q60 252 150 242 Q240 252 242 340 Z" fill="url(#gBata)"/>
      <path d="M58 340 Q60 252 150 242 Q240 252 242 340 Z" fill="url(#pBata)"/>
      <rect x="131" y="190" width="38" height="60" rx="14" fill="${sombra}"/>
      <path d="M120 246 L150 280 L180 246" fill="${piel}" stroke="#6f98b3" stroke-width="3"/>
      <ellipse cx="91" cy="148" rx="9" ry="14" fill="${sombra}"/><ellipse cx="209" cy="148" rx="9" ry="14" fill="${sombra}"/>
      <ellipse cx="150" cy="140" rx="58" ry="68" fill="${piel}"/>
      <path d="M92 128 Q96 70 150 64 Q204 70 208 128 Q196 98 166 90 Q156 104 134 96 Q110 102 92 128 Z" fill="${pelo}"/>
      <g stroke="#2a1a12" stroke-width="3.4" fill="none" stroke-linecap="round">${cejas[e]}</g>
      ${ojos[e]}
      <path d="M150 150 Q146 166 150 170 Q154 171 156 168" stroke="${sombra}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${boca[e]}
      ${extra[e]}
    </svg>`;
  }

  // ============================================================ PANTALLAS
  const app = () => $('#app');

  function mostrar(id) {
    document.querySelectorAll('.pantalla').forEach((p) => p.classList.toggle('activa', p.id === id));
    window.scrollTo(0, 0);
  }

  // ------------------------------------------------------------ MENÚ
  function renderMenu() {
    detenerTimer();
    const casos = window.CASOS || [];
    const proximos = window.CASOS_PROXIMOS || [];
    const hist = Store.d.historial.slice(-5).reverse();
    $('#menu').innerHTML = `
      <div class="menu-wrap">
        <header class="menu-hero">
          <div class="logo" aria-hidden="true">🩺</div>
          <h1>Simulador de Consulta Clínica</h1>
          <p>Atiende a pacientes desde los ojos del médico. Anamnesis, exploración, estudios, diagnóstico y decisiones, con checklist al estilo de la prueba práctica del Revalida.</p>
        </header>
        <h2 class="sec-titulo">Casos clínicos</h2>
        <div class="grid-casos">
          ${casos.map((c) => {
            const mejor = Store.d.mejores[c.id];
            const prog = Store.d.progreso[c.id];
            return `<article class="card-caso" style="--acento:${c.color}">
              <div class="card-area">${esc(c.area)}</div>
              <h3>${esc(c.titulo)}</h3>
              <p>${esc(c.subtitulo)}</p>
              <div class="card-meta">
                <span class="chip">${esc(c.dificultad)}</span>
                ${mejor ? `<span class="chip chip-ok">Mejor nota: ${mejor.nota.toFixed(1)}</span>` : '<span class="chip">Sin jugar</span>'}
              </div>
              <div class="card-acciones">
                ${prog ? `<button class="btn btn-prim" data-continuar="${c.id}">▶ Continuar</button><button class="btn btn-sec" data-jugar="${c.id}">Nueva partida</button>`
                  : `<button class="btn btn-prim" data-jugar="${c.id}">▶ Jugar</button>`}
              </div>
            </article>`;
          }).join('')}
          ${proximos.map((p) => `<article class="card-caso bloqueado" style="--acento:${p.color}">
              <div class="card-area">${esc(p.area)}</div>
              <h3>${esc(p.titulo)}</h3>
              <p>${esc(p.subtitulo)}</p>
              <div class="card-meta"><span class="chip">🔒 Próximamente</span></div>
            </article>`).join('')}
        </div>
        ${hist.length ? `<h2 class="sec-titulo">Historial reciente</h2>
          <ul class="historial">${hist.map((h) => `<li><span>${esc(h.titulo)}</span><span class="h-modo">${h.modo === 'examen' ? '⏱ Examen' : '📖 Estudio'}</span><span class="h-fecha">${new Date(h.fecha).toLocaleDateString('es')}</span><strong>${h.nota.toFixed(1)}</strong></li>`).join('')}</ul>` : ''}
        <footer class="menu-pie">Simulador educativo. No reemplaza el juicio clínico ni los protocolos locales.</footer>
      </div>`;
    $('#menu').querySelectorAll('[data-jugar]').forEach((b) => b.addEventListener('click', () => elegirModo(b.dataset.jugar)));
    $('#menu').querySelectorAll('[data-continuar]').forEach((b) => b.addEventListener('click', () => continuarCaso(b.dataset.continuar)));
    mostrar('menu');
  }

  function elegirModo(id) {
    const c = casoPorId(id);
    modal(`
      <h2>${esc(c.titulo)}</h2>
      <p>Elige el modo de juego:</p>
      <div class="modos">
        <button class="modo" data-modo="estudio"><span class="modo-ico">📖</span><strong>Estudio</strong><span>Sin reloj. Juega a tu ritmo.</span></button>
        <button class="modo" data-modo="examen"><span class="modo-ico">⏱</span><strong>Examen</strong><span>${Math.round((c.duracionExamen || 600) / 60)} minutos reales, como la estación del PEP.</span></button>
      </div>`, (box, cerrar) => {
      box.querySelectorAll('[data-modo]').forEach((b) => b.addEventListener('click', () => { cerrar(); iniciarCaso(id, b.dataset.modo); }));
    });
  }

  function iniciarCaso(id, modo) {
    caso = casoPorId(id);
    S = nuevoEstado(caso, modo);
    Store.d.progreso[id] = S;
    Store.guardar();
    montarJuego();
    decir(caso.introLineas || [], () => renderPanel());
  }

  function continuarCaso(id) {
    caso = casoPorId(id);
    S = Store.d.progreso[id];
    if (!S) return iniciarCaso(id, 'estudio');
    if (S.finalizando) { S.finalizando = false; montarJuego(); return terminar(S.motivoFin || 'completo'); }
    montarJuego();
    decir([['narrador', 'Partida restaurada. Continúas donde la dejaste.']], () => renderPanel());
  }

  function guardar() {
    if (!S || S.terminado) return;
    Store.d.progreso[S.caseId] = S;
    Store.guardar();
  }

  // ------------------------------------------------------------ JUEGO
  function montarJuego() {
    D.cola = []; D.ocupado = false;
    hcVistas = S.hcTotal;
    $('#juego').innerHTML = `
      <header class="topbar">
        <button class="btn-ico" id="btnSalir" title="Volver al menú" aria-label="Volver al menú">←</button>
        <div class="tb-titulo"><span class="tb-area" style="color:${caso.color}">${esc(caso.areaCorta || caso.area)}</span><strong>${esc(caso.titulo)}</strong></div>
        <ol class="stepper" id="stepper"></ol>
        <div class="tb-indicadores">
          <div class="ind" title="Hora clínica (tiempo transcurrido desde la llegada)"><span class="ind-lbl">Reloj clínico</span><span id="reloj" class="ind-val"></span></div>
          <div class="ind" title="Estado del paciente"><span class="ind-lbl">Paciente</span><div class="barra"><div id="barraEstab"></div></div></div>
          ${S.modo === 'examen' ? '<div class="ind ind-timer"><span class="ind-lbl">Examen</span><span id="timer" class="ind-val"></span></div>' : ''}
        </div>
        <button class="btn-ico btn-hc" id="btnHC" title="Historia clínica" aria-label="Abrir historia clínica">📋<span id="hcBadge" class="badge" hidden></span></button>
      </header>
      <main class="stage">
        <section class="escena" id="escena">
          <div class="esc-fondo" aria-hidden="true"><div class="esc-ventana"></div><div class="esc-cortina"></div><div class="esc-camilla"></div></div>
          <div class="monitor" id="monitor" hidden></div>
          <div class="paciente" id="paciente"></div>
          <div class="dialogo" id="dialogo" tabindex="0" role="button" aria-live="polite">
            <div class="dlg-nombre" id="dlgNombre"></div>
            <div class="dlg-texto" id="dlgTexto"></div>
            <div class="dlg-reporte" id="dlgReporte" hidden></div>
            <div class="dlg-sig" id="dlgSig">▼</div>
          </div>
        </section>
        <aside class="panel" id="panel"></aside>
      </main>
      <div class="drawer" id="drawer" aria-hidden="true">
        <div class="drawer-cab"><h2>📋 Historia clínica</h2><button class="btn-ico" id="btnCerrarHC" aria-label="Cerrar">✕</button></div>
        <div class="drawer-cuerpo" id="hcCuerpo"></div>
      </div>
      <div class="velo" id="velo" hidden></div>`;
    $('#btnSalir').addEventListener('click', () => confirmar('¿Volver al menú? Tu progreso queda guardado' + (S.modo === 'examen' ? ', pero el reloj del examen se pausa.' : '.'), () => { guardar(); renderMenu(); }));
    $('#btnHC').addEventListener('click', abrirHC);
    $('#btnCerrarHC').addEventListener('click', cerrarHC);
    $('#velo').addEventListener('click', cerrarHC);
    $('#dialogo').addEventListener('click', avanzarDialogo);
    mostrar('juego');
    actualizarEscena();
    actualizarTopbar();
    iniciarTimer();
  }

  function actualizarEscena() {
    $('#paciente').innerHTML = avatarSVG(caso.paciente.avatar || {}, S.expr);
    const m = $('#monitor');
    if (S.monitor) {
      m.hidden = false;
      const v = S.monitor;
      m.innerHTML = `<div class="mon-fila mon-fc"><span>FC</span><b>${v.FC}</b><i>lpm</i></div>
        <svg class="mon-ecg" viewBox="0 0 120 24" aria-hidden="true"><path d="M0 12 L20 12 L24 12 L27 4 L30 20 L33 12 L50 12 L54 12 L57 4 L60 20 L63 12 L80 12 L84 12 L87 4 L90 20 L93 12 L120 12"/></svg>
        <div class="mon-fila mon-pa"><span>PA</span><b>${v.PA}</b><i>mmHg</i></div>
        <div class="mon-fila mon-sat"><span>SpO₂</span><b>${v.SpO2}</b><i>%</i></div>
        <div class="mon-fila mon-t"><span>T°</span><b>${v.T}</b><i>°C</i></div>
        <div class="mon-fila mon-fr"><span>FR</span><b>${v.FR}</b><i>rpm</i></div>`;
    } else m.hidden = true;
  }

  function actualizarTopbar() {
    const st = $('#stepper');
    if (!st) return;
    st.innerHTML = caso.fases.map((f, i) => `<li class="${i < S.fase ? 'hecha' : i === S.fase ? 'actual' : ''}" title="${esc(f.titulo)}"><span class="st-num">${i + 1}</span><span class="st-txt">${esc(f.titulo)}</span></li>`).join('');
    const [h0, m0] = caso.horaLlegada || [8, 0];
    const tot = h0 * 60 + m0 + S.tiempo;
    $('#reloj').textContent = `${pad(Math.floor(tot / 60) % 24)}:${pad(tot % 60)} · +${Math.floor(S.tiempo / 60)}h${pad(S.tiempo % 60)}`;
    const e = clamp(S.estabilidad, 0, 100);
    const b = $('#barraEstab');
    b.style.width = e + '%';
    b.className = e > 70 ? 'ok' : e > 40 ? 'med' : 'mal';
    b.parentElement.title = `Estado del paciente: ${e > 70 ? 'estable' : e > 40 ? 'inestable' : 'crítico'} (${e}%)`;
    actualizarTimer();
    const nuevos = S.hcTotal - hcVistas;
    const badge = $('#hcBadge');
    badge.hidden = nuevos <= 0;
    badge.textContent = nuevos;
  }

  // ------------------------------------------------------------ TEMPORIZADOR (modo examen)
  function iniciarTimer() {
    detenerTimer();
    if (S.modo !== 'examen' || S.terminado) return;
    timerId = setInterval(() => {
      S.restante = Math.max(0, S.restante - 1);
      actualizarTimer();
      if (S.restante % 5 === 0) guardar();
      if (S.restante <= 0) {
        detenerTimer();
        D.cola = []; D.ocupado = false;
        decir([['narrador', '⏱ **¡Tiempo!** Se terminó la estación.']], () => terminar('tiempo'));
      }
    }, 1000);
  }
  function detenerTimer() { if (timerId) clearInterval(timerId); timerId = null; }
  function actualizarTimer() {
    const t = $('#timer');
    if (!t || S.restante == null) return;
    t.textContent = `${pad(Math.floor(S.restante / 60))}:${pad(S.restante % 60)}`;
    t.parentElement.classList.toggle('alerta', S.restante <= 60);
  }

  // ------------------------------------------------------------ DIÁLOGOS
  function normalizarLinea(l) {
    if (Array.isArray(l)) return { quien: l[0], texto: l[1], expr: l[2] };
    return l;
  }

  function decir(lineas, alTerminar) {
    (lineas || []).forEach((l) => D.cola.push(normalizarLinea(l)));
    if (alTerminar) D.cola.push({ fn: alTerminar });
    if (!D.ocupado) { D.ocupado = true; bloquearPanel(true); siguienteLinea(); }
  }

  function siguienteLinea() {
    while (D.cola.length && D.cola[0].fn) {
      const { fn } = D.cola.shift();
      if (!D.cola.length) { D.ocupado = false; bloquearPanel(false); $('#dlgSig').hidden = true; fn(); return; }
      fn();
      if (S.terminado) return;
    }
    if (!D.cola.length) { D.ocupado = false; bloquearPanel(false); $('#dlgSig').hidden = true; return; }
    const l = D.cola.shift();
    const pj = (caso.personajes || {})[l.quien] || { nombre: l.quien, clase: 'nar' };
    const nombre = $('#dlgNombre');
    nombre.textContent = pj.nombre;
    nombre.className = 'dlg-nombre ' + pj.clase;
    nombre.hidden = !pj.nombre;
    $('#dialogo').className = 'dialogo q-' + pj.clase;
    if (l.expr && l.expr !== S.expr) {
      S.expr = l.expr;
      actualizarEscena();
      if (l.expr === 'dolor' || l.expr === 'sorpresa') { const p = $('#paciente'); p.classList.remove('sacudir'); void p.offsetWidth; p.classList.add('sacudir'); }
    }
    $('#paciente').classList.toggle('hablando', l.quien === 'paciente');
    const rep = $('#dlgReporte');
    if (l.reporte) {
      rep.hidden = false;
      rep.innerHTML = `<div class="rep-titulo">${esc(l.reporte.titulo)}</div>` + (l.reporte.filas
        ? `<table class="tabla tabla-lab"><thead><tr><th>Parámetro</th><th>Resultado</th><th>Referencia</th></tr></thead><tbody>${l.reporte.filas.map((f) => `<tr class="${f[3] ? 'alterado' : ''}"><td>${esc(f[0])}</td><td>${esc(f[1])}${f[3] ? ' ↑' : ''}</td><td>${esc(f[2])}</td></tr>`).join('')}</tbody></table>`
        : `<p>${fmt(l.reporte.texto)}</p>`);
    } else { rep.hidden = true; rep.innerHTML = ''; }
    escribir(l.texto);
    $('#dlgSig').hidden = false;
  }

  function escribir(texto) {
    const nodo = $('#dlgTexto');
    const html = fmt(texto);
    D.textoCompleto = html;
    if (D.escribiendo) clearInterval(D.escribiendo);
    const limpio = plano(texto);
    let i = 0;
    const reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducido) { nodo.innerHTML = html; D.escribiendo = null; return; }
    nodo.textContent = '';
    D.escribiendo = setInterval(() => {
      i += 2;
      nodo.textContent = limpio.slice(0, i);
      if (i >= limpio.length) { clearInterval(D.escribiendo); D.escribiendo = null; nodo.innerHTML = html; }
    }, 16);
  }

  function avanzarDialogo() {
    if (!D.ocupado) return;
    if (D.escribiendo) { clearInterval(D.escribiendo); D.escribiendo = null; $('#dlgTexto').innerHTML = D.textoCompleto; return; }
    siguienteLinea();
  }

  function bloquearPanel(b) {
    const p = $('#panel');
    if (p) p.classList.toggle('bloqueado', b);
  }

  document.addEventListener('keydown', (ev) => {
    if (!$('#juego').classList.contains('activa')) return;
    if (ev.target.closest('textarea, input')) return;
    if (ev.key === ' ' || ev.key === 'Enter') {
      if (D.ocupado) { ev.preventDefault(); avanzarDialogo(); }
    }
    if (ev.key === 'Escape') cerrarHC();
  });

  // ------------------------------------------------------------ EFECTOS
  const api = {
    addHC(seccion, texto) {
      (S.hc[seccion] = S.hc[seccion] || []).push(texto);
      S.hcTotal++;
    },
    monitor(v) { S.monitor = v; },
  };

  function aplicar(op) {
    const extra = [];
    (op.flags || []).forEach((f) => { S.flags[f] = true; });
    if (op.hc) api.addHC(op.hc[0], op.hc[1]);
    if (op.estabilidad) S.estabilidad = clamp(S.estabilidad + op.estabilidad, 0, 100);
    if (op.efecto) { const r = op.efecto(S, api); if (Array.isArray(r)) extra.push(...r); }
    if (op.tiempo) S.tiempo += op.tiempo;
    S.log.push({ t: S.tiempo, fase: S.fase, texto: plano(op.texto) });
    const base = typeof op.lineas === 'function' ? op.lineas(S) : op.lineas || [];
    return [...base, ...extra, ...chequearProgresion()];
  }

  function chequearProgresion() {
    const p = caso.progresion;
    if (!p || S.flags[p.flag] || S.tiempo < p.limite) return [];
    S.flags[p.flag] = true;
    const r = p.aplicar(S) || [];
    S.estabilidad = clamp(S.estabilidad, 0, 100);
    return r;
  }

  const trasAccion = () => { actualizarEscena(); actualizarTopbar(); guardar(); renderPanel(); };

  // ------------------------------------------------------------ PANEL DE ACCIONES
  function renderPanel() {
    if (!S || S.terminado) return;
    actualizarTopbar();
    const p = $('#panel');
    p.classList.toggle('bloqueado', D.ocupado);

    // Escenario inicial
    if (S.fase === -1) {
      const e = caso.escenario;
      p.innerHTML = `
        <div class="pnl-cab"><span class="pnl-fase">Estación</span><h2>${esc(e.lugar)}</h2></div>
        <div class="pnl-cuerpo">
          <div class="tarjeta-escenario">
            <p>${fmt(e.texto)}</p>
            <h3>Tareas del candidato</h3>
            <ol>${e.tareas.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
            ${S.modo === 'examen' ? `<p class="aviso">⏱ Modo examen: tienes ${Math.round((caso.duracionExamen || 600) / 60)} minutos reales.</p>` : ''}
          </div>
        </div>
        <div class="pnl-pie"><button class="btn btn-prim btn-ancho" id="btnComenzar">Comenzar la consulta →</button></div>`;
      $('#btnComenzar').addEventListener('click', () => irAFase(0));
      return;
    }

    const fase = caso.fases[S.fase];
    const cab = `<div class="pnl-cab"><span class="pnl-fase">Fase ${S.fase + 1} de ${caso.fases.length}</span><h2>${esc(fase.titulo)}</h2>${fase.ayuda ? `<p class="pnl-ayuda">${esc(fase.ayuda)}</p>` : ''}</div>`;

    if (fase.tipo === 'acciones') {
      const grupos = fase.grupos.filter((g) => !g.requiere || S.flags[g.requiere]);
      const ocultos = fase.grupos.length - grupos.length;
      const usadosFase = fase.grupos.reduce((a, g) => a + g.opciones.filter((o) => S.usados[o.id]).length, 0);
      p.innerHTML = cab + `<div class="pnl-cuerpo">
        ${grupos.map((g) => `<details class="grupo" open><summary>${esc(g.titulo)} <span class="cnt">${g.opciones.filter((o) => S.usados[o.id]).length}/${g.opciones.length}</span></summary>
          <div class="opciones">${g.opciones.map((o) => `<button class="op ${S.usados[o.id] ? 'usada' : ''}" data-op="${o.id}" ${S.usados[o.id] ? 'disabled' : ''}>
              <span class="op-txt">${fmt(o.texto)}</span>${o.tiempo ? `<span class="op-t">${o.tiempo >= 60 ? Math.round(o.tiempo / 60) + ' h' : o.tiempo + ' min'}</span>` : ''}</button>`).join('')}</div></details>`).join('')}
        ${ocultos ? `<p class="pista">🔒 ${ocultos} grupo(s) más se desbloquearán según lo que preguntes.</p>` : ''}
        </div>
        <div class="pnl-pie"><span class="pie-info">${usadosFase} acción(es)</span><button class="btn btn-prim" id="btnSigFase">${S.fase === caso.fases.length - 1 ? 'Finalizar' : 'Siguiente fase →'}</button></div>`;
      p.querySelectorAll('[data-op]').forEach((b) => b.addEventListener('click', () => {
        if (D.ocupado) return;
        const op = fase.grupos.flatMap((g) => g.opciones).find((o) => o.id === b.dataset.op);
        usarOpcion(op);
      }));
      $('#btnSigFase').addEventListener('click', () => {
        if (D.ocupado) return;
        const sig = caso.fases[S.fase + 1];
        confirmar(`¿Terminar «${fase.titulo}»${sig ? ` y pasar a «${sig.titulo}»` : ''}? No podrás volver a esta fase.`, () => irAFase(S.fase + 1));
      });
      return;
    }

    if (fase.tipo === 'pasos') {
      // saltar pasos condicionados
      while (S.paso < fase.pasos.length && fase.pasos[S.paso].saltarSi && S.flags[fase.pasos[S.paso].saltarSi]) S.paso++;
      if (S.paso >= fase.pasos.length) {
        p.innerHTML = cab + `<div class="pnl-cuerpo"><div class="tarjeta-escenario"><p>✅ Fase completada.</p></div></div>
          <div class="pnl-pie"><button class="btn btn-prim btn-ancho" id="btnSigFase">${S.fase === caso.fases.length - 1 ? 'Ver resultado →' : 'Siguiente fase →'}</button></div>`;
        $('#btnSigFase').addEventListener('click', () => { if (!D.ocupado) irAFase(S.fase + 1); });
        return;
      }
      const paso = fase.pasos[S.paso];
      const multi = paso.tipo === 'multiple';
      p.innerHTML = cab + `<div class="pnl-cuerpo">
          <div class="paso-prog">Pregunta ${S.paso + 1} de ${fase.pasos.length}</div>
          <h3 class="paso-preg">${fmt(paso.pregunta)}</h3>
          <form class="paso-form" id="pasoForm">${paso.opciones.map((o) => `<label class="sel"><input type="${multi ? 'checkbox' : 'radio'}" name="op" value="${o.id}"><span>${fmt(o.texto)}</span></label>`).join('')}</form>
          ${multi && paso.max ? `<p class="pista" id="maxInfo">Máximo ${paso.max}.</p>` : ''}
        </div>
        <div class="pnl-pie"><button class="btn btn-prim btn-ancho" id="btnConfirmar" disabled>Confirmar</button></div>`;
      const form = $('#pasoForm');
      const btn = $('#btnConfirmar');
      form.addEventListener('change', () => {
        const sel = [...form.querySelectorAll('input:checked')];
        if (multi && paso.max && sel.length > paso.max) { sel[sel.length - 1].checked = false; }
        btn.disabled = form.querySelectorAll('input:checked').length === 0;
      });
      btn.addEventListener('click', () => {
        if (D.ocupado) return;
        const ids = [...form.querySelectorAll('input:checked')].map((i) => i.value);
        confirmarPaso(fase, paso, ids);
      });
    }
  }

  function usarOpcion(op) {
    if (!op || S.usados[op.id]) return;
    S.usados[op.id] = true;
    const lineas = aplicar(op);
    guardar();
    renderPanel();
    decir(lineas, trasAccion);
  }

  function confirmarPaso(fase, paso, ids) {
    const elegidas = paso.opciones.filter((o) => ids.includes(o.id));
    S.decisiones = S.decisiones || {};
    S.decisiones[paso.id] = ids;
    let lineas = [];
    elegidas.forEach((o) => { lineas = lineas.concat(aplicar(o)); });
    if (paso.alConfirmar) paso.alConfirmar(S, elegidas);
    if (paso.hcSeccion) api.addHC(paso.hcSeccion, (paso.hcPrefijo || '') + elegidas.map((o) => plano(o.texto)).join('; ') + '.');
    if (!lineas.length) lineas = [['narrador', 'Registras en la historia clínica: ' + elegidas.map((o) => plano(o.texto)).join('; ') + '.']];
    S.paso++;
    guardar();
    renderPanel();
    bloquearPanel(true);
    decir(lineas, trasAccion);
  }

  function irAFase(n) {
    if (n >= caso.fases.length) return terminar('completo');
    S.fase = n;
    S.paso = 0;
    guardar();
    renderPanel();
    const f = caso.fases[n];
    if (f.intro && !S.faseIntroVista[f.id]) {
      S.faseIntroVista[f.id] = true;
      decir(f.intro, trasAccion);
    }
  }

  // ------------------------------------------------------------ HISTORIA CLÍNICA
  function abrirHC() {
    hcVistas = S.hcTotal;
    actualizarTopbar();
    const secs = caso.hcSecciones || Object.keys(S.hc);
    const nota = Store.d.notas[caso.id] || '';
    $('#hcCuerpo').innerHTML = `
      <div class="hc-pac"><strong>${esc(caso.paciente.nombre)}</strong> · ${caso.paciente.edad} años</div>
      ${secs.map((s) => `<section class="hc-sec ${S.hc[s] ? '' : 'vacia'}"><h3>${esc(s)}</h3>${S.hc[s] ? `<ul>${S.hc[s].map((t) => `<li>${fmt(t)}</li>`).join('')}</ul>` : '<p class="vacio">—</p>'}</section>`).join('')}
      <section class="hc-sec"><h3>📝 Mis notas</h3><textarea id="notas" rows="5" placeholder="Escribe aquí tus notas o hipótesis (se guardan automáticamente)…">${esc(nota)}</textarea></section>`;
    $('#notas').addEventListener('input', (ev) => { Store.d.notas[caso.id] = ev.target.value; Store.guardar(); });
    $('#drawer').classList.add('abierto');
    $('#drawer').setAttribute('aria-hidden', 'false');
    $('#velo').hidden = false;
  }
  function cerrarHC() {
    const d = $('#drawer');
    if (!d) return;
    d.classList.remove('abierto');
    d.setAttribute('aria-hidden', 'true');
    $('#velo').hidden = true;
  }

  // ------------------------------------------------------------ FINAL
  function evaluar() {
    const f = S.flags;
    const items = caso.checklist.map((it) => {
      const sub = (it.sub || []).map((s) => ({ ...s, ok: !!f[s.flag] }));
      let nivel;
      if (it.eval) nivel = it.eval(f, S);
      else {
        const n = sub.filter((s) => s.ok).length;
        nivel = n >= it.A ? 'A' : n >= it.P ? 'P' : 'I';
        if (nivel === 'A' && it.obligatorio && it.obligatorio.some((x) => !f[x])) nivel = 'P';
      }
      const pts = nivel === 'A' ? it.peso : nivel === 'P' ? it.peso / 2 : 0;
      return { ...it, sub, nivel, pts };
    });
    const total = items.reduce((a, i) => a + i.peso, 0);
    const obt = items.reduce((a, i) => a + i.pts, 0);
    const criticos = (caso.criticos || []).filter((c) => f[c.flag]);
    const obs = (caso.observaciones || []).filter((o) => f[o.flag]);
    const bruta = (obt / total) * 10;
    const nota = Math.max(0, Math.round((bruta - criticos.length) * 10) / 10);
    return { items, nota, bruta, criticos, obs };
  }

  function terminar(motivo) {
    if (S.terminado || S.finalizando) return;
    S.finalizando = true;
    detenerTimer();
    S.motivoFin = motivo;
    const fin = caso.desenlace(S);
    const lineas = [['narrador', `**${fin.titulo}.** ${fin.texto}`]];
    const cerrar = () => {
      S.terminado = true;
      const r = evaluar();
      delete Store.d.progreso[S.caseId];
      const prev = Store.d.mejores[S.caseId];
      if (!prev || r.nota > prev.nota) Store.d.mejores[S.caseId] = { nota: r.nota, fecha: Date.now() };
      Store.d.historial.push({ caseId: S.caseId, titulo: caso.titulo, nota: r.nota, modo: S.modo, fecha: Date.now() });
      Store.d.historial = Store.d.historial.slice(-50);
      Store.guardar();
      renderResultado(r, fin);
    };
    D.cola = []; D.ocupado = false;
    S.expr = fin.tipo === 'bueno' ? 'alivio' : fin.tipo === 'malo' ? 'dolor' : 'preocupada';
    actualizarEscena();
    $('#panel').innerHTML = '<div class="pnl-cab"><span class="pnl-fase">Desenlace</span><h2>Evolución de la paciente</h2></div><div class="pnl-cuerpo"><p class="pista">Haz clic en el diálogo para ver tu evaluación.</p></div>';
    decir(lineas, cerrar);
  }

  function renderResultado(r, fin) {
    const refs = caso.referencias || {};
    const usadas = new Set();
    r.items.forEach((i) => (i.refs || []).forEach((x) => usadas.add(x)));
    r.criticos.forEach((c) => c.ref && usadas.add(c.ref));
    r.obs.forEach((o) => o.ref && usadas.add(o.ref));
    const orden = [...usadas].filter((k) => refs[k]);
    const num = (k) => orden.indexOf(k) + 1;
    const cita = (arr) => (arr || []).filter((k) => refs[k]).map((k) => `<a href="#ref-${k}" class="cita">[${num(k)}]</a>`).join('');
    const etiqueta = { A: 'Adecuado', P: 'Parcial', I: 'Inadecuado' };
    const extra = caso.extraResultado ? caso.extraResultado(S) : null;
    const clase = r.nota >= 7 ? 'aprob' : r.nota >= 5 ? 'limite' : 'reprob';
    const min = Math.floor(S.tiempo / 60), seg = S.tiempo % 60;

    $('#resultado').innerHTML = `
      <div class="res-wrap">
        <header class="res-cab">
          <div class="res-nota ${clase}"><span>${r.nota.toFixed(1)}</span><small>/ 10</small></div>
          <div>
            <div class="res-area" style="color:${caso.color}">${esc(caso.area)} · ${S.modo === 'examen' ? '⏱ Modo examen' : '📖 Modo estudio'}</div>
            <h1>${esc(caso.titulo)}</h1>
            <div class="desenlace d-${fin.tipo}"><strong>${esc(fin.titulo)}</strong><p>${fmt(fin.texto)}</p></div>
            <p class="res-meta">Tiempo clínico: ${min} h ${pad(seg)} min · Estado final de la paciente: ${S.estabilidad}% · Puntaje del checklist: ${r.bruta.toFixed(1)}${r.criticos.length ? ` − ${r.criticos.length} por errores críticos` : ''}</p>
          </div>
        </header>

        ${r.criticos.length ? `<section class="res-sec criticos"><h2>⛔ Errores críticos (−1 punto cada uno)</h2><ul>${r.criticos.map((c) => `<li>${esc(c.texto)} ${cita([c.ref])}</li>`).join('')}</ul></section>` : ''}

        <section class="res-sec"><h2>Checklist de la estación</h2>
          <div class="checklist">${r.items.map((i, n) => `
            <details class="ck ck-${i.nivel}">
              <summary><span class="ck-n">${n + 1}</span><span class="ck-txt">${esc(i.texto)}</span><span class="ck-niv">${etiqueta[i.nivel]}</span><span class="ck-pts">${i.pts.toFixed(2)} / ${i.peso.toFixed(2)}</span></summary>
              <div class="ck-cuerpo">
                ${i.sub.length ? `<ul class="ck-sub">${i.sub.map((s) => `<li class="${s.ok ? 'si' : 'no'}">${s.ok ? '✅' : '⬜'} ${esc(s.texto)}</li>`).join('')}</ul>
                  <p class="nota-peq">Adecuado: ≥ ${i.A} · Parcial: ≥ ${i.P}${i.obligatorio ? ' · con ítem obligatorio' : ''}</p>` : ''}
                <p>${fmt(i.explicacion || '')} ${cita(i.refs)}</p>
              </div>
            </details>`).join('')}
          </div>
        </section>

        ${r.obs.length ? `<section class="res-sec"><h2>💡 Observaciones (sin descuento)</h2><ul class="obs">${r.obs.map((o) => `<li>${esc(o.texto)} ${cita([o.ref])}</li>`).join('')}</ul></section>` : ''}

        ${extra ? `<section class="res-sec"><h2>${esc(extra.titulo)}</h2>${extra.html}</section>` : ''}

        <section class="res-sec"><h2>Línea de tiempo de tus acciones</h2>
          <ol class="timeline">${S.log.map((l) => `<li><span class="tl-t">+${Math.floor(l.t / 60)}h${pad(l.t % 60)}</span><span class="tl-f">${esc(caso.fases[l.fase] ? caso.fases[l.fase].titulo : '')}</span>${esc(l.texto)}</li>`).join('')}</ol>
        </section>

        ${orden.length ? `<section class="res-sec"><h2>📚 Bibliografía</h2><ol class="refs">${orden.map((k) => `<li id="ref-${k}">${esc(refs[k])}</li>`).join('')}</ol></section>` : ''}

        <div class="res-acciones">
          <button class="btn btn-prim" id="btnRepetir">↻ Repetir caso</button>
          <button class="btn btn-sec" id="btnVerHC">📋 Ver historia clínica</button>
          <button class="btn btn-sec" id="btnMenu">Menú principal</button>
        </div>
      </div>`;
    $('#btnRepetir').addEventListener('click', () => elegirModo(caso.id));
    $('#btnMenu').addEventListener('click', renderMenu);
    $('#btnVerHC').addEventListener('click', () => {
      const secs = caso.hcSecciones || Object.keys(S.hc);
      modal(`<h2>📋 Historia clínica</h2><div class="hc-modal">${secs.filter((s) => S.hc[s]).map((s) => `<section class="hc-sec"><h3>${esc(s)}</h3><ul>${S.hc[s].map((t) => `<li>${fmt(t)}</li>`).join('')}</ul></section>`).join('') || '<p>Vacía.</p>'}</div>`);
    });
    mostrar('resultado');
  }

  // ------------------------------------------------------------ MODALES
  function modal(html, alMontar) {
    const cap = document.createElement('div');
    cap.className = 'modal-capa';
    cap.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><button class="btn-ico modal-x" aria-label="Cerrar">✕</button>${html}</div>`;
    document.body.appendChild(cap);
    const cerrar = () => cap.remove();
    cap.addEventListener('click', (e) => { if (e.target === cap) cerrar(); });
    cap.querySelector('.modal-x').addEventListener('click', cerrar);
    if (alMontar) alMontar(cap.querySelector('.modal'), cerrar);
    const foco = cap.querySelector('button:not(.modal-x)') || cap.querySelector('button');
    if (foco) foco.focus();
  }

  function confirmar(msg, si) {
    modal(`<p class="conf-msg">${esc(msg)}</p><div class="conf-btns"><button class="btn btn-sec" data-no>Cancelar</button><button class="btn btn-prim" data-si>Sí, continuar</button></div>`, (box, cerrar) => {
      box.querySelector('[data-no]').addEventListener('click', cerrar);
      box.querySelector('[data-si]').addEventListener('click', () => { cerrar(); si(); });
    });
  }

  // ------------------------------------------------------------ ARRANQUE
  Store.cargar();
  document.addEventListener('DOMContentLoaded', renderMenu);
  // Exponer para depuración / pruebas
  window.SimClin = { get estado() { return S; }, get caso() { return caso; }, evaluar: () => evaluar() };
})();
