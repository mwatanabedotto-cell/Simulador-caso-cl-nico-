/*
 * Simulador de Consulta Clínica — motor de novela visual (pixel art)
 * Sin dependencias. Gráficos en js/pixel.js. Casos en window.CASOS (js/casos/).
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
  const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`);
  const PX = () => window.Pixel;
  const nombrePos = (k) => (PX().POSES[k] || {}).nombre || k;

  // ------------------------------------------------------------ almacenamiento
  const CLAVE = 'simclin:v1';
  const Store = {
    d: { progreso: {}, mejores: {}, notas: {}, historial: [] },
    cargar() {
      try { const raw = localStorage.getItem(CLAVE); if (raw) Object.assign(this.d, JSON.parse(raw)); } catch (e) { /* sin almacenamiento */ }
    },
    guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(this.d)); } catch (e) { /* noop */ } },
  };

  // ------------------------------------------------------------ estado
  let caso = null;
  let S = null;
  let timerId = null, zoomId = null;
  const D = { cola: [], ocupado: false, escribiendo: null, textoCompleto: '' };
  let hcVistas = 0;

  const casoPorId = (id) => (window.CASOS || []).find((c) => c.id === id);

  function nuevoEstado(c, modo) {
    return {
      caseId: c.id, modo, fase: -1, paso: 0, flags: {}, usados: {}, hc: {}, hcTotal: 0,
      tiempo: 0, estabilidad: 100, log: [], expr: c.exprInicial || 'neutral', monitor: null,
      pos: c.posInicial || 'sedestacion', posManual: modo === 'examen', vista: null, examenesPos: [],
      restante: modo === 'examen' ? c.duracionExamen || 600 : null,
      terminado: false, motivoFin: null, faseIntroVista: {}, inicio: Date.now(),
    };
  }
  function completarEstado(s) { // partidas guardadas con versiones anteriores
    s.pos = s.pos || caso.posInicial || 'sedestacion';
    if (s.posManual == null) s.posManual = s.modo === 'examen';
    s.examenesPos = s.examenesPos || [];
    return s;
  }
  const palPaciente = () => ({ coleta: true, manoAbd: true, ...(caso.paciente.pixel || {}) });
  // Lugar de la escena: consultorio (conversación) o box (examen físico)
  function lugarActual() {
    if (S.lugarFinal) return S.lugarFinal;
    const f = caso.fases[S.fase];
    return (f && f.escena) || 'consultorio';
  }

  // ============================================================ PANTALLAS
  function mostrar(id) {
    document.querySelectorAll('.pantalla').forEach((p) => p.classList.toggle('activa', p.id === id));
    window.scrollTo(0, 0);
  }

  // ------------------------------------------------------------ MENÚ
  function renderMenu() {
    detenerTimer(); detenerZoom();
    const casos = window.CASOS || [];
    const proximos = window.CASOS_PROXIMOS || [];
    const hist = Store.d.historial.slice(-5).reverse();
    $('#menu').innerHTML = `
      <div class="menu-wrap">
        <header class="menu-hero">
          <canvas id="cvHero" class="px" width="320" height="180" aria-hidden="true"></canvas>
          <div class="hero-txt">
            <h1>Simulador de Consulta Clínica</h1>
            <p>Atiende pacientes desde los ojos del médico: anamnesis, exploración física en cada posición anatómica, hoja de solicitud de exámenes, diagnóstico y decisiones. Al final recibes un checklist al estilo de la prueba práctica del Revalida.</p>
            <button class="btn btn-sec" id="btnAtlas">🧍 Atlas de posiciones</button>
          </div>
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
                ${mejor ? `<span class="chip chip-ok">Mejor: ${mejor.nota.toFixed(1)}</span>` : '<span class="chip">Sin jugar</span>'}
              </div>
              <div class="card-acciones">
                ${prog ? `<button class="btn btn-prim" data-continuar="${c.id}">▶ Continuar</button><button class="btn btn-sec" data-jugar="${c.id}">Nueva</button>`
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
    const c0 = casos[0];
    if (c0 && PX()) {
      caso = c0;
      PX().escena($('#cvHero'), { lugar: 'consultorio', pal: palPaciente(), expr: 'preocupada', hora: c0.horaLlegada });
    }
    $('#btnAtlas').addEventListener('click', abrirAtlas);
    $('#menu').querySelectorAll('[data-jugar]').forEach((b) => b.addEventListener('click', () => elegirModo(b.dataset.jugar)));
    $('#menu').querySelectorAll('[data-continuar]').forEach((b) => b.addEventListener('click', () => continuarCaso(b.dataset.continuar)));
    mostrar('menu');
  }

  function abrirAtlas() {
    const usos = {};
    (window.CASOS || []).forEach((c) => c.fases.forEach((f) => (f.grupos || []).forEach((g) => g.opciones.forEach((o) => {
      if (o.posicion) (usos[o.posicion] = usos[o.posicion] || []).push(plano(o.texto));
    }))));
    const P = PX().POSES;
    modal(`<h2>🧍 Atlas de posiciones anatómicas</h2>
      <div class="atlas">${Object.keys(P).map((k) => `<figure class="atlas-item">
        <canvas class="px" width="320" height="180" data-atlas="${k}"></canvas>
        <figcaption><strong>${esc(P[k].nombre)}</strong><span>${esc(P[k].desc)}</span>
        ${usos[k] ? `<em>En el caso: ${usos[k].map(esc).join(' · ')}</em>` : ''}</figcaption></figure>`).join('')}</div>`, (box) => {
      const pal = palPaciente();
      box.querySelectorAll('[data-atlas]').forEach((cv) => PX().escena(cv, { lugar: 'box', pose: cv.dataset.atlas, pal: { ...pal, manoAbd: false }, expr: 'neutral' }));
    }, 'modal-ancho');
  }

  function elegirModo(id) {
    const c = casoPorId(id);
    modal(`
      <h2>${esc(c.titulo)}</h2>
      <p>Elige el modo de juego:</p>
      <div class="modos">
        <button class="modo" data-modo="estudio"><span class="modo-ico">📖</span><strong>Estudio</strong><span>Sin reloj. La paciente se coloca sola en cada posición (puedes activar el desafío).</span></button>
        <button class="modo" data-modo="examen"><span class="modo-ico">⏱</span><strong>Examen</strong><span>${Math.round((c.duracionExamen || 600) / 60)} minutos reales, como la estación del PEP. Tú eliges la posición de la paciente.</span></button>
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
    completarEstado(S);
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
          <div class="ind" title="Hora clínica y tiempo desde la llegada"><span class="ind-lbl">Reloj</span><span id="reloj" class="ind-val"></span></div>
          <div class="ind"><span class="ind-lbl">Paciente</span><div class="barra"><div id="barraEstab"></div></div></div>
          ${S.modo === 'examen' ? '<div class="ind ind-timer"><span class="ind-lbl">Examen</span><span id="timer" class="ind-val"></span></div>' : ''}
        </div>
        <button class="btn-ico btn-hc" id="btnHC" title="Historia clínica" aria-label="Abrir historia clínica">📋<span id="hcBadge" class="badge" hidden></span></button>
      </header>
      <main class="stage">
        <section class="escena-col">
          <div class="escena" id="escena">
            <canvas id="cvEscena" class="px" width="320" height="180" aria-label="Escena del box de urgencias"></canvas>
            <div class="esc-chip" id="escChip"></div>
            <figure class="zoom" id="zoom" hidden><canvas id="cvZoom" class="px" width="64" height="48"></canvas><figcaption id="zoomTxt"></figcaption></figure>
            <div class="monitor" id="monitor" hidden></div>
          </div>
          <div class="dialogo" id="dialogo" tabindex="0" role="button" aria-live="polite">
            <canvas id="cvRetrato" class="px retrato" width="64" height="64" aria-hidden="true"></canvas>
            <div class="dlg-cuerpo">
              <div class="dlg-nombre" id="dlgNombre"></div>
              <div class="dlg-texto" id="dlgTexto"></div>
              <div class="dlg-reporte" id="dlgReporte" hidden></div>
            </div>
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
    PX().retrato($('#cvRetrato'), 'narrador', 'neutral', palPaciente());
    actualizarEscena();
    actualizarTopbar();
    iniciarTimer();
  }

  function enExploracion() { const f = caso.fases[S.fase]; return !!(f && f.posiciones); }

  function actualizarEscena() {
    const cv = $('#cvEscena');
    if (!cv) return;
    const v = S.vista && S.vista.pose === S.pos ? S.vista : null;
    const [h0, m0] = caso.horaLlegada || [8, 0];
    const tot = h0 * 60 + m0 + S.tiempo;
    PX().escena(cv, {
      lugar: lugarActual(), pose: S.pos, variante: v && v.variante, accesorio: v && v.accesorio, marca: v && v.marca,
      pal: palPaciente(), expr: S.expr, hora: [Math.floor(tot / 60) % 24, tot % 60],
      enfermera: enExploracion() && S.flags.ef_chaperona, suero: !!S.flags.i_hidratacion,
    });
    const box = lugarActual() === 'box';
    $('#escChip').hidden = !box;
    $('#escChip').innerHTML = `<span>🛏 ${esc(nombrePos(S.pos))}</span>${v && v.titulo ? `<span class="chip-man">✋ ${esc(v.titulo)}</span>` : ''}`;
    // zoom de la maniobra
    detenerZoom();
    const z = $('#zoom');
    if (box && v && v.zoom) {
      z.hidden = false;
      $('#zoomTxt').textContent = v.zoomTxt || '';
      let on = true;
      const dib = () => { PX().zoom($('#cvZoom'), { tipo: v.zoom, zona: v.zona, pal: palPaciente() }, on); on = !on; };
      dib();
      zoomId = setInterval(() => { if (!$('#cvZoom')) return detenerZoom(); dib(); }, 480);
    } else z.hidden = true;
    // monitor
    const m = $('#monitor');
    if (S.monitor && box) {
      m.hidden = false;
      const s = S.monitor;
      m.innerHTML = `<div class="mon-fila mon-fc"><span>FC</span><b>${s.FC}</b></div>
        <svg class="mon-ecg" viewBox="0 0 60 12" aria-hidden="true"><path d="M0 6 H10 L12 2 L14 10 L16 6 H30 L32 2 L34 10 L36 6 H60"/></svg>
        <div class="mon-fila mon-pa"><span>PA</span><b>${s.PA}</b></div>
        <div class="mon-fila mon-sat"><span>SpO₂</span><b>${s.SpO2}%</b></div>
        <div class="mon-fila mon-t"><span>T°</span><b>${s.T}</b></div>
        <div class="mon-fila mon-fr"><span>FR</span><b>${s.FR}</b></div>`;
    } else m.hidden = true;
  }
  function detenerZoom() { if (zoomId) clearInterval(zoomId); zoomId = null; }

  function actualizarTopbar() {
    const st = $('#stepper');
    if (!st) return;
    st.innerHTML = caso.fases.map((f, i) => `<li class="${i < S.fase ? 'hecha' : i === S.fase ? 'actual' : ''}" title="${esc(f.titulo)}"><span class="st-num">${i + 1}</span><span class="st-txt">${esc(f.titulo)}</span></li>`).join('');
    const [h0, m0] = caso.horaLlegada || [8, 0];
    const tot = h0 * 60 + m0 + S.tiempo;
    $('#reloj').textContent = `${pad(Math.floor(tot / 60) % 24)}:${pad(tot % 60)} +${Math.floor(S.tiempo / 60)}h${pad(S.tiempo % 60)}`;
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

  // ------------------------------------------------------------ TEMPORIZADOR
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
  const normalizarLinea = (l) => (Array.isArray(l) ? { quien: l[0], texto: l[1], expr: l[2] } : l);

  function decir(lineas, alTerminar) {
    (lineas || []).forEach((l) => D.cola.push(normalizarLinea(l)));
    if (alTerminar) D.cola.push({ fn: alTerminar });
    if (!D.ocupado) { D.ocupado = true; bloquearPanel(true); siguienteLinea(); }
  }

  function htmlReporte(rep) {
    return `<div class="rep-titulo">${esc(rep.titulo)}</div>` + (rep.filas
      ? `<table class="tabla tabla-lab"><thead><tr><th>Parámetro</th><th>Resultado</th><th>Referencia</th></tr></thead><tbody>${rep.filas.map((f) => `<tr class="${f[3] ? 'alterado' : ''}"><td>${esc(f[0])}</td><td>${esc(f[1])}${f[3] ? ' ↑' : ''}</td><td>${esc(f[2])}</td></tr>`).join('')}</tbody></table>`
      : `<p>${fmt(rep.texto)}</p>`);
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
    if (l.expr && l.expr !== S.expr) { S.expr = l.expr; actualizarEscena(); }
    const ret = $('#cvRetrato');
    PX().retrato(ret, l.quien, S.expr, palPaciente());
    if (l.quien === 'paciente' && (S.expr === 'dolor' || S.expr === 'sorpresa')) { ret.classList.remove('sacudir'); void ret.offsetWidth; ret.classList.add('sacudir'); }
    const rep = $('#dlgReporte');
    if (l.reporte) { rep.hidden = false; rep.innerHTML = htmlReporte(l.reporte); } else { rep.hidden = true; rep.innerHTML = ''; }
    escribir(l.texto);
    $('#dlgSig').hidden = false;
  }

  function escribir(texto) {
    const nodo = $('#dlgTexto');
    const html = fmt(texto);
    D.textoCompleto = html;
    if (D.escribiendo) clearInterval(D.escribiendo);
    const limpio = plano(texto);
    const reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducido) { nodo.innerHTML = html; D.escribiendo = null; return; }
    let i = 0;
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

  function bloquearPanel(b) { const p = $('#panel'); if (p) p.classList.toggle('bloqueado', b); }

  document.addEventListener('keydown', (ev) => {
    if (!$('#juego').classList.contains('activa')) return;
    if (ev.target.closest('textarea, input') || document.querySelector('.modal-capa')) return;
    if (ev.key === ' ' || ev.key === 'Enter') { if (D.ocupado) { ev.preventDefault(); avanzarDialogo(); } }
    if (ev.key === 'Escape') cerrarHC();
  });

  // ------------------------------------------------------------ EFECTOS
  const api = {
    addHC(seccion, texto) { (S.hc[seccion] = S.hc[seccion] || []).push(texto); S.hcTotal++; },
    monitor(v) { S.monitor = v; },
  };

  function aplicar(op, opts = {}) {
    const extra = [];
    (op.flags || []).forEach((f) => { S.flags[f] = true; });
    if (op.hc) api.addHC(op.hc[0], op.hc[1]);
    if (op.estabilidad) S.estabilidad = clamp(S.estabilidad + op.estabilidad, 0, 100);
    if (op.efecto) { const r = op.efecto(S, api); if (Array.isArray(r)) extra.push(...r); }
    if (op.tiempo && !opts.sinTiempo) S.tiempo += op.tiempo;
    S.log.push({ t: S.tiempo, fase: S.fase, texto: plano(op.texto) });
    const base = typeof op.lineas === 'function' ? op.lineas(S) : op.lineas || [];
    return [...base, ...extra, ...(opts.sinProgresion ? [] : chequearProgresion())];
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

  // ------------------------------------------------------------ PANEL
  function renderPanel() {
    if (!S || S.terminado) return;
    actualizarTopbar();
    const p = $('#panel');
    p.classList.toggle('bloqueado', D.ocupado);

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
        <div class="pnl-pie"><button class="btn btn-prim btn-ancho" id="btnComenzar">Comenzar la consulta ▶</button></div>`;
      $('#btnComenzar').addEventListener('click', () => irAFase(0));
      return;
    }

    const fase = caso.fases[S.fase];
    const cab = `<div class="pnl-cab"><span class="pnl-fase">Fase ${S.fase + 1} de ${caso.fases.length}</span><h2>${esc(fase.titulo)}</h2>${fase.ayuda ? `<p class="pnl-ayuda">${esc(fase.ayuda)}</p>` : ''}</div>`;
    const pieSig = (txt) => `<div class="pnl-pie"><span class="pie-info">${txt || ''}</span><button class="btn btn-prim" id="btnSigFase">${S.fase === caso.fases.length - 1 ? 'Finalizar' : 'Siguiente fase ▶'}</button></div>`;
    const enlazarSig = () => $('#btnSigFase').addEventListener('click', () => {
      if (D.ocupado) return;
      const sig = caso.fases[S.fase + 1];
      confirmar(`¿Terminar «${fase.titulo}»${sig ? ` y pasar a «${sig.titulo}»` : ''}? No podrás volver a esta fase.`, () => irAFase(S.fase + 1));
    });

    // ---------- fase de acciones (anamnesis, exploración)
    if (fase.tipo === 'acciones') {
      const grupos = fase.grupos.filter((g) => !g.requiere || S.flags[g.requiere]);
      const ocultos = fase.grupos.length - grupos.length;
      const usadosFase = fase.grupos.reduce((a, g) => a + g.opciones.filter((o) => S.usados[o.id]).length, 0);
      const P = PX().POSES;
      const posHTML = fase.posiciones ? `<div class="poses-box">
          <div class="poses-cab"><span>Posición de la paciente</span>
            ${S.modo === 'estudio' ? `<label class="toggle"><input type="checkbox" id="tgManual" ${S.posManual ? 'checked' : ''}><span>Desafío</span></label>` : '<span class="chip">Desafío</span>'}
          </div>
          <div class="poses">${Object.keys(P).map((k) => `<button class="pose ${S.pos === k ? 'activa' : ''}" data-pose="${k}" title="${esc(P[k].nombre)}: ${esc(P[k].desc)}"><canvas class="px" width="160" height="90" data-th="${k}"></canvas><span>${esc(P[k].corto)}</span></button>`).join('')}</div>
          <p class="pista">${S.posManual ? '🎯 Coloca tú a la paciente en la posición correcta antes de cada maniobra.' : '🤖 La paciente se coloca sola en la posición de cada maniobra. Activa «Desafío» para hacerlo tú.'}</p>
        </div>` : '';
      p.innerHTML = cab + `<div class="pnl-cuerpo">${posHTML}
        ${grupos.map((g) => `<details class="grupo" open><summary>${esc(g.titulo)} <span class="cnt">${g.opciones.filter((o) => S.usados[o.id]).length}/${g.opciones.length}</span></summary>
          <div class="opciones">${g.opciones.map((o) => `<button class="op ${S.usados[o.id] ? 'usada' : ''}" data-op="${o.id}" ${S.usados[o.id] ? 'disabled' : ''}>
              <span class="op-txt">${fmt(o.texto)}${o.posicion && !S.posManual ? `<small class="op-pos">🛏 ${esc(P[o.posicion].corto)}</small>` : ''}</span>${o.tiempo ? `<span class="op-t">${dur(o.tiempo)}</span>` : ''}</button>`).join('')}</div></details>`).join('')}
        ${ocultos ? `<p class="pista">🔒 ${ocultos} grupo(s) más se desbloquearán según lo que preguntes.</p>` : ''}
        </div>` + pieSig(`${usadosFase} acción(es)`);
      p.querySelectorAll('[data-op]').forEach((b) => b.addEventListener('click', () => {
        if (D.ocupado) return;
        usarOpcion(fase.grupos.flatMap((g) => g.opciones).find((o) => o.id === b.dataset.op));
      }));
      if (fase.posiciones) {
        const pal = { ...palPaciente(), manoAbd: false };
        p.querySelectorAll('[data-th]').forEach((cv) => PX().miniatura(cv, cv.dataset.th, pal, S.expr));
        p.querySelectorAll('[data-pose]').forEach((b) => b.addEventListener('click', () => cambiarPos(b.dataset.pose)));
        const tg = $('#tgManual');
        if (tg) tg.addEventListener('change', () => { S.posManual = tg.checked; guardar(); renderPanel(); });
      }
      enlazarSig();
      return;
    }

    // ---------- hoja de solicitud de exámenes
    if (fase.tipo === 'solicitud') {
      const todas = fase.secciones.flatMap((s) => s.opciones);
      const pedidas = todas.filter((o) => S.usados[o.id]);
      p.innerHTML = cab + `<div class="pnl-cuerpo">
          <button class="hoja-mini" id="btnHoja">
            <span class="hm-papel"><span></span><span></span><span></span><span></span></span>
            <span class="hm-txt"><strong>${pedidas.length ? 'Nueva hoja de solicitud' : 'Llenar la hoja de solicitud'}</strong><small>Marca los exámenes, firma y envía.</small></span>
          </button>
          <h3 class="sub">Resultados recibidos (${pedidas.length})</h3>
          ${pedidas.length ? `<ul class="resultados">${pedidas.map((o) => `<li><span>${esc(o.texto)}</span>${reporteDe(o) ? `<button class="btn-mini" data-ver="${o.id}">Ver</button>` : '<em>sin informe</em>'}</li>`).join('')}</ul>`
            : '<p class="pista">Todavía no solicitaste ningún examen.</p>'}
        </div>` + pieSig(`${(S.hojas || 0)} hoja(s) enviada(s)`);
      $('#btnHoja').addEventListener('click', () => { if (!D.ocupado) abrirHoja(fase); });
      p.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => {
        const o = todas.find((x) => x.id === b.dataset.ver);
        modal(`<div class="informe">${htmlReporte(reporteDe(o))}</div>`);
      }));
      enlazarSig();
      return;
    }

    // ---------- fase de pasos (diagnóstico, decisiones)
    if (fase.tipo === 'pasos') {
      while (S.paso < fase.pasos.length && fase.pasos[S.paso].saltarSi && S.flags[fase.pasos[S.paso].saltarSi]) S.paso++;
      if (S.paso >= fase.pasos.length) {
        p.innerHTML = cab + `<div class="pnl-cuerpo"><div class="tarjeta-escenario"><p>✅ Fase completada.</p></div></div>
          <div class="pnl-pie"><button class="btn btn-prim btn-ancho" id="btnSigFase">${S.fase === caso.fases.length - 1 ? 'Ver resultado ▶' : 'Siguiente fase ▶'}</button></div>`;
        $('#btnSigFase').addEventListener('click', () => { if (!D.ocupado) irAFase(S.fase + 1); });
        return;
      }
      const paso = fase.pasos[S.paso];
      const multi = paso.tipo === 'multiple';
      p.innerHTML = cab + `<div class="pnl-cuerpo">
          <div class="paso-prog">Pregunta ${S.paso + 1} de ${fase.pasos.length}</div>
          <h3 class="paso-preg">${fmt(paso.pregunta)}</h3>
          <form class="paso-form" id="pasoForm">${paso.opciones.map((o) => `<label class="sel"><input type="${multi ? 'checkbox' : 'radio'}" name="op" value="${o.id}"><span>${fmt(o.texto)}</span></label>`).join('')}</form>
          ${multi && paso.max ? `<p class="pista">Máximo ${paso.max}.</p>` : ''}
        </div>
        <div class="pnl-pie"><button class="btn btn-prim btn-ancho" id="btnConfirmar" disabled>Confirmar</button></div>`;
      const form = $('#pasoForm');
      const btn = $('#btnConfirmar');
      form.addEventListener('change', () => {
        const sel = [...form.querySelectorAll('input:checked')];
        if (multi && paso.max && sel.length > paso.max) sel[sel.length - 1].checked = false;
        btn.disabled = form.querySelectorAll('input:checked').length === 0;
      });
      btn.addEventListener('click', () => {
        if (D.ocupado) return;
        confirmarPaso(fase, paso, [...form.querySelectorAll('input:checked')].map((i) => i.value));
      });
    }
  }

  // ------------------------------------------------------------ posiciones
  function cambiarPos(k) {
    if (D.ocupado || S.pos === k) return;
    S.pos = k;
    S.vista = null;
    S.tiempo += 1;
    S.log.push({ t: S.tiempo, fase: S.fase, texto: `Posición: ${nombrePos(k)}` });
    trasAccion();
  }

  function usarOpcion(op) {
    if (!op || S.usados[op.id]) return;
    const pre = [];
    if (op.posicion) {
      if (S.pos !== op.posicion) {
        if (S.posManual) {
          S.flags.pos_errores = (S.flags.pos_errores || 0) + 1;
          const linea = `No puedes realizar «${plano(op.texto)}» con la paciente en **${nombrePos(S.pos).toLowerCase()}**.` +
            (S.modo === 'estudio' ? ` Pista: se realiza en **${nombrePos(op.posicion).toLowerCase()}**.` : ' Cambia su posición en el panel.');
          decir([['narrador', linea]], trasAccion);
          return;
        }
        S.pos = op.posicion;
        pre.push(['narrador', `Colocas a la paciente en **${nombrePos(op.posicion).toLowerCase()}**.`]);
      } else if (S.posManual) S.flags.pos_aciertos = (S.flags.pos_aciertos || 0) + 1;
      S.examenesPos.push({ texto: plano(op.texto), pos: op.posicion });
    }
    S.vista = op.vista ? { ...op.vista, pose: op.posicion || S.pos, titulo: op.vista.titulo || plano(op.texto) } : (op.posicion ? { pose: op.posicion } : null);
    S.usados[op.id] = true;
    const lineas = pre.concat(aplicar(op));
    actualizarEscena();
    guardar();
    renderPanel();
    decir(lineas, trasAccion);
  }

  // ------------------------------------------------------------ hoja de solicitud
  function reporteDe(o) {
    if (!Array.isArray(o.lineas)) return null;
    const l = o.lineas.find((x) => x && x.reporte);
    return l ? l.reporte : null;
  }

  function abrirHoja(fase) {
    const [h0, m0] = caso.horaLlegada || [8, 0];
    const tot = h0 * 60 + m0 + S.tiempo;
    const pac = caso.paciente;
    modal(`<div class="hoja">
        <div class="hoja-cab">
          <div class="hoja-inst"><strong>${esc(fase.institucion || 'HOSPITAL GENERAL')}</strong><span>${esc(fase.servicio || 'Servicio de Urgencias')}</span></div>
          <div class="hoja-tit">SOLICITUD DE EXÁMENES<br>COMPLEMENTARIOS</div>
        </div>
        <div class="hoja-datos">
          <span>Paciente: <b>${esc(pac.nombreCompleto || pac.nombre)}</b></span>
          <span>Edad: <b>${pac.edad} años</b></span><span>Sexo: <b>${esc(pac.sexo || '')}</b></span>
          <span>Fecha/hora: <b>${pad(Math.floor(tot / 60) % 24)}:${pad(tot % 60)}</b></span><span>${esc(fase.ubicacion || '')}</span>
        </div>
        <label class="hoja-dx">Diagnóstico presuntivo:<input id="hojaDx" type="text" maxlength="90" autocomplete="off" placeholder="(opcional)"></label>
        <div class="hoja-grid">${fase.secciones.map((s) => `<fieldset><legend>${esc(s.titulo)}</legend>${s.opciones.map((o) => `
          <label class="hoja-item ${S.usados[o.id] ? 'pedido' : ''}"><input type="checkbox" value="${o.id}" ${S.usados[o.id] ? 'checked disabled' : ''}><span class="caja" aria-hidden="true"></span><span class="hi-txt">${esc(o.texto)}</span>${S.usados[o.id] ? '<em>ya pedido</em>' : `<small>${dur(o.tiempo || 0)}</small>`}</label>`).join('')}</fieldset>`).join('')}
        </div>
        <div class="hoja-pie">
          <div class="firma"><span class="firma-linea" id="firma"></span><small>Firma y sello del médico</small></div>
          <div class="hoja-btns"><button class="btn btn-sec" data-no>Cancelar</button><button class="btn btn-prim" data-enviar disabled>✍ Firmar y enviar</button></div>
        </div>
      </div>`, (box, cerrar) => {
      const enviar = box.querySelector('[data-enviar]');
      const sel = () => [...box.querySelectorAll('.hoja-item input:checked:not(:disabled)')].map((i) => i.value);
      box.addEventListener('change', () => {
        const n = sel().length;
        enviar.disabled = n === 0;
        enviar.textContent = n ? `✍ Firmar y enviar (${n})` : '✍ Firmar y enviar';
      });
      box.querySelector('[data-no]').addEventListener('click', cerrar);
      enviar.addEventListener('click', () => {
        const ids = sel();
        if (!ids.length) return;
        const dx = box.querySelector('#hojaDx').value.trim();
        box.querySelector('#firma').textContent = 'Dr(a). de guardia';
        box.classList.add('firmada');
        setTimeout(() => { cerrar(); procesarSolicitud(fase, ids, dx); }, 550);
      });
    }, 'modal-hoja');
  }

  function procesarSolicitud(fase, ids, dx) {
    const ops = fase.secciones.flatMap((s) => s.opciones).filter((o) => ids.includes(o.id));
    const tmax = Math.max(0, ...ops.map((o) => o.tiempo || 0));
    S.hojas = (S.hojas || 0) + 1;
    if (dx) { api.addHC('Impresión diagnóstica', `Diagnóstico presuntivo (hoja de solicitud): ${dx}`); S.flags.hoja_dx = true; }
    let resultados = [];
    ops.forEach((o) => { S.usados[o.id] = true; resultados = resultados.concat(aplicar(o, { sinTiempo: true, sinProgresion: true })); });
    S.tiempo += tmax;
    S.vista = null;
    const lineas = [
      ['enfermera', fase.textoEnvio || 'Recibí la solicitud, Doc. Ya tomo las muestras y aviso a imagen.'],
      ['narrador', `Solicitaste ${ops.length} examen(es): ${ops.map((o) => plano(o.texto)).join(', ')}. ⏳ Pasan ${dur(tmax)}…`],
      ...resultados, ...chequearProgresion(),
    ];
    guardar();
    renderPanel();
    decir(lineas, trasAccion);
  }

  // ------------------------------------------------------------ pasos
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
    S.vista = null;
    const f = caso.fases[n];
    if (f.posInicial) S.pos = f.posInicial;
    guardar();
    actualizarEscena();
    renderPanel();
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
    const validos = items.filter((i) => i.nivel !== 'NA');
    const total = validos.reduce((a, i) => a + i.peso, 0);
    const obt = validos.reduce((a, i) => a + i.pts, 0);
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
    const cerrar = () => {
      S.terminado = true;
      detenerZoom();
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
    S.pos = 'supino';
    S.lugarFinal = fin.tipo === 'bueno' ? 'consultorio' : 'box';
    S.vista = null;
    actualizarEscena();
    $('#panel').innerHTML = '<div class="pnl-cab"><span class="pnl-fase">Desenlace</span><h2>Evolución de la paciente</h2></div><div class="pnl-cuerpo"><p class="pista">Haz clic en el diálogo para ver tu evaluación.</p></div>';
    decir([['narrador', `**${fin.titulo}.** ${fin.texto}`]], cerrar);
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
    const etiqueta = { A: 'Adecuado', P: 'Parcial', I: 'Inadecuado', NA: 'No evaluado' };
    const extra = caso.extraResultado ? caso.extraResultado(S) : null;
    const clase = r.nota >= 7 ? 'aprob' : r.nota >= 5 ? 'limite' : 'reprob';
    const min = Math.floor(S.tiempo / 60), seg = S.tiempo % 60;
    const P = PX().POSES;
    // Tabla de exámenes y posiciones (todas las maniobras del caso)
    const maniobras = [];
    caso.fases.forEach((f) => (f.grupos || []).forEach((g) => g.opciones.forEach((o) => { if (o.posicion) maniobras.push(o); })));

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
              <summary><span class="ck-n">${n + 1}</span><span class="ck-txt">${esc(i.texto)}</span><span class="ck-niv">${etiqueta[i.nivel]}</span><span class="ck-pts">${i.nivel === 'NA' ? '—' : `${i.pts.toFixed(2)} / ${i.peso.toFixed(2)}`}</span></summary>
              <div class="ck-cuerpo">
                ${i.sub.length ? `<ul class="ck-sub">${i.sub.map((s) => `<li class="${s.ok ? 'si' : 'no'}">${s.ok ? '✅' : '⬜'} ${esc(s.texto)}</li>`).join('')}</ul>
                  <p class="nota-peq">Adecuado: ≥ ${i.A} · Parcial: ≥ ${i.P}${i.obligatorio ? ' · con ítem obligatorio' : ''}</p>` : ''}
                <p>${fmt(i.explicacion || '')} ${cita(i.refs)}</p>
              </div>
            </details>`).join('')}
          </div>
        </section>

        ${r.obs.length ? `<section class="res-sec"><h2>💡 Observaciones (sin descuento)</h2><ul class="obs">${r.obs.map((o) => `<li>${esc(o.texto)} ${cita([o.ref])}</li>`).join('')}</ul></section>` : ''}

        ${maniobras.length ? `<section class="res-sec"><h2>🛏 Maniobras y su posición anatómica</h2>
          ${S.posManual ? `<p class="nota-peq">Modo desafío · aciertos: ${S.flags.pos_aciertos || 0} · intentos en posición incorrecta: ${S.flags.pos_errores || 0}</p>` : ''}
          <table class="tabla"><thead><tr><th>Maniobra / examen</th><th>Posición</th><th>¿La hiciste?</th></tr></thead><tbody>
          ${maniobras.map((o) => `<tr><td>${esc(plano(o.texto))}</td><td>${esc(P[o.posicion].nombre)}</td><td>${S.usados[o.id] ? '✅' : '—'}</td></tr>`).join('')}
          </tbody></table></section>` : ''}

        ${extra ? `<section class="res-sec"><h2>${esc(extra.titulo)}</h2>${extra.html}</section>` : ''}

        <section class="res-sec"><h2>Línea de tiempo de tus acciones</h2>
          <ol class="timeline">${S.log.map((l) => `<li><span class="tl-t">+${Math.floor(l.t / 60)}h${pad(l.t % 60)}</span><span class="tl-f">${esc(caso.fases[l.fase] ? caso.fases[l.fase].titulo : '')}</span>${esc(l.texto)}</li>`).join('')}</ol>
        </section>

        ${orden.length ? `<section class="res-sec"><h2>📚 Bibliografía</h2><ol class="refs">${orden.map((k) => `<li id="ref-${k}">${esc(refs[k])}</li>`).join('')}</ol></section>` : ''}

        <div class="res-acciones">
          <button class="btn btn-prim" id="btnRepetir">↻ Repetir caso</button>
          <button class="btn btn-sec" id="btnVerHC">📋 Historia clínica</button>
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
  function modal(html, alMontar, clase = '') {
    const cap = document.createElement('div');
    cap.className = 'modal-capa';
    cap.innerHTML = `<div class="modal ${clase}" role="dialog" aria-modal="true"><button class="btn-ico modal-x" aria-label="Cerrar">✕</button>${html}</div>`;
    document.body.appendChild(cap);
    const cerrar = () => cap.remove();
    cap.addEventListener('click', (e) => { if (e.target === cap) cerrar(); });
    cap.querySelector('.modal-x').addEventListener('click', cerrar);
    const onKey = (e) => { if (e.key === 'Escape' && document.body.contains(cap)) { cerrar(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
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
  window.SimClin = { get estado() { return S; }, get caso() { return caso; }, evaluar: () => evaluar() };
})();
