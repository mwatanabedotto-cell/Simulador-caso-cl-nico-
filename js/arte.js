/*
 * Motor gráfico estilo cómic (ilustración educativa).
 * Dibujo vectorial en canvas a alta resolución: contornos de tinta limpios, colores planos
 * vibrantes con una sombra, tramas de puntos y fondos claros. Las coordenadas lógicas son
 * 320×180 (escenas); internamente se dibuja a S× para que las líneas sean nítidas.
 */
(function () {
  'use strict';

  const W = 320, H = 180;
  const S = 4; // píxeles reales por unidad lógica
  const R = (v) => v;
  const TINTA = '#141414';

  // ------------------------------------------------------------ primitivas vectoriales
  function preparar(c, w, h) { if (c.width !== w * S || c.height !== h * S) { c.width = w * S; c.height = h * S; } }
  function lienzo(w, h) { const c = document.createElement('canvas'); c.width = w * S; c.height = h * S; return c; }
  function ctx(c) { const g = c.getContext('2d'); g.setTransform(S, 0, 0, S, 0, 0); g.imageSmoothingEnabled = true; g.lineCap = 'round'; g.lineJoin = 'round'; return g; }
  function rect(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
  function px(g, x, y, col) { g.fillStyle = col; g.beginPath(); g.arc(x + 0.5, y + 0.5, 0.7, 0, 7); g.fill(); }
  function elipse(g, cx, cy, rx, ry, col) { g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, Math.max(0.3, rx + 0.5), Math.max(0.3, ry + 0.5), 0, 0, Math.PI * 2); g.fill(); }
  const disco = (g, cx, cy, r, col) => elipse(g, cx, cy, r, r, col);
  function capsula(g, x1, y1, x2, y2, r, col) { g.strokeStyle = col; g.lineWidth = 2 * r + 1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 + 0.001, y2); g.stroke(); }
  function poli(g, pts, col) { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); }
  function linea(g, x1, y1, x2, y2, col, w = 0.9) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  function punteada(g, x1, y1, x2, y2, col, paso = 2) { g.save(); g.setLineDash([1.2, paso]); linea(g, x1, y1, x2, y2, col, 0.9); g.restore(); }
  function curva(g, pts, col, w) {
    g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 3) g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
    else g.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
    g.stroke();
  }
  // Contorno de tinta alrededor de todo lo dibujado en la capa (dilatación de la silueta)
  function contorno(c, col = TINTA, t = 1.1) {
    const sil = document.createElement('canvas'); sil.width = c.width; sil.height = c.height;
    const sg = sil.getContext('2d'); sg.drawImage(c, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = col; sg.fillRect(0, 0, sil.width, sil.height);
    const g = c.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-over';
    const r = t * S;
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; g.drawImage(sil, Math.cos(a) * r, Math.sin(a) * r); }
    g.restore();
  }
  // Trama de puntos (halftone) dentro de un rectángulo
  function trama(g, x, y, w, h, col, paso = 4, r = 0.7) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = col;
    for (let j = 0, yy = y; yy < y + h + paso; yy += paso, j++) for (let xx = x + (j % 2 ? paso / 2 : 0); xx < x + w + paso; xx += paso) { g.beginPath(); g.arc(xx, yy, r, 0, 7); g.fill(); }
    g.restore();
  }
  // Capa con contorno de tinta: dibuja con fn y la compone sobre g
  function conTinta(g, fn, t = 1.1) {
    const capa = lienzo(W, H), cg = ctx(capa);
    fn(cg);
    contorno(capa, TINTA, t);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(capa, 0, 0); g.restore();
  }

  // ------------------------------------------------------------ colores
  const MANO_MED = '#efb98d', BATA = '#ffffff';

  // ------------------------------------------------------------ caras de cómic
  function gota(g, x, y, k) {
    g.save(); g.translate(x, y); g.scale(k, k);
    g.fillStyle = '#8fd3ff'; g.strokeStyle = TINTA; g.lineWidth = 0.45;
    g.beginPath(); g.moveTo(0, -2.2); g.quadraticCurveTo(1.7, 0.4, 0, 1.5); g.quadraticCurveTo(-1.7, 0.4, 0, -2.2); g.fill(); g.stroke();
    disco(g, -0.4, 0.1, 0.2, '#ffffff');
    g.restore();
  }
  // Rasgos (ojos, cejas, nariz, boca y efectos) centrados en el origen; cara de radio ≈ 9,5
  function caraRasgos(g, k, p, ex, pequena) {
    g.save(); g.scale(k, k);
    const bocaD = '#8e2a22', ojos = p.ojos || '#5a3a22', ceja = p.peloD || TINTA;
    const ojo = (x, ry = 1.9) => {
      elipse(g, x, 1, 2.1, ry, '#ffffff');
      disco(g, x + 0.2, 1.1, 1.25, ojos); disco(g, x + 0.2, 1.1, 0.6, TINTA); disco(g, x - 0.35, 0.5, 0.35, '#ffffff');
      curva(g, [[x - 2.7, 0.3], [x, -1.6], [x + 2.7, 0.3]], TINTA, 0.75);
    };
    const cej = (x1, y1, x2, y2) => linea(g, x1, y1, x2, y2, ceja, 0.85);
    if (ex === 'dolor') {
      [[-3.8, 1], [3.8, -1]].forEach(([x, s]) => { g.strokeStyle = TINTA; g.lineWidth = 0.75; g.beginPath(); g.moveTo(x - 1.9 * s, -0.4); g.lineTo(x + 1.4 * s, 1); g.lineTo(x - 1.9 * s, 2.4); g.stroke(); });
      cej(-6.2, -2.4, -2, -4.4); cej(2, -4.4, 6.2, -2.4);
      curva(g, [[-0.6, -4], [0.1, -3.1], [-0.4, -2.2]], p.pielD, 0.45);
      g.fillStyle = bocaD; g.beginPath(); g.ellipse(0, 7.6, 2.9, 1.8, 0, 0, Math.PI * 2); g.fill();
      rect(g, -2.3, 6.3, 4.6, 0.9, '#ffffff');
      if (!pequena) {
        gota(g, 8.6, -6, 1); gota(g, -9.4, -3, 0.75);
        [[11, -9, 13.6, -11.2], [12, -5.5, 15, -6], [10.6, -12.4, 12, -15]].forEach(([a, b, c, d]) => linea(g, a, b, c, d, TINTA, 0.6));
      }
    } else if (ex === 'preocupada') {
      ojo(-3.8); ojo(3.8);
      cej(-6, -2, -2, -3.8); cej(2, -3.8, 6, -2);
      curva(g, [[-2.1, 8], [0, 6.7], [2.1, 8]], bocaD, 0.8);
      if (!pequena) gota(g, 8.6, -5, 0.8);
    } else if (ex === 'alivio') {
      [-3.8, 3.8].forEach((x) => curva(g, [[x - 2.2, 1.5], [x, -0.7], [x + 2.2, 1.5]], TINTA, 0.8));
      cej(-6, -2.8, -2, -3.3); cej(2, -3.3, 6, -2.8);
      elipse(g, -5.6, 4.3, 1.6, 0.8, 'rgba(240,90,90,.5)'); elipse(g, 5.6, 4.3, 1.6, 0.8, 'rgba(240,90,90,.5)');
      g.fillStyle = bocaD; g.beginPath(); g.moveTo(-2.5, 6.5); g.quadraticCurveTo(0, 9.8, 2.5, 6.5); g.closePath(); g.fill();
    } else if (ex === 'sorpresa') {
      ojo(-3.8, 2.4); ojo(3.8, 2.4);
      cej(-6, -3.8, -2, -4.6); cej(2, -4.6, 6, -3.8);
      elipse(g, 0, 7.6, 1.3, 1.9, bocaD);
      if (!pequena) [[-12, -10, -14.4, -12.6], [12, -10, 14.4, -12.6], [0, -15.5, 0, -18]].forEach(([a, b, c, d]) => linea(g, a, b, c, d, TINTA, 0.6));
    } else {
      ojo(-3.8); ojo(3.8);
      cej(-6, -2.6, -2, -3.1); cej(2, -3.1, 6, -2.6);
      curva(g, [[-1.9, 7.3], [0, 8.1], [1.9, 7.3]], bocaD, 0.8);
    }
    curva(g, [[0.3, 2.5], [1.3, 4.9], [-0.2, 5.2]], p.pielD, 0.55);
    g.restore();
  }
  // Cabeza completa de frente (k = escala; radio de la cara ≈ 9,5·k)
  function caraComic(g, cx, cy, k, p, ex, o = {}) {
    g.save(); g.translate(cx, cy); g.scale(k, k);
    const pelo = p.pelo, peloD = p.peloD || '#3a2016';
    if (o.coleta) capsula(g, 9.5, -5, 14, 9, 2.6, pelo);
    if (o.largo) poli(g, [[-11, -2], [11, -2], [13.5, 16], [10, 23], [-10, 23], [-13.5, 16]], pelo);
    elipse(g, 0, -1.5, 10.5, 12, pelo);
    elipse(g, -9.4, 2.2, 1.4, 2.1, p.pielD); elipse(g, 9.4, 2.2, 1.4, 2.1, p.pielD);
    g.fillStyle = p.piel; g.beginPath(); g.moveTo(-9, -2); g.bezierCurveTo(-9.6, 8, -5, 12.6, 0, 12.9); g.bezierCurveTo(5, 12.6, 9.6, 8, 9, -2); g.bezierCurveTo(9, -9.5, -9, -9.5, -9, -2); g.fill();
    g.fillStyle = p.pielD; g.beginPath(); g.moveTo(9, -2); g.bezierCurveTo(9.6, 8, 5, 12.6, 0, 12.9); g.bezierCurveTo(4.2, 11, 7.2, 7, 7.3, -2); g.closePath(); g.fill();
    g.fillStyle = pelo; g.beginPath(); g.moveTo(-10.2, -0.5); g.bezierCurveTo(-10.4, -10, -4, -13.8, 2, -13.3); g.bezierCurveTo(8, -12.8, 11.2, -8, 10.2, -0.5);
    g.bezierCurveTo(7.4, -5.6, 3, -7, -1, -6.6); g.bezierCurveTo(-4.4, -6.2, -7.4, -3.4, -10.2, -0.5); g.fill();
    curva(g, [[-3, -12.4], [-6.2, -8.4], [-8.2, -3.4]], peloD, 0.6); curva(g, [[3, -12.4], [6.4, -9.2], [8.4, -4.2]], peloD, 0.6);
    if (o.largo) {
      poli(g, [[-10.2, -0.5], [-8.2, 4], [-9.4, 14], [-12.4, 18.5], [-12.6, 6]], pelo);
      poli(g, [[10.2, -0.5], [8.2, 4], [9.4, 14], [12.4, 18.5], [12.6, 6]], pelo);
      curva(g, [[-10.8, 4], [-11.6, 11], [-11.4, 17]], peloD, 0.6); curva(g, [[10.8, 4], [11.6, 11], [11.4, 17]], peloD, 0.6);
    }
    caraRasgos(g, 1, p, ex);
    g.restore();
  }
  const cabezaFrente = (g, cx, cy, p, ex) => caraComic(g, cx, cy, 1.05, p, ex, { coleta: p.coleta });

  // ------------------------------------------------------------ vista aérea (cenital) del box de examen
  // Las poses se diseñan en un espacio pequeño y se escalan para que la camilla ocupe
  // ~80 % del ancho de la imagen (x 32–288 de 320).
  const K = 1.7;
  const AX = (x) => 36 + (x - 74) * K, AY = (y) => 80 + (y - 92) * K, AR = (r) => Math.max(1, Math.round(r * K));
  function esc2(g) {
    return {
      cap: (x1, y1, x2, y2, r, c) => capsula(g, AX(x1), AY(y1), AX(x2), AY(y2), AR(r), c),
      eli: (x, y, rx, ry, c) => elipse(g, AX(x), AY(y), AR(rx), AR(ry), c),
      pol: (pts, c) => poli(g, pts.map(([a, b]) => [AX(a), AY(b)]), c),
      lin: (x1, y1, x2, y2, c) => linea(g, AX(x1), AY(y1), AX(x2), AY(y2), c),
      pt: (x, y, c) => elipse(g, AX(x), AY(y), 0.8, 0.8, c),
    };
  }
  const OSC = '#2a1a12', BOCA = '#9a4a42';

  // Cabezas vistas desde arriba
  function cabezaCara(g, e, cx, cy, p, ex) { // decúbito supino: coronilla hacia la izquierda, cara hacia arriba
    e.cap(cx - 9, cy + 2, cx - 15, cy + 7, 2, p.pelo);
    e.eli(cx - 3, cy, 9, 10, p.pelo);
    e.eli(cx + 1, cy, 6, 7, p.piel);
    e.eli(cx - 4, cy, 3, 6, p.pelo);
    g.save(); g.translate(AX(cx + 1.6), AY(cy)); g.rotate(-Math.PI / 2); caraRasgos(g, 0.95, p, ex, true); g.restore();
  }
  function cabezaNuca(g, e, cx, cy, p) { // decúbito prono
    e.cap(cx - 6, cy + 1, cx - 13, cy + 5, 2, p.pelo);
    e.eli(cx + 1, cy - 8, 1, 2, p.pielD); e.eli(cx + 1, cy + 8, 1, 2, p.pielD);
    e.eli(cx, cy, 8, 8, p.pelo);
    e.lin(cx - 6, cy, cx + 5, cy, p.peloL || p.pelo);
  }
  function cabezaPerfil(g, e, cx, cy, p, ex) { // decúbito lateral: cara hacia abajo de la imagen
    e.cap(cx - 5, cy - 4, cx - 12, cy - 8, 2, p.pelo);
    e.eli(cx + 1, cy + 3, 6, 6, p.piel);
    e.eli(cx - 1, cy - 2, 8, 6, p.pelo);
    e.pt(cx + 1, cy + 9, p.piel);
    if (ex === 'dolor') linea(g, AX(cx + 2), AY(cy + 3), AX(cx + 4), AY(cy + 3.6), OSC, 0.8); else disco(g, AX(cx + 3), AY(cy + 3), 1, OSC);
    linea(g, AX(cx + 4.5), AY(cy + 6), AX(cx + 5.8), AY(cy + 6), BOCA, 0.8);
  }
  function cabezaArriba(g, e, cx, cy, p) { // de pie o sentada: se ve la coronilla
    e.eli(cx, cy, 8, 8, p.pelo);
    e.eli(cx, cy + 5, 6, 3, p.piel);
    e.eli(cx, cy - 1, 8, 7, p.pelo);
    e.pt(cx, cy + 8, p.piel);
    if (p.gorro) { e.eli(cx, cy - 1, 6, 5, '#ecebe6'); rect(g, AX(cx) - 1, AY(cy - 1) - 3, 2, 6, '#a24b3c'); rect(g, AX(cx) - 3, AY(cy - 1) - 1, 6, 2, '#a24b3c'); }
    else e.lin(cx, cy - 7, cx, cy + 1, p.peloL || p.pelo);
  }

  // Tronco en decúbito (bata) y brazos a los lados
  function troncoSupino(e, p, dx = 0) {
    e.pol([[98, 78], [104, 74], [112, 75], [124, 79], [134, 77], [144, 78], [144, 106], [134, 107], [124, 105], [112, 109], [104, 110], [98, 106]].map(([a, b]) => [a + dx, b]), p.ropa);
    e.lin(100 + dx, 92, 143 + dx, 92, p.ropaD);
    e.lin(134 + dx, 78, 134 + dx, 106, p.ropaD);
  }

  const POSES = {
    supino: {
      nombre: 'Decúbito supino', corto: 'D. supino',
      desc: 'Acostada boca arriba. Es la posición estándar para el examen del abdomen.',
      marcas: (v) => ({ abdomen: [130, 86], centro: [124, 92], torax: [110, 92], brazo: [118, 72], rodilla: v === 'obturador' ? [150, 85] : [172, 86], pelvis: [140, 92] }),
      dibujar(g, p, ex, v) {
        const e = esc2(g);
        e.cap(144, 99, 172, 99, 5, p.piel); e.cap(172, 99, 196, 98, 3, p.piel); e.eli(200, 98, 3, 3, p.pielD);
        if (v === 'obturador') { e.cap(144, 85, 150, 85, 5, p.piel); e.cap(152, 85, 170, 86, 3, p.piel); e.eli(173, 86, 3, 3, p.pielD); e.eli(150, 85, 7, 6, p.piel); e.eli(151, 84, 3, 2, p.pielL || p.piel); }
        else { e.cap(144, 85, 172, 86, 5, p.piel); e.cap(172, 86, 196, 86, 3, p.piel); e.eli(200, 86, 3, 3, p.pielD); }
        troncoSupino(e, p);
        e.cap(104, 75, 112, 72, 4, p.ropa); e.cap(112, 72, 124, 70, 3, p.piel); e.cap(124, 70, 136, 72, 2, p.piel); e.eli(139, 72, 3, 2, p.piel);
        e.cap(104, 109, 112, 112, 4, p.ropa); e.cap(112, 112, 124, 114, 3, p.piel); e.cap(124, 114, 136, 112, 2, p.piel); e.eli(139, 112, 3, 2, p.piel);
        e.cap(93, 92, 98, 92, 4, p.pielD);
        cabezaCara(g, e, 86, 92, p, ex);
      },
    },
    lateral: {
      nombre: 'Decúbito lateral izquierdo', corto: 'D. lateral izq.',
      desc: 'Acostada sobre el lado izquierdo. Se usa para el signo del psoas y el tacto rectal (posición de Sims).',
      marcas: (v) => ({ abdomen: [128, 98], pelvis: [140, 92], rodilla: v === 'psoas' ? [164, 80] : [160, 106], espalda: [120, 84] }),
      dibujar(g, p, ex, v) {
        const e = esc2(g);
        e.cap(140, 98, 166, 100, 4, p.pielD); e.cap(166, 100, 190, 99, 3, p.pielD); e.eli(193, 99, 3, 2, p.pielD);
        if (v === 'psoas') { e.cap(140, 90, 164, 80, 5, p.piel); e.cap(164, 80, 186, 78, 3, p.piel); e.eli(189, 78, 3, 2, p.pielD); }
        else { e.cap(140, 94, 160, 106, 5, p.piel); e.cap(160, 106, 182, 105, 3, p.piel); e.eli(185, 105, 3, 2, p.pielD); }
        e.pol([[98, 84], [106, 82], [124, 84], [136, 82], [146, 86], [146, 100], [136, 102], [124, 100], [112, 104], [104, 102], [98, 98]], p.ropa);
        e.lin(100, 84, 144, 85, p.ropaD);
        e.cap(100, 98, 92, 104, 2, p.pielD); e.eli(90, 105, 2, 2, p.pielD);
        e.cap(104, 96, 114, 104, 3, p.ropa); e.cap(114, 104, 128, 108, 2, p.piel); e.eli(131, 108, 2, 2, p.piel);
        e.cap(93, 91, 98, 91, 3, p.pielD);
        cabezaPerfil(g, e, 87, 91, p, ex);
      },
    },
    prono: {
      nombre: 'Decúbito prono', corto: 'D. prono',
      desc: 'Acostada boca abajo. Permite inspeccionar la región dorsal y lumbar.',
      marcas: () => ({ espalda: [124, 92], pelvis: [140, 92] }),
      dibujar(g, p) {
        const e = esc2(g);
        e.cap(144, 85, 172, 86, 5, p.piel); e.cap(172, 86, 196, 86, 3, p.piel); e.eli(199, 86, 3, 3, p.pielD); e.pt(200, 86, p.piel);
        e.cap(144, 99, 172, 99, 5, p.piel); e.cap(172, 99, 196, 98, 3, p.piel); e.eli(199, 98, 3, 3, p.pielD); e.pt(200, 97, p.piel);
        troncoSupino(e, p);
        e.eli(140, 87, 5, 5, p.ropaD); e.eli(140, 97, 5, 5, p.ropaD);
        for (let x = 104; x < 132; x += 9) { e.pt(x, 91, '#e9e6dc'); e.pt(x + 1, 93, '#e9e6dc'); }
        e.cap(104, 75, 96, 68, 4, p.ropa); e.cap(96, 68, 82, 72, 3, p.piel); e.eli(79, 74, 3, 2, p.piel);
        e.cap(104, 109, 96, 116, 4, p.ropa); e.cap(96, 116, 82, 112, 3, p.piel); e.eli(79, 110, 3, 2, p.piel);
        e.cap(93, 92, 98, 92, 4, p.pielD);
        cabezaNuca(g, e, 87, 92, p);
      },
    },
    sedestacion: {
      nombre: 'Sedestación', corto: 'Sentada', vistaLateral: true,
      desc: 'Sentada al borde de la camilla, de frente al médico. Inspección general, signos vitales, auscultación cardiopulmonar y puñopercusión lumbar.',
      // Coordenadas finales (camilla de lado, paciente de frente)
      marcas: () => ({ brazo: [137, 64], torax: [167, 66], espalda: [160, 70], abdomen: [154, 96] }),
      dibujar(g, p, ex) {
        // piernas colgando por delante de la camilla
        capsula(g, 149, 122, 149, 158, 5, p.piel); capsula(g, 171, 122, 171, 158, 5, p.piel);
        linea(g, 152, 126, 152, 156, p.pielD); linea(g, 174, 126, 174, 156, p.pielD);
        elipse(g, 147, 162, 7, 3, p.zapato); elipse(g, 173, 162, 7, 3, p.zapato);
        // muslos en escorzo (rodillas hacia el médico)
        elipse(g, 149, 118, 8, 6, p.piel); elipse(g, 171, 118, 8, 6, p.piel);
        // bata
        poli(g, [[140, 46], [180, 46], [178, 80], [186, 116], [134, 116], [142, 80]], p.ropa);
        linea(g, 160, 50, 160, 112, p.ropaD); rect(g, 135, 114, 50, 2, p.ropaD);
        poli(g, [[152, 46], [160, 56], [168, 46]], p.pielD);
        // brazos y manos sobre el regazo
        capsula(g, 141, 50, 136, 64, 6, p.ropa); capsula(g, 135, 66, 134, 86, 4, p.piel);
        if (p.manoAbd && ex === 'dolor') { capsula(g, 134, 86, 150, 96, 4, p.piel); elipse(g, 153, 97, 5, 4, p.piel); }
        else { capsula(g, 134, 86, 145, 104, 4, p.piel); elipse(g, 147, 106, 5, 4, p.piel); }
        capsula(g, 179, 50, 184, 64, 6, p.ropa); capsula(g, 185, 66, 186, 86, 4, p.piel); capsula(g, 186, 86, 175, 104, 4, p.piel); elipse(g, 173, 106, 5, 4, p.piel);
        rect(g, 155, 34, 10, 14, p.pielD);
        cabezaFrente(g, 160, 24, p, ex);
      },
    },
    bipedestacion: {
      nombre: 'Bipedestación', corto: 'De pie', vistaLateral: true,
      desc: 'De pie frente a la camilla, de frente al médico. Permite evaluar la postura, la marcha y la facies.',
      marcas: () => ({ abdomen: [152, 100], torax: [167, 72], brazo: [137, 70], espalda: [160, 76] }),
      dibujar(g, p, ex) {
        capsula(g, 150, 118, 150, 186, 7, p.pantalon || p.piel); capsula(g, 170, 118, 170, 186, 7, p.pantalon || p.piel);
        linea(g, 154, 126, 154, 180, p.pantalonD || p.pielD); linea(g, 174, 126, 174, 180, p.pantalonD || p.pielD);
        poli(g, [[140, 52], [180, 52], [178, 86], [184, 128], [136, 128], [142, 86]], p.ropa);
        linea(g, 160, 56, 160, 126, p.ropaD); rect(g, 137, 126, 47, 2, p.ropaD);
        poli(g, [[152, 52], [160, 62], [168, 52]], p.pielD);
        capsula(g, 179, 56, 184, 70, 6, p.ropa); capsula(g, 185, 72, 187, 96, 4, p.piel); capsula(g, 187, 96, 186, 116, 4, p.piel); elipse(g, 186, 119, 4, 5, p.piel);
        capsula(g, 141, 56, 136, 70, 6, p.ropa); capsula(g, 135, 72, 135, 92, 4, p.piel);
        if (p.manoAbd) { capsula(g, 135, 92, 148, 100, 4, p.piel); elipse(g, 151, 101, 5, 4, p.piel); }
        else { capsula(g, 135, 92, 134, 116, 4, p.piel); elipse(g, 134, 119, 4, 5, p.piel); }
        rect(g, 155, 40, 10, 14, p.pielD);
        cabezaFrente(g, 160, 30, p, ex);
      },
    },
    litotomia: {
      nombre: 'Posición ginecológica (litotomía)', corto: 'Ginecológica',
      desc: 'Decúbito supino con caderas y rodillas flexionadas, piernas en los estribos y la pelvis al borde de la camilla. Especuloscopía y tacto vaginal.',
      marcas: () => ({ pelvis: [204, 92], abdomen: [186, 88] }),
      dibujar(g, p, ex) {
        const e = esc2(g);
        const d = 56;
        e.cap(200, 85, 214, 74, 5, p.piel); e.cap(214, 74, 230, 70, 3, p.piel); e.eli(233, 70, 3, 3, p.pielD);
        e.cap(200, 99, 214, 110, 5, p.piel); e.cap(214, 110, 230, 114, 3, p.piel); e.eli(233, 114, 3, 3, p.pielD);
        troncoSupino(e, p, d);
        e.cap(104 + d, 75, 112 + d, 72, 4, p.ropa); e.cap(112 + d, 72, 124 + d, 70, 3, p.piel); e.eli(127 + d, 70, 3, 2, p.piel);
        e.cap(104 + d, 109, 112 + d, 112, 4, p.ropa); e.cap(112 + d, 112, 124 + d, 114, 3, p.piel); e.eli(127 + d, 114, 3, 2, p.piel);
        e.cap(93 + d, 92, 98 + d, 92, 4, p.pielD);
        cabezaCara(g, e, 86 + d, 92, p, ex);
        e.pol([[192, 78], [212, 68], [222, 74], [222, 110], [212, 116], [192, 106]], '#79c2a2');
        e.lin(200, 80, 218, 74, '#5ea687'); e.lin(200, 104, 218, 110, '#5ea687');
      },
    },
  };

  // Médico visto desde arriba (lado derecho de la paciente = arriba de la imagen)
  function medicoArriba(g, m, tipo, lado) {
    const e = esc2(g);
    const [mx, my] = m;
    const s = lado === 'sur' ? -1 : 1;
    const dx = mx + 6, dy = lado === 'sur' ? my + 26 : 57;
    if (tipo === 'manguito') { e.pol([[mx - 4, my - 3], [mx + 4, my - 3], [mx + 4, my + 3], [mx - 4, my + 3]], '#2f4d6a'); e.lin(mx - 4, my, mx + 4, my, '#4a6d8f'); }
    e.cap(dx - 8, dy + s * 4, mx + 1, my - s * 2, 3, BATA);
    if (tipo !== 'manguito') e.cap(dx + 8, dy + s * 4, mx + 6, my - s * 3, 3, BATA);
    e.eli(mx, my - s, 3, 3, MANO_MED);
    if (tipo !== 'manguito') e.eli(mx + 5, my - s * 2, 3, 2, MANO_MED);
    e.eli(dx, dy, 15, 8, BATA);
    e.lin(dx - 15, dy, dx + 15, dy, '#d3d6d0');
    e.eli(dx, dy, 6, 6, '#3a3632'); e.lin(dx - 3, dy - 3, dx + 3, dy + 1, '#4f4a44');
    if (tipo === 'esteto') { e.lin(dx, dy + s * 6, mx, my, '#3a3d40'); e.eli(mx, my, 2, 2, '#c0c6cc'); }
    if (tipo === 'manguito') { e.lin(mx + 4, my, mx + 12, my + 8 * s, '#333'); e.eli(mx + 13, my + 9 * s, 2, 3, '#1c1c1c'); }
  }

  // ------------------------------------------------------------ elementos de decorado
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  function relojDigital(g, x, y, hora) {
    rect(g, x - 2, y - 2, 52, 22, '#2b2b2b');
    rect(g, x, y, 48, 18, '#0f1a12');
    const [hh, mm] = hora || [14, 10];
    const t = `${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}`;
    const seg = { a: [1, 0, 5, 2], b: [5, 1, 2, 6], c: [5, 7, 2, 6], d: [1, 12, 5, 2], e: [0, 7, 2, 6], f: [0, 1, 2, 6], g: [1, 6, 5, 2] };
    const dig = (dx, n) => Object.keys(seg).forEach((k) => { const [a, b, w, h] = seg[k]; rect(g, x + dx + a, y + 2 + b, w, h, SEG[n].includes(k) ? '#3cf07a' : '#183222'); });
    dig(3, +t[0]); dig(13, +t[1]); dig(27, +t[2]); dig(37, +t[3]);
    rect(g, x + 23, y + 5, 2, 2, '#3cf07a'); rect(g, x + 23, y + 11, 2, 2, '#3cf07a');
  }
  function cuadroCruz(g, x, y) {
    rect(g, x, y, 30, 36, '#b06a3b'); rect(g, x + 3, y + 3, 24, 30, '#ffffff');
    rect(g, x + 12, y + 8, 6, 20, '#e53935'); rect(g, x + 6, y + 15, 18, 6, '#e53935');
  }
  function diploma(g, x, y, w, h) {
    rect(g, x, y, w, h, '#b06a3b'); rect(g, x + 2, y + 2, w - 4, h - 4, '#fffaf0');
    for (let i = 0; i < 4; i++) rect(g, x + 7, y + 7 + i * 4, w - 14 - (i % 2) * 8, 1, '#9ea7ad');
    disco(g, x + w - 8, y + h - 7, 3, '#e53935');
  }
  function soporteSuero(g, x, yTop, yBase, suero, haciaX, haciaY) {
    rect(g, x, yTop, 2, yBase - yTop, '#9aa6af'); rect(g, x - 8, yTop - 2, 18, 2, '#9aa6af');
    if (suero) {
      g.fillStyle = '#e3f5ff'; g.beginPath(); g.ellipse(x + 1, yTop + 10, 5, 8, 0, 0, 7); g.fill();
      rect(g, x - 2, yTop + 6, 6, 4, '#ffffff'); rect(g, x - 2, yTop + 7, 6, 1, '#2e86de');
      linea(g, x + 1, yTop + 18, x + 1, yTop + 32, '#9fc6dc', 0.8);
      if (haciaX != null) curva(g, [[x + 1, yTop + 32], [x + 10, haciaY - 10], [haciaX, haciaY]], '#9fc6dc', 0.8);
    }
  }

  // ------------------------------------------------------------ consultorio (vista desde el escritorio)
  function fondoConsultorio(g, o) {
    rect(g, 0, 0, W, H, '#ffffff');
    rect(g, 0, 0, W, 150, '#eef8fd');
    trama(g, 0, 0, W, 150, '#d3ecf8', 6, 0.9);
    rect(g, 0, 118, W, 32, '#dff1fa'); trama(g, 0, 118, W, 32, '#bfe2f2', 4, 0.9);
    linea(g, 0, 118, W, 118, TINTA, 0.8);
    conTinta(g, (d) => {
      rect(d, 4, 30, 58, 4, '#8d5a3b');
      poli(d, [[12, 37], [22, 37], [26, 44], [30, 37], [42, 37], [48, 60], [46, 116], [10, 116], [8, 60]], '#ffffff');
      poli(d, [[34, 37], [42, 37], [48, 60], [46, 116], [38, 116], [37, 60]], '#e4ebf0');
      linea(d, 27, 46, 27, 114, '#b9c4cc', 0.8); rect(d, 14, 70, 9, 8, '#e4ebf0');
      soporteSuero(d, 78, 28, 150, o.suero, 124, 120);
      relojDigital(d, 136, 10, o.hora);
      cuadroCruz(d, 230, 12);
      diploma(d, 222, 58, 48, 30);
      rect(d, 268, 104, 52, 46, '#5d9cc4'); for (let y = 108; y < 148; y += 13) { rect(d, 272, y, 44, 11, '#7fb6da'); rect(d, 289, y + 4, 10, 2, '#2b4a5e'); }
      poli(d, [[290, 92], [312, 92], [309, 104], [293, 104]], '#e8763a');
      [[300, 92, 288, 66], [301, 92, 312, 62], [300, 92, 300, 58], [300, 92, 280, 78], [302, 92, 318, 76]].forEach(([a, b, c2, e]) => { linea(d, a, b, c2, e, '#2e7d32', 1.2); elipse(d, c2, e, 4, 3, '#43a047'); elipse(d, (a + c2) / 2, (b + e) / 2 - 2, 3, 2, '#66bb6a'); });
      poli(d, [[116, 104], [124, 94], [196, 94], [204, 104], [206, 152], [114, 152]], '#34495e');
    }, 0.8);
  }

  function busto(g, p, e) {
    const s = p.sueter, sD = p.sueterD, sL = p.sueterL;
    poli(g, [[140, 72], [180, 72], [186, 108], [190, 136], [160, 140], [130, 136], [134, 108]], p.pelo);
    rect(g, 152, 94, 16, 14, p.pielD);
    poli(g, [[116, 154], [120, 122], [134, 108], [150, 104], [170, 104], [186, 108], [200, 122], [204, 154]], s);
    poli(g, [[150, 104], [160, 117], [170, 104]], p.cuello);
    linea(g, 150, 104, 160, 117, TINTA, 0.7); linea(g, 170, 104, 160, 117, TINTA, 0.7);
    poli(g, [[134, 120], [146, 132], [174, 132], [186, 120], [186, 154], [134, 154]], sD);
    poli(g, [[120, 124], [114, 150], [150, 152], [150, 142], [132, 132]], s);
    poli(g, [[200, 124], [206, 150], [170, 152], [170, 142], [188, 132]], s);
    curva(g, [[121, 126], [126, 130], [132, 134]], TINTA, 0.6); curva(g, [[199, 126], [194, 130], [188, 134]], TINTA, 0.6);
    rect(g, 140, 141, 8, 10, sL); rect(g, 172, 141, 8, 10, sL);
    elipse(g, 160, 146, 13, 5, p.piel);
    for (let x = 153; x <= 167; x += 3.5) curva(g, [[x, 142.5], [x + 0.8, 146], [x + 0.4, 149.5]], p.pielD, 0.6);
    poli(g, [[142, 92], [148, 98], [147, 124], [141, 134], [134, 122], [137, 104]], p.pelo);
    poli(g, [[178, 92], [172, 98], [173, 124], [179, 134], [186, 122], [183, 104]], p.pelo);
    curva(g, [[141, 100], [139, 112], [138, 126]], p.peloD, 0.6); curva(g, [[179, 100], [181, 112], [182, 126]], p.peloD, 0.6);
    caraComic(g, 160, 80, 1.6, p, e, { largo: true });
  }

  function escritorio(g) {
    conTinta(g, (d) => {
      poli(d, [[0, 150], [W, 150], [W, H + 2], [0, H + 2]], '#d58b4f');
      rect(d, 0, 150, W, 2, '#eaa76b');
      for (let y = 157; y < H; y += 6) for (let x = (y * 7) % 23; x < W; x += 37) linea(d, x, y, x + 12, y, '#b8703b', 0.7);
      poli(d, [[74, 157], [246, 157], [258, H + 2], [62, H + 2]], '#2e9d6f');
      poli(d, [[124, 162], [196, 162], [200, H + 2], [120, H + 2]], '#ffffff');
      rect(d, 132, 166, 30, 1.2, '#5b6770'); for (let y = 170; y < H; y += 3) rect(d, 130, y, 58, 0.8, '#b9c4cc');
      capsula(d, 204, 166, 222, 174, 1, '#2e86de'); disco(d, 223, 174.5, 1, '#f2b134');
      rect(d, 36, 136, 18, 26, '#e53935');
      capsula(d, 40, 136, 38, 121, 0.8, '#f2b134'); capsula(d, 45, 136, 46, 118, 0.8, '#2e86de'); capsula(d, 50, 136, 53, 122, 0.8, '#43a047');
      g.save();
      for (let i = 0; i < 6; i++) poli(d, [[262 + i, 154 - i * 3], [314, 154 - i * 3], [318, 162 - i * 3], [266 + i, 162 - i * 3]], i % 2 ? '#ffffff' : '#f1f4f6');
      poli(d, [[258, 162], [318, 162], [320, 178], [262, 178]], '#f2b134');
      g.restore();
    }, 0.9);
    // estetoscopio (líneas sobre el tapete)
    g.save(); g.strokeStyle = '#2b2b2b'; g.lineWidth = 2.2; g.beginPath(); g.ellipse(92, 168, 13, 5, 0, 0, 7); g.stroke(); g.restore();
    linea(g, 80, 166, 74, 157, '#2b2b2b', 2.2);
    disco(g, 105, 173, 4.5, TINTA); disco(g, 105, 173, 3.6, '#d9e2e8'); disco(g, 105, 173, 1.8, '#9aa6af');
  }

  // ------------------------------------------------------------ box: vista aérea
  function fondoArriba(g, o) {
    rect(g, 0, 0, W, H, '#ffffff');
    for (let x = 0; x <= W; x += 16) linea(g, x, 14, x, H, '#e4eef3', 0.6);
    for (let y = 14; y <= H; y += 16) linea(g, 0, y, W, y, '#e4eef3', 0.6);
    rect(g, 0, 0, W, 13, '#d6eefa'); trama(g, 0, 0, W, 13, '#b5ddf1', 4, 0.8); linea(g, 0, 13, W, 13, TINTA, 0.8);
    trama(g, 34, 40, 262, 92, '#cfdbe1', 3.5, 0.9); // sombra de la camilla
    conTinta(g, (d) => {
      for (let y = 16; y < H; y += 8) { rect(d, 302, y, 16, 4, '#7fd0e6'); rect(d, 302, y + 4, 16, 4, '#5bbad4'); }
      rect(d, 4, 140, 26, 36, '#d58b4f'); rect(d, 8, 146, 18, 10, '#e9eef1'); rect(d, 9, 160, 16, 10, '#ffffff'); rect(d, 11, 162, 12, 2, '#2e86de');
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; linea(d, 16, 30, 16 + Math.cos(a) * 9, 30 + Math.sin(a) * 9, '#7d8a90', 1.2); }
      disco(d, 16, 30, 2.5, '#5b666c');
      if (o.suero) { rect(d, 11, 22, 11, 15, '#e3f5ff'); rect(d, 11, 27, 11, 2, '#2e86de'); }
      rect(d, 26, 34, 266, 92, '#9fb2bc'); rect(d, 22, 32, 8, 96, '#6d7f89'); rect(d, 288, 32, 6, 96, '#6d7f89');
      rect(d, 32, 38, 256, 84, '#ffffff'); rect(d, 32, 116, 256, 6, '#e3ebef');
      rect(d, 70, 32, 110, 3, '#9fb2bc');
      if (o.pose === 'litotomia') [[233, 64], [233, 120]].forEach(([x, y]) => { disco(d, AX(x), AY(y), 6, '#5b666c'); disco(d, AX(x), AY(y), 3.5, '#9aa6af'); });
    }, 0.9);
    const almX = o.pose === 'litotomia' ? 150 : 54;
    conTinta(g, (d) => { elipse(d, almX, 80, 16, 26, '#ffffff'); elipse(d, almX + 3, 82, 10, 20, '#f0f5f8'); }, 0.7);
    if (o.suero) { const m = (POSES[o.pose] || POSES.supino).marcas(o.variante).brazo || [118, 72]; curva(g, [[18, 37], [40, 70], [AX(m[0]), AY(m[1])]], '#8ec5df', 0.9); }
  }

  // ------------------------------------------------------------ box: camilla de lado, paciente de frente
  function fondoLateral(g, o) {
    rect(g, 0, 0, W, H, '#ffffff');
    rect(g, 0, 0, W, 132, '#eef8fd'); trama(g, 0, 0, W, 132, '#d3ecf8', 6, 0.9);
    rect(g, 0, 132, W, 30, '#dff1fa'); trama(g, 0, 132, W, 30, '#bfe2f2', 4, 0.9);
    linea(g, 0, 132, W, 132, TINTA, 0.8); linea(g, 0, 162, W, 162, TINTA, 0.8);
    trama(g, 30, 158, 262, 6, '#c9d6dc', 3, 0.9);
    conTinta(g, (d) => {
      relojDigital(d, 18, 10, o.hora);
      cuadroCruz(d, 96, 12);
      diploma(d, 136, 20, 44, 26);
      soporteSuero(d, 196, 30, 160, o.suero, 186, 80);
      g.save();
      rect(d, 44, 122, 4, 36, '#8a97a0'); rect(d, 272, 122, 4, 36, '#8a97a0');
      disco(d, 46, 160, 3, '#2b2b2b'); disco(d, 274, 160, 3, '#2b2b2b');
      rect(d, 32, 120, 256, 4, '#9fb2bc');
      rect(d, 32, 109, 256, 11, '#ffffff'); rect(d, 32, 117, 256, 3, '#e3ebef');
      elipse(d, 52, 105, 15, 4, '#ffffff');
      g.restore();
    }, 0.9);
  }

  // Brazo del médico en primera persona (vista lateral): entra desde el borde inferior
  function brazoLateral(g, m, tipo) {
    const [x, y] = m;
    if (tipo === 'manguito') {
      rect(g, x - 6, y - 5, 12, 11, '#2e86de'); rect(g, x - 6, y, 12, 1, '#1b5fa8');
      linea(g, x, y + 6, x - 8, y + 40, '#2b2b2b', 1.2);
      capsula(g, x - 36, H + 8, x - 12, y + 46, 6, BATA); elipse(g, x - 9, y + 44, 6, 5, MANO_MED); elipse(g, x - 8, y + 40, 3, 4, '#2b2b2b');
      return;
    }
    capsula(g, x + 26, H + 10, x + 6, y + 10, 6, BATA);
    rect(g, x + 2, y + 8, 9, 3, '#20b2aa');
    elipse(g, x + 3, y + 4, 6, 5, MANO_MED);
    if (tipo === 'esteto') { linea(g, x + 3, y + 2, x + 40, H, '#2b2b2b', 1.2); disco(g, x, y, 4, '#d9e2e8'); disco(g, x, y, 2, '#9aa6af'); }
  }

  // ------------------------------------------------------------ escena completa
  function escena(c, o) {
    preparar(c, W, H);
    const g = ctx(c);
    g.clearRect(0, 0, W, H);
    if (o.lugar === 'consultorio') {
      fondoConsultorio(g, o);
      conTinta(g, (d) => busto(d, o.pal, o.expr || 'neutral'), 1.2);
      escritorio(g);
      return;
    }
    const pose = POSES[o.pose] || POSES.supino;
    if (pose.vistaLateral) {
      fondoLateral(g, o);
      conTinta(g, (d) => pose.dibujar(d, o.pal, o.expr || 'neutral', o.variante), 1.2);
      if (o.accesorio && o.marca) {
        const m = pose.marcas()[o.marca];
        if (m) conTinta(g, (d) => brazoLateral(d, m, o.accesorio), 1.1);
      }
      return;
    }
    fondoArriba(g, o);
    conTinta(g, (d) => pose.dibujar(d, o.pal, o.expr || 'neutral', o.variante), 1.1);
    if (o.accesorio && o.marca) {
      const m = pose.marcas(o.variante)[o.marca];
      if (m) conTinta(g, (d) => medicoArriba(d, m, o.accesorio, 'norte'), 1.1);
    }
  }

  // Miniatura (botones de posición)
  function miniatura(c, pose, pal, expr) {
    preparar(c, 160, 90);
    const tmp = lienzo(W, H);
    escena(tmp, { lugar: 'box', pose, pal, expr });
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(tmp, 0, 0, tmp.width, tmp.height, 0, 0, c.width, c.height);
  }

  // ------------------------------------------------------------ zoom (inserto) de maniobras
  const ZP = { mcburney: [20, 32], fii: [44, 32], hcd: [21, 17], centro: [32, 25] };
  function zoom(c, o, parpadeo) {
    preparar(c, 64, 48);
    const g = ctx(c), pal = o.pal;
    g.clearRect(0, 0, 64, 48);
    rect(g, 0, 0, 64, 48, '#fff6d6'); trama(g, 0, 0, 64, 48, '#ffe7a0', 4, 0.8);
    const capa = lienzo(64, 48), d = ctx(capa);
    const marca = (x, y) => {
      g.strokeStyle = '#e53935'; g.lineWidth = parpadeo ? 1.2 : 0.8; g.beginPath(); g.arc(x, y, parpadeo ? 3.4 : 2.6, 0, 7); g.stroke();
      linea(g, x - 1.6, y - 1.6, x + 1.6, y + 1.6, '#e53935', 0.9); linea(g, x + 1.6, y - 1.6, x - 1.6, y + 1.6, '#e53935', 0.9);
    };
    const mano = (dd, x, y, dy = 0) => { capsula(dd, x + 8, y - 8 + dy, x + 17, y - 19 + dy, 2.5, BATA); elipse(dd, x + 3, y - 2 + dy, 5, 3.2, MANO_MED); };
    if (o.tipo === 'espalda') {
      poli(d, [[10, 0], [54, 0], [56, 46], [8, 46]], pal.piel);
      const dy = parpadeo ? 2 : 0;
      elipse(d, 46, 22 + dy, 5, 4, MANO_MED); capsula(d, 50, 18 + dy, 60, 6 + dy, 2.5, BATA);
      contorno(capa, TINTA, 0.8);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(capa, 0, 0); g.restore();
      punteada(g, 32, 1, 32, 45, p2(pal));
      curva(g, [[32, 26], [40, 28], [47, 34]], pal.pielD, 0.8); curva(g, [[32, 26], [24, 28], [17, 34]], pal.pielD, 0.8);
      marca(40, 30);
      if (parpadeo) [[37, 24, 34, 21], [44, 28, 47, 26], [41, 33, 42, 37]].forEach(([a, b, c2, e]) => linea(g, a, b, c2, e, '#e53935', 0.7));
      return;
    }
    rect(d, 10, 0, 44, 4, pal.ropa);
    poli(d, [[12, 3], [52, 3], [54, 30], [50, 46], [14, 46], [10, 30]], pal.piel);
    rect(d, 10, 42, 44, 6, '#43a047');
    const z = o.zona, P = ZP;
    if (z === 'ausc') { linea(d, 32, 25, 46, 2, '#2b2b2b', 1.1); disco(d, 32, 25, 3.2, '#d9e2e8'); }
    else if (z === 'perc') mano(d, P.mcburney[0], P.mcburney[1], parpadeo ? -2 : 0);
    else if (z === 'psup') mano(d, P.mcburney[0] - 2, P.mcburney[1] + 1);
    else if (z === 'mcburney' || z === 'murphy') mano(d, ...(z === 'murphy' ? P.hcd : P.mcburney));
    else if (z === 'blumberg') mano(d, P.mcburney[0], P.mcburney[1], parpadeo ? -5 : 0);
    else if (z === 'rovsing') mano(d, ...P.fii);
    contorno(capa, TINTA, 0.8);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(capa, 0, 0); g.restore();
    curva(g, [[32, 6], [26, 10], [14, 18]], pal.pielD, 0.7); curva(g, [[32, 6], [38, 10], [50, 18]], pal.pielD, 0.7);
    punteada(g, 32, 4, 32, 42, '#d39a74'); punteada(g, 12, 25, 52, 25, '#d39a74');
    disco(g, 32, 25.5, 0.9, '#8b5a3c');
    punteada(g, 32, 26, 15, 35, '#b07a55');
    if (z === 'insp' && parpadeo) { g.strokeStyle = '#2e86de'; g.lineWidth = 1.2; g.strokeRect(11, 3, 42, 40); }
    if (['mcburney', 'perc', 'blumberg', 'rovsing'].includes(z)) marca(...P.mcburney);
    if (z === 'murphy') marca(...P.hcd);
    if (z === 'blumberg' && parpadeo) { linea(g, 28, 34, 28, 25, '#2e86de', 1.1); linea(g, 26.5, 27, 28, 25, '#2e86de', 1.1); linea(g, 29.5, 27, 28, 25, '#2e86de', 1.1); }
    if (z === 'rovsing' && parpadeo) { g.save(); g.setLineDash([2, 1.5]); linea(g, 40, 34, 25, 34, '#2e86de', 1.1); g.restore(); }
    if (z === 'ausc' && parpadeo) [[38, 19, 41, 16], [26, 31, 23, 34]].forEach(([a, b, c2, e]) => linea(g, a, b, c2, e, '#2e86de', 0.8));
  }
  const p2 = (pal) => pal.pielD;

  // ------------------------------------------------------------ retratos 64×64 (recorte del busto)
  const FONDO_RETRATO = { paciente: ['#ffe08a', '#ffd04d'], enfermera: ['#eadcff', '#d3bdfb'], medico: ['#d6ecff', '#b3d8fb'], narrador: ['#f1f1f1', '#dddddd'] };
  function retrato(c, quien, expr, pal) {
    preparar(c, 64, 64);
    const g = ctx(c);
    g.clearRect(0, 0, 64, 64);
    const [f1, f2] = FONDO_RETRATO[quien] || FONDO_RETRATO.narrador;
    rect(g, 0, 0, 64, 64, f1); trama(g, 0, 0, 64, 64, f2, 4, 0.9);
    const capa = lienzo(64, 64), f = ctx(capa);
    if (quien === 'narrador') {
      rect(f, 17, 10, 30, 46, '#d58b4f'); rect(f, 20, 15, 24, 38, '#ffffff'); rect(f, 25, 7, 14, 6, '#9aa6af');
      for (let y = 21; y < 50; y += 5) rect(f, 24, y, y % 10 ? 16 : 12, 1, '#9aa6af');
      rect(f, 22, 21, 2, 2, '#20b2aa');
    } else if (quien === 'medico') {
      poli(f, [[4, 64], [8, 50], [20, 43], [44, 43], [56, 50], [60, 64]], BATA);
      poli(f, [[25, 43], [32, 55], [39, 43]], '#20b2aa');
      rect(f, 26, 36, 12, 8, '#3a4f63');
      elipse(f, 32, 24, 13, 15, '#4a6378');
      capsula(f, 20, 42, 18, 54, 1, '#2b2b2b'); capsula(f, 44, 42, 46, 54, 1, '#2b2b2b'); disco(f, 46, 57, 3, '#d9e2e8');
    } else if (quien === 'enfermera') { // voz fuera de escena: altavoz con ondas
      rect(f, 14, 24, 10, 16, '#7e57c2'); poli(f, [[24, 24], [36, 12], [36, 52], [24, 40]], '#9575cd');
    } else {
      const tmp = lienzo(W, H), tg = ctx(tmp);
      busto(tg, pal, expr);
      contorno(tmp, TINTA, 1.2);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(tmp, 128 * S, 48 * S, 64 * S, 64 * S, 0, 0, 64 * S, 64 * S); g.restore();
      return;
    }
    contorno(capa, TINTA, 1);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(capa, 0, 0); g.restore();
    if (quien === 'enfermera') [[42, 26, 6], [47, 22, 10], [52, 18, 14]].forEach(([x, y, h]) => curva(g, [[x, y], [x + 4, y + h], [x, y + 2 * h]], '#5e35b1', 1.6));
  }

  window.Arte = { W, H, POSES, escena, miniatura, zoom, retrato };
})();
