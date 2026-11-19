/*
 * Motor gráfico pixel art (canvas de baja resolución escalado sin suavizado).
 * Dibuja la escena del box, la paciente en distintas posiciones anatómicas,
 * los retratos del cuadro de diálogo y los zoom de las maniobras.
 */
(function () {
  'use strict';

  const W = 320, H = 180;
  const R = Math.round;
  const TINTA = '#1a1420';

  // ------------------------------------------------------------ primitivas
  function lienzo(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function ctx(c) { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return g; }
  function rect(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(R(x), R(y), R(w), R(h)); }
  function px(g, x, y, col) { g.fillStyle = col; g.fillRect(R(x), R(y), 1, 1); }
  function elipse(g, cx, cy, rx, ry, col) {
    g.fillStyle = col; cx = R(cx); cy = R(cy);
    for (let dy = -ry; dy <= ry; dy++) {
      const t = 1 - (dy * dy) / ((ry + 0.5) * (ry + 0.5));
      if (t < 0) continue;
      const hw = Math.floor(rx * Math.sqrt(t) + 0.25);
      g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
    }
  }
  const disco = (g, cx, cy, r, col) => elipse(g, cx, cy, r, r, col);
  function capsula(g, x1, y1, x2, y2, r, col) {
    const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1)));
    for (let i = 0; i <= n; i++) { const t = i / n; disco(g, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r, col); }
  }
  function poli(g, pts, col) {
    g.fillStyle = col;
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) * (bx - ax)) / (by - ay));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) { const a = R(xs[k]), b = R(xs[k + 1]); if (b > a) g.fillRect(a, y, b - a, 1); }
    }
  }
  function linea(g, x1, y1, x2, y2, col) {
    x1 = R(x1); y1 = R(y1); x2 = R(x2); y2 = R(y2);
    const dx = Math.abs(x2 - x1), dy = -Math.abs(y2 - y1), sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    let e = dx + dy;
    g.fillStyle = col;
    for (;;) {
      g.fillRect(x1, y1, 1, 1);
      if (x1 === x2 && y1 === y2) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x1 += sx; }
      if (e2 <= dx) { e += dx; y1 += sy; }
    }
  }
  function punteada(g, x1, y1, x2, y2, col, paso = 2) {
    const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / paso);
    for (let i = 0; i <= n; i++) px(g, x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n, col);
  }
  function contorno(c, col = TINTA) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const d = g.getImageData(0, 0, w, h).data;
    const a = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    g.fillStyle = col;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) g.fillRect(x, y, 1, 1);
    }
  }
  function sprite(g, spr, cx, cy, rot = 0, flip = false) {
    g.save();
    g.translate(R(cx), R(cy));
    if (rot) g.rotate((rot * Math.PI) / 180);
    if (flip) g.scale(-1, 1);
    g.drawImage(spr, -spr.width / 2, -spr.height / 2);
    g.restore();
  }

  // ------------------------------------------------------------ paletas
  const MANO_MED = '#d9a67c', BATA = '#f3f5f8';

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
      pt: (x, y, c) => rect(g, AX(x), AY(y), 2, 2, c),
    };
  }
  const OSC = '#2a1a12', BOCA = '#9a4a42';

  // Cabezas vistas desde arriba
  function cabezaCara(g, e, cx, cy, p, ex) { // decúbito supino: coronilla hacia la izquierda, cara hacia arriba
    e.cap(cx - 9, cy + 2, cx - 15, cy + 7, 2, p.pelo);
    e.eli(cx - 3, cy, 9, 10, p.pelo);
    e.eli(cx + 1, cy, 6, 7, p.piel);
    e.eli(cx - 4, cy, 3, 6, p.pelo);
    const fx = R(AX(cx)), fy = R(AY(cy));
    rect(g, fx - 1, fy - 8, 1, 4, p.peloD || OSC); rect(g, fx - 1, fy + 4, 1, 4, p.peloD || OSC);
    if (ex === 'dolor') { rect(g, fx + 2, fy - 8, 1, 4, OSC); rect(g, fx + 2, fy + 4, 1, 4, OSC); }
    else if (ex === 'alivio') { rect(g, fx + 2, fy - 7, 1, 3, OSC); rect(g, fx + 2, fy + 4, 1, 3, OSC); }
    else { rect(g, fx + 2, fy - 7, 2, 3, '#efe8dc'); rect(g, fx + 2, fy - 6, 2, 2, OSC); rect(g, fx + 2, fy + 4, 2, 3, '#efe8dc'); rect(g, fx + 2, fy + 4, 2, 2, OSC); }
    rect(g, fx + 5, fy - 1, 2, 2, p.pielD);
    if (ex === 'dolor') { rect(g, fx + 8, fy - 3, 2, 6, '#7a2c26'); rect(g, fx + 8, fy - 2, 1, 4, '#efe8dc'); }
    else if (ex === 'sorpresa') rect(g, fx + 8, fy - 1, 2, 2, '#7a2c26');
    else { rect(g, fx + 9, fy - 2, 1, 4, BOCA); if (ex === 'alivio') { px(g, fx + 8, fy - 3, BOCA); px(g, fx + 8, fy + 2, BOCA); } }
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
    const fx = R(AX(cx + 3)), fy = R(AY(cy + 3));
    if (ex === 'dolor') rect(g, fx, fy, 3, 1, OSC); else rect(g, fx, fy - 1, 2, 2, OSC);
    rect(g, R(AX(cx + 5)), R(AY(cy + 6)), 2, 1, BOCA);
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


  // Fondo del box visto desde arriba
  function fondoArriba(g, o) {
    for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) {
      rect(g, x, y, 16, 16, ((x + y) / 16) % 2 ? '#c6d3d8' : '#bdcbd1');
      rect(g, x, y, 16, 1, '#adbcc2'); rect(g, x, y, 1, 16, '#adbcc2');
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ruido(x, y) === 0) px(g, x, y, '#b3c2c8');
    textura(g, 0, 0, W, 12, '#bfe0ee', '#cde8f3', '#b0d4e4'); rect(g, 0, 12, W, 3, '#8fb3c2');
    // cortina en riel (derecha) y mesa auxiliar (abajo izquierda)
    rect(g, 300, 15, 2, H - 15, '#8a9aa6');
    for (let y = 16; y < H; y += 8) { rect(g, 302, y, 16, 4, '#9fd0de'); rect(g, 302, y + 4, 16, 4, '#86bccc'); }
    rect(g, 4, 140, 26, 36, '#9c8a70'); rect(g, 6, 142, 22, 32, '#b5a48a');
    rect(g, 8, 146, 18, 10, '#d9dde0'); linea(g, 10, 150, 22, 148, '#8a9096'); linea(g, 10, 153, 22, 153, '#8a9096');
    rect(g, 9, 160, 16, 10, '#eef0f6'); rect(g, 11, 162, 12, 2, '#5a86c8');
    // soporte de suero (base de ruedas vista desde arriba)
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; linea(g, 16, 30, 16 + Math.cos(a) * 9, 30 + Math.sin(a) * 9, '#7d8a90'); px(g, 16 + Math.cos(a) * 9, 30 + Math.sin(a) * 9, '#222'); }
    disco(g, 16, 30, 2, '#5b666c');
    if (o.suero) {
      rect(g, 11, 22, 11, 15, '#e3eef2'); rect(g, 11, 22, 11, 2, '#a9c1c9'); rect(g, 13, 28, 7, 7, '#c9dbe1');
      const m = (POSES[o.pose] || POSES.supino).marcas(o.variante).brazo || [118, 72];
      linea(g, 18, 36, AX(m[0]), AY(m[1]), '#b5c9cf');
    }
    // camilla: sombra, estructura, colchón, almohada y baranda
    rect(g, 34, 40, 262, 92, '#a7b6bc');
    rect(g, 26, 34, 266, 92, '#7d8a90'); rect(g, 22, 32, 8, 96, '#5f6b71'); rect(g, 288, 32, 6, 96, '#5f6b71');
    rect(g, 32, 38, 256, 84, '#e7eef1'); rect(g, 32, 38, 256, 2, '#f7fafb'); rect(g, 32, 119, 256, 3, '#c9d5da');
    for (let x = 60; x < 288; x += 37) linea(g, x, 40, x + 10, 118, '#dbe4e8');
    const almX = o.pose === 'litotomia' ? 150 : 54;
    if (o.pose !== 'sedestacion' && o.pose !== 'bipedestacion') { elipse(g, almX, 80, 18, 28, '#d3dde1'); elipse(g, almX - 1, 79, 16, 26, '#fbfdfe'); }
    rect(g, 70, 32, 110, 3, '#9aa6ac'); rect(g, 70, 32, 2, 6, '#9aa6ac'); rect(g, 178, 32, 2, 6, '#9aa6ac');
    [[26, 34], [290, 34], [26, 124], [290, 124]].forEach(([x, y]) => disco(g, x, y, 3, '#2b2f31'));
    if (o.pose === 'litotomia') [[233, 64], [233, 120]].forEach(([x, y]) => { disco(g, AX(x), AY(y), 6, '#5b666c'); disco(g, AX(x), AY(y), 4, '#8a9096'); });
  }

  // ------------------------------------------------------------ paleta ambiental (paredes celeste claro)
  const C = {
    pared: '#b7d8e6', paredL: '#c4e1ed', paredD: '#a6cad9', paredDD: '#8fb6c7',
    madera: '#5d4030', maderaL: '#6d4c38', maderaD: '#4e3527', maderaDD: '#3e2a1f',
    mesa: '#6b4a33', mesaL: '#7d5a40', mesaD: '#553a28',
    tapete: '#3f5a4a', tapeteD: '#2f4438',
    papel: '#e8e0cc', papelD: '#d1c6ad', papelDD: '#b3a78c',
    metal: '#8a9086', metalD: '#6e746b', metalDD: '#555a52', metalL: '#a4aaa0',
    piso: '#56625a', pisoL: '#5f6c63', pisoD: '#4b564f',
  };
  const ruido = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 13;
  function textura(g, x0, y0, w, h, base, claro, oscuro) {
    rect(g, x0, y0, w, h, base);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const n = ruido(x, y);
      if (n === 0) px(g, x, y, claro); else if (n === 1) px(g, x, y, oscuro);
    }
  }
  // Viñeta con dithering ordenado (oscurece los bordes en escalones)
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function vineta(c, fuerza = 0.42) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x - w / 2) / (w / 2), dy = (y - h * 0.45) / (h * 0.62);
      let t = Math.max(0, Math.hypot(dx, dy) - 0.55) * fuerza * 2.2;
      t += (BAYER[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * 0.12;
      const k = 1 - Math.min(0.5, Math.round(Math.max(0, t) * 8) / 8);
      const i = (y * w + x) * 4;
      d[i] *= k; d[i + 1] *= k; d[i + 2] *= k * 1.02;
    }
    g.putImageData(im, 0, 0);
  }

  // ------------------------------------------------------------ reloj digital de 7 segmentos
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  function digito(g, x, y, n, on, off) {
    const s = SEG[n] || '';
    const seg = { a: [1, 0, 5, 2], b: [5, 1, 2, 6], c: [5, 7, 2, 6], d: [1, 12, 5, 2], e: [0, 7, 2, 6], f: [0, 1, 2, 6], g: [1, 6, 5, 2] };
    Object.keys(seg).forEach((k) => { const [a, b, w, h] = seg[k]; rect(g, x + a, y + b, w, h, s.includes(k) ? on : off); });
  }
  function relojDigital(g, x, y, hora) {
    rect(g, x - 2, y - 2, 52, 22, '#1d201c'); rect(g, x - 1, y - 1, 50, 20, '#2f332e');
    rect(g, x, y, 48, 18, '#121611');
    const [hh, mm] = hora || [14, 10];
    const t = `${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}`;
    const on = '#5fd17a', off = '#1d2e21';
    [0, 1].forEach((i) => digito(g, x + 3 + i * 10, y + 2, +t[i], on, off));
    rect(g, x + 23, y + 5, 2, 2, on); rect(g, x + 23, y + 11, 2, 2, on);
    [2, 3].forEach((i) => digito(g, x + 7 + i * 10, y + 2, +t[i], on, off));
  }

  // ------------------------------------------------------------ consultorio (vista desde el escritorio)
  function fondoConsultorio(g, o) {
    textura(g, 0, 0, W, 120, C.pared, C.paredL, C.paredD);
    for (let x = 0; x < W; x += 2) if (ruido(x, 3) < 2) rect(g, x, 0, 1, 120, C.paredD);
    // zócalo de madera
    rect(g, 0, 118, W, 2, C.maderaDD);
    for (let x = 0; x < W; x += 26) { rect(g, x, 120, 26, 32, C.madera); rect(g, x + 3, 124, 20, 24, C.maderaD); rect(g, x + 3, 124, 20, 1, C.maderaDD); rect(g, x + 3, 147, 20, 1, C.maderaL); }
    rect(g, 0, 120, W, 1, C.maderaL);
    // perchero con bata blanca
    rect(g, 4, 30, 58, 4, C.maderaD); rect(g, 4, 30, 58, 1, C.maderaL); rect(g, 14, 34, 3, 4, '#2b2b28'); rect(g, 46, 34, 3, 4, '#2b2b28');
    poli(g, [[12, 37], [22, 37], [26, 44], [30, 37], [42, 37], [48, 60], [46, 118], [10, 118], [8, 60]], '#e6e6df');
    poli(g, [[30, 37], [42, 37], [48, 60], [46, 118], [36, 118], [34, 60]], '#cfd0c8');
    linea(g, 27, 46, 27, 116, '#b5b7ae'); rect(g, 14, 70, 9, 8, '#cfd0c8'); rect(g, 33, 72, 9, 8, '#b5b7ae');
    // soporte de suero
    rect(g, 78, 28, 2, 124, C.metalD); rect(g, 70, 26, 18, 2, C.metalD); linea(g, 70, 26, 66, 22, C.metalD); linea(g, 87, 26, 91, 22, C.metalD);
    if (o.suero) {
      rect(g, 72, 30, 10, 18, '#d4e2e6'); rect(g, 72, 30, 10, 2, '#aac0c7'); rect(g, 73, 38, 8, 9, '#c0d4da'); rect(g, 75, 48, 4, 3, '#aac0c7');
      linea(g, 77, 51, 77, 78, '#b5c9cf'); linea(g, 77, 78, 124, 120, '#b5c9cf');
    } else { rect(g, 74, 28, 2, 6, C.metalDD); }
    relojDigital(g, 136, 10, o.hora);
    // cuadros
    rect(g, 230, 12, 32, 38, C.maderaDD); rect(g, 232, 14, 28, 34, '#e9e2cf'); rect(g, 243, 20, 6, 22, '#a24b3c'); rect(g, 236, 28, 20, 6, '#a24b3c');
    rect(g, 222, 58, 48, 30, C.maderaDD); rect(g, 224, 60, 44, 26, '#ebe5d3');
    rect(g, 230, 65, 32, 1, '#9b9483'); rect(g, 232, 70, 28, 1, '#b8b19f'); rect(g, 232, 74, 28, 1, '#b8b19f'); rect(g, 232, 78, 18, 1, '#b8b19f'); disco(g, 260, 81, 3, '#b85b45');
    // archivador y planta
    rect(g, 268, 104, 52, 50, '#3f4a43'); rect(g, 270, 106, 50, 48, '#55625a');
    for (let y = 108; y < 150; y += 15) { rect(g, 272, y, 46, 13, '#4a564f'); rect(g, 290, y + 5, 10, 2, '#7d8a82'); }
    poli(g, [[290, 92], [312, 92], [309, 104], [293, 104]], '#9a5a3c'); rect(g, 290, 92, 22, 2, '#b06d4b');
    [[300, 92, 288, 66], [301, 92, 312, 62], [300, 92, 300, 58], [300, 92, 280, 78], [302, 92, 318, 76]].forEach(([a, b, c2, d]) => { linea(g, a, b, c2, d, '#3f6b3a'); disco(g, c2, d, 3, '#4f8048'); disco(g, (a + c2) / 2, (b + d) / 2 - 2, 2, '#5c9354'); });
    // silla (respaldo)
    poli(g, [[116, 104], [124, 94], [196, 94], [204, 104], [206, 152], [114, 152]], '#2e2520');
    linea(g, 124, 95, 196, 95, '#463831');
  }

  function busto(g, p, e) {
    const pielL = p.pielL || '#f0c9a8', pielDD = p.pielDD || '#a8735a';
    const peloD = p.peloD || '#24150d', peloL = p.peloL || '#5a3a26';
    const lid = '#2a1a12', ojoB = '#ebe4d9', labio = '#b0655a', labioD = '#8a4840', boca = '#5a2622';
    const s = p.sueter || '#3d6466', sD = p.sueterD || '#2f4f51', sL = p.sueterL || '#4b7779';
    const largo = !p.gorro;
    // cabello largo (detrás)
    if (largo) poli(g, [[140, 70], [180, 70], [187, 108], [192, 138], [176, 144], [160, 140], [144, 144], [128, 138], [133, 108]], p.pelo);
    else { disco(g, 160, 60, 8, p.pelo); }
    // cuello
    rect(g, 152, 96, 16, 12, p.pielD); rect(g, 156, 100, 8, 8, p.piel);
    // torso
    poli(g, [[116, 154], [120, 122], [134, 108], [150, 104], [170, 104], [186, 108], [200, 122], [204, 154]], s);
    poli(g, [[150, 104], [160, 117], [170, 104]], p.cuello || '#d8cfbd');
    linea(g, 150, 104, 160, 117, sD); linea(g, 170, 104, 160, 117, sD);
    poli(g, [[134, 120], [146, 132], [174, 132], [186, 120], [186, 154], [134, 154]], sD);
    // antebrazos hacia el centro, manos entrelazadas
    poli(g, [[120, 124], [114, 150], [150, 152], [150, 142], [132, 132]], s);
    poli(g, [[200, 124], [206, 150], [170, 152], [170, 142], [188, 132]], s);
    linea(g, 121, 126, 132, 134, sL); linea(g, 199, 126, 188, 134, sL);
    rect(g, 140, 141, 8, 10, sL); rect(g, 172, 141, 8, 10, sL);
    elipse(g, 160, 146, 13, 5, p.piel);
    for (let x = 152; x <= 168; x += 3) linea(g, x, 143, x + 1, 149, p.pielD);
    rect(g, 150, 150, 20, 1, p.pielD);
    // mechones sobre los hombros
    if (largo) {
      poli(g, [[142, 92], [148, 98], [147, 124], [141, 134], [134, 122], [137, 104]], p.pelo);
      poli(g, [[178, 92], [172, 98], [173, 124], [179, 134], [186, 122], [183, 104]], p.pelo);
      linea(g, 141, 100, 138, 126, peloL); linea(g, 145, 104, 143, 128, peloD); linea(g, 179, 100, 182, 126, peloL); linea(g, 175, 104, 177, 128, peloD);
    }
    // cara
    elipse(g, 160, 81, 16, 20, p.piel);
    for (let y = 70; y <= 98; y++) { const hw = Math.floor(16 * Math.sqrt(Math.max(0, 1 - ((y - 81) * (y - 81)) / (20.5 * 20.5)))); px(g, 160 + hw, y, p.pielD); px(g, 160 + hw - 1, y, p.pielD); }
    for (let y = 92; y <= 100; y++) { const hw = Math.floor(16 * Math.sqrt(Math.max(0, 1 - ((y - 81) * (y - 81)) / (20.5 * 20.5)))); px(g, 160 - hw, y, p.pielD); }
    rect(g, 149, 89, 4, 1, pielL); px(g, 150, 90, pielL);
    // cabello superior y flequillo
    elipse(g, 160, 67, 18, 10, p.pelo);
    poli(g, [[143, 66], [150, 59], [166, 58], [177, 64], [178, 79], [172, 71], [164, 69], [154, 72], [146, 81], [143, 76]], p.pelo);
    if (largo) {
      poli(g, [[142, 66], [146, 71], [145, 96], [142, 104], [139, 90]], p.pelo);
      poli(g, [[178, 66], [175, 72], [176, 96], [179, 104], [181, 90]], p.pelo);
    }
    linea(g, 152, 61, 146, 76, peloL); linea(g, 160, 59, 155, 70, peloL); linea(g, 168, 60, 175, 72, peloL); linea(g, 163, 60, 170, 70, peloD);
    linea(g, 143, 72, 142, 98, peloD); linea(g, 177, 72, 178, 98, peloD);
    if (p.gorro) { poli(g, [[144, 62], [148, 55], [172, 55], [176, 62]], '#ecebe6'); rect(g, 158, 57, 4, 4, '#a24b3c'); rect(g, 157, 58, 6, 2, '#a24b3c'); }

    // ---- rasgos según la expresión
    const ojo = (x, y, alto = 3) => {
      rect(g, x - 3, y - 1, 7, alto, ojoB); rect(g, x - 1, y - 1, 3, alto, p.ojos || '#4a2f1f');
      px(g, x, y, '#140c08'); px(g, x - 1, y - 1, '#f6efe6');
      rect(g, x - 4, y - 2, 9, 1, lid); px(g, x + 4, y - 1, lid); px(g, x - 4, y - 1, lid);
    };
    const ojeras = (x, y) => { rect(g, x - 2, y + 2, 5, 1, pielDD); px(g, x - 3, y + 1, p.pielD); };
    const [lx, rx, oy] = [153, 167, 84];
    const nariz = () => { px(g, 161, 87, p.pielD); px(g, 161, 88, p.pielD); px(g, 160, 86, pielL); px(g, 158, 90, pielDD); px(g, 162, 90, pielDD); px(g, 160, 91, p.pielD); };
    if (e === 'dolor') {
      [[lx, 1], [rx, -1]].forEach(([x, d]) => { linea(g, x - 3 * d, oy - 1, x + 2 * d, oy, lid); linea(g, x + 2 * d, oy, x - 3 * d, oy + 1, lid); px(g, x - 3 * d, oy + 2, pielDD); });
      linea(g, lx - 4, oy - 5, lx + 3, oy - 8, peloD); linea(g, rx - 3, oy - 8, rx + 4, oy - 5, peloD);
      px(g, 159, oy - 7, p.pielD); px(g, 161, oy - 7, p.pielD); px(g, 160, oy - 6, p.pielD);
      nariz();
      rect(g, 154, 94, 12, 4, boca); rect(g, 155, 95, 10, 1, '#efe8dc'); rect(g, 155, 93, 10, 1, labioD);
      elipse(g, 176, 74, 1, 2, '#a9d8ee'); px(g, 176, 73, '#eef8fd'); elipse(g, 145, 79, 1, 1, '#a9d8ee');
    } else if (e === 'preocupada') {
      ojo(lx, oy); ojo(rx, oy); ojeras(lx, oy); ojeras(rx, oy);
      linea(g, lx - 4, oy - 5, lx + 3, oy - 7, peloD); linea(g, rx - 3, oy - 7, rx + 4, oy - 5, peloD);
      nariz();
      rect(g, 157, 95, 6, 1, labioD); px(g, 156, 96, labioD); px(g, 163, 96, labioD); rect(g, 157, 96, 6, 1, labio);
    } else if (e === 'alivio') {
      [lx, rx].forEach((x) => { rect(g, x - 3, oy, 7, 1, lid); px(g, x - 4, oy - 1, lid); px(g, x + 4, oy - 1, lid); rect(g, x - 2, oy - 1, 5, 1, p.pielD); });
      rect(g, lx - 4, oy - 6, 8, 1, peloD); rect(g, rx - 3, oy - 6, 8, 1, peloD);
      rect(g, 147, 90, 4, 1, '#e09a88'); rect(g, 169, 90, 4, 1, '#e09a88');
      nariz();
      px(g, 155, 94, labioD); rect(g, 156, 95, 8, 1, labioD); px(g, 164, 94, labioD); rect(g, 157, 96, 6, 1, labio);
    } else if (e === 'sorpresa') {
      ojo(lx, oy, 4); ojo(rx, oy, 4);
      rect(g, lx - 4, oy - 8, 8, 1, peloD); rect(g, rx - 3, oy - 8, 8, 1, peloD);
      nariz();
      elipse(g, 160, 96, 2, 3, boca); px(g, 160, 93, labioD);
    } else {
      ojo(lx, oy); ojo(rx, oy);
      rect(g, lx - 4, oy - 6, 8, 1, peloD); rect(g, rx - 3, oy - 6, 8, 1, peloD);
      nariz();
      rect(g, 156, 95, 8, 1, labioD); rect(g, 157, 96, 6, 1, labio);
    }
  }

  function escritorio(g) {
    poli(g, [[0, 150], [W, 150], [W, H], [0, H]], C.mesa);
    rect(g, 0, 150, W, 2, C.mesaL); rect(g, 0, 152, W, 1, C.mesaD);
    for (let y = 156; y < H; y += 5) for (let x = (y * 7) % 23; x < W; x += 31) rect(g, x, y, 12, 1, C.mesaD);
    // tapete
    poli(g, [[74, 157], [246, 157], [258, H], [62, H]], C.tapeteD); poli(g, [[77, 159], [243, 159], [254, H], [66, H]], C.tapete);
    // hoja de historia clínica sobre el tapete
    poli(g, [[124, 162], [196, 162], [200, H], [120, H]], C.papel);
    rect(g, 132, 166, 30, 1, '#8b8574'); for (let y = 170; y < H; y += 3) rect(g, 130, y, 58, 1, C.papelDD);
    // bolígrafo
    linea(g, 202, 166, 222, 174, '#1f2a3a'); linea(g, 202, 167, 222, 175, '#33435a'); px(g, 223, 175, '#b9a26a');
    // portalápices
    rect(g, 36, 136, 18, 26, '#2f3b36'); rect(g, 36, 136, 18, 2, '#46564f'); rect(g, 37, 158, 16, 4, '#26302c');
    linea(g, 40, 136, 38, 120, '#a24b3c'); linea(g, 45, 136, 46, 118, '#2f4d6a'); linea(g, 50, 136, 53, 122, '#d9b45a'); px(g, 53, 121, '#3a2a20');
    // estetoscopio
    elipse(g, 92, 168, 14, 6, '#262626'); elipse(g, 92, 168, 12, 4, C.tapete);
    disco(g, 104, 173, 4, C.metalL); disco(g, 104, 173, 2, C.metalD); linea(g, 80, 166, 74, 158, '#262626');
    // pila de papeles y carpetas
    for (let i = 0; i < 6; i++) poli(g, [[262 + i, 154 - i * 3], [314, 154 - i * 3], [318, 162 - i * 3], [266 + i, 162 - i * 3]], i % 2 ? C.papel : C.papelD);
    poli(g, [[258, 162], [318, 162], [320, 178], [262, 178]], '#8a6a45'); poli(g, [[258, 162], [318, 162], [319, 165], [259, 165]], '#a07c52');
  }


  // ------------------------------------------------------------ vista lateral (paciente sentada o de pie)
  // ------------------------------------------------------------ paciente de frente sobre la camilla vista de lado
  function cabezaFrente(g, cx, cy, p, ex) {
    const osc = '#2a1a12', ojoB = '#efe8dc', boca = '#9a4a42';
    if (p.coleta) capsula(g, cx + 9, cy - 6, cx + 13, cy + 10, 3, p.pelo);
    elipse(g, cx, cy, 12, 13, p.pelo);
    elipse(g, cx, cy + 2, 10, 11, p.piel);
    for (let y = cy - 4; y <= cy + 10; y++) px(g, cx + 9, y, p.pielD);
    poli(g, [[cx - 11, cy - 3], [cx - 8, cy - 10], [cx + 2, cy - 13], [cx + 10, cy - 8], [cx + 11, cy - 1], [cx + 6, cy - 6], [cx - 2, cy - 5], [cx - 8, cy + 1]], p.pelo);
    capsula(g, cx - 10, cy - 2, cx - 11, cy + 9, 1, p.pelo); capsula(g, cx + 10, cy - 2, cx + 11, cy + 9, 1, p.pelo);
    if (p.gorro) { poli(g, [[cx - 10, cy - 8], [cx - 8, cy - 15], [cx + 8, cy - 15], [cx + 10, cy - 8]], '#ecebe6'); rect(g, cx - 1, cy - 14, 2, 5, '#a24b3c'); rect(g, cx - 3, cy - 12, 6, 2, '#a24b3c'); }
    const [lx, rx, oy] = [cx - 4, cx + 4, cy + 1];
    const ojo = (x) => { rect(g, x - 2, oy - 1, 4, 2, ojoB); rect(g, x - 1, oy - 1, 2, 2, p.ojos || osc); rect(g, x - 2, oy - 2, 5, 1, osc); };
    if (ex === 'dolor') {
      linea(g, lx - 2, oy - 1, lx + 1, oy, osc); linea(g, lx + 1, oy, lx - 2, oy + 1, osc);
      linea(g, rx + 2, oy - 1, rx - 1, oy, osc); linea(g, rx - 1, oy, rx + 2, oy + 1, osc);
      linea(g, lx - 3, oy - 4, lx + 2, oy - 5, osc); linea(g, rx - 2, oy - 5, rx + 3, oy - 4, osc);
      rect(g, cx - 3, cy + 7, 6, 3, '#7a2c26'); rect(g, cx - 2, cy + 8, 4, 1, ojoB);
      elipse(g, cx + 8, cy - 4, 1, 2, '#a9d8ee');
    } else if (ex === 'alivio') {
      [lx, rx].forEach((x) => { rect(g, x - 2, oy, 4, 1, osc); px(g, x - 2, oy - 1, osc); px(g, x + 1, oy - 1, osc); rect(g, x - 2, oy - 4, 4, 1, osc); });
      rect(g, cx - 2, cy + 8, 4, 1, boca); px(g, cx - 3, cy + 7, boca); px(g, cx + 2, cy + 7, boca);
    } else {
      ojo(lx); ojo(rx);
      if (ex === 'preocupada') { linea(g, lx - 2, oy - 4, lx + 1, oy - 5, osc); linea(g, rx - 1, oy - 5, rx + 2, oy - 4, osc); }
      else { rect(g, lx - 2, oy - 4, 4, 1, osc); rect(g, rx - 2, oy - 4, 4, 1, osc); }
      if (ex === 'sorpresa') elipse(g, cx, cy + 8, 1, 2, '#7a2c26'); else if (ex === 'preocupada') { rect(g, cx - 2, cy + 8, 4, 1, boca); px(g, cx - 3, cy + 9, boca); px(g, cx + 2, cy + 9, boca); } else rect(g, cx - 2, cy + 8, 4, 1, boca);
    }
    px(g, cx, cy + 4, p.pielD); px(g, cx + 1, cy + 5, p.pielD);
  }

  function fondoLateral(g, o) {
    textura(g, 0, 0, W, 132, C.pared, C.paredL, C.paredD);
    rect(g, 0, 130, W, 2, C.maderaDD);
    for (let x = 0; x < W; x += 26) { rect(g, x, 132, 26, 30, C.madera); rect(g, x + 3, 136, 20, 22, C.maderaD); rect(g, x + 3, 136, 20, 1, C.maderaDD); }
    rect(g, 0, 132, W, 1, C.maderaL);
    for (let y = 162, f = 0; y < H; y += 6, f++) for (let x = -14, k = 0; x < W; x += 14, k++) rect(g, x + (f % 2 ? 7 : 0), y, 14, 6, (k + f) % 2 ? '#c6d3d8' : '#bdcbd1');
    rect(g, 0, 162, W, 1, '#9fb0b6');
    relojDigital(g, 18, 10, o.hora);
    rect(g, 96, 14, 30, 34, C.maderaDD); rect(g, 98, 16, 26, 30, '#e9e2cf'); rect(g, 108, 21, 6, 20, '#a24b3c'); rect(g, 102, 28, 18, 6, '#a24b3c');
    rect(g, 136, 20, 44, 26, C.maderaDD); rect(g, 138, 22, 40, 22, '#ebe5d3'); rect(g, 143, 27, 30, 1, '#9b9483'); rect(g, 145, 31, 26, 1, '#b8b19f'); disco(g, 171, 39, 3, '#b85b45');
    // soporte de suero
    rect(g, 196, 30, 2, 128, C.metalD); rect(g, 188, 28, 18, 2, C.metalD); rect(g, 188, 158, 18, 2, C.metalDD);
    if (o.suero) { rect(g, 190, 32, 10, 16, '#d4e2e6'); rect(g, 190, 32, 10, 2, '#aac0c7'); linea(g, 195, 48, 195, 70, '#b5c9cf'); linea(g, 195, 70, 250, 84, '#b5c9cf'); }
    // camilla vista de lado (≈80 % del ancho)
    g.save(); g.translate(0, 12);
    elipse(g, 160, 150, 132, 3, '#a9b8be');
    rect(g, 44, 110, 4, 36, C.metalD); rect(g, 272, 110, 4, 36, C.metalD);
    disco(g, 46, 148, 3, '#222'); disco(g, 274, 148, 3, '#222');
    rect(g, 32, 108, 256, 4, C.metal); rect(g, 32, 111, 256, 1, C.metalD);
    rect(g, 31, 97, 258, 12, C.metalDD); rect(g, 32, 98, 256, 10, '#e9eef0'); rect(g, 32, 98, 256, 2, '#f8fbfc'); rect(g, 32, 106, 256, 2, '#c9d5da');
    elipse(g, 52, 94, 16, 4, '#d3dde1'); elipse(g, 52, 93, 15, 3, '#fbfdfe');
    g.restore();
  }

  // Brazo del médico en primera persona: entra desde el borde inferior de la imagen
  function brazoLateral(g, m, tipo) {
    const [x, y] = m;
    if (tipo === 'manguito') {
      rect(g, x - 6, y - 5, 12, 11, '#2f4d6a'); rect(g, x - 6, y, 12, 1, '#4a6d8f');
      linea(g, x, y + 6, x - 8, y + 40, '#333');
      capsula(g, x - 36, H + 8, x - 12, y + 46, 6, BATA); elipse(g, x - 9, y + 44, 6, 5, MANO_MED); elipse(g, x - 8, y + 41, 3, 4, '#1c1c1c');
      return;
    }
    capsula(g, x + 26, H + 10, x + 6, y + 10, 6, BATA);
    rect(g, x + 2, y + 8, 9, 3, '#3fb6a8');
    elipse(g, x + 3, y + 4, 6, 5, MANO_MED);
    if (tipo === 'esteto') { disco(g, x, y, 4, '#c0c6cc'); disco(g, x, y, 2, '#8a939b'); linea(g, x + 3, y + 2, x + 40, H, '#3a3d40'); }
  }

  // ------------------------------------------------------------ escena completa
  function escena(c, o) {
    const g = ctx(c);
    g.clearRect(0, 0, W, H);
    if (o.lugar === 'consultorio') {
      fondoConsultorio(g, o);
      const fig = lienzo(W, H), fg = ctx(fig);
      busto(fg, o.pal, o.expr || 'neutral');
      contorno(fig, '#1d1410');
      g.drawImage(fig, 0, 0);
      escritorio(g);
      vineta(c);
      return;
    }
    const pose = POSES[o.pose] || POSES.supino;
    // sentada o de pie: vista lateral de la camilla
    if (pose.vistaLateral) {
      fondoLateral(g, o);
      const fig = lienzo(W, H), fg = ctx(fig);
      pose.dibujar(fg, o.pal, o.expr || 'neutral', o.variante);
      contorno(fig, '#1d1410');
      g.drawImage(fig, 0, 0);
      if (o.accesorio && o.marca) {
        const m = pose.marcas()[o.marca];
        if (m) {
          const capa = lienzo(W, H), cg = ctx(capa);
          brazoLateral(cg, m, o.accesorio);
          contorno(capa, '#1d1410');
          g.drawImage(capa, 0, 0);
        }
      }
      if (!o.sinVineta) vineta(c, 0.3);
      return;
    }
    // acostada: vista aérea de la camilla
    fondoArriba(g, o);
    const fig = lienzo(W, H), fg = ctx(fig);
    pose.dibujar(fg, o.pal, o.expr || 'neutral', o.variante);
    contorno(fig, '#1d1410');
    g.drawImage(fig, 0, 0);
    if (o.accesorio && o.marca) {
      const m = pose.marcas(o.variante)[o.marca];
      if (m) {
        const capa = lienzo(W, H), cg = ctx(capa);
        const lado = (o.pose === 'sedestacion' || o.pose === 'bipedestacion') && o.marca !== 'espalda' ? 'sur' : 'norte';
        medicoArriba(cg, m, o.accesorio, lado);
        contorno(capa, '#1d1410');
        g.drawImage(capa, 0, 0);
      }
    }
    if (!o.sinVineta) vineta(c, 0.22);
  }

  // Miniatura (para los botones de posición): la escena completa a la mitad
  function miniatura(c, pose, pal, expr) {
    const tmp = lienzo(W, H);
    escena(tmp, { lugar: 'box', pose, pal, expr, sinVineta: true });
    const g = ctx(c);
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(tmp, 0, 0, W, H, 0, 0, c.width, c.height);
  }

  // ------------------------------------------------------------ zoom (inserto) de maniobras
  const ZOOM_PUNTOS = { mcburney: [20, 32], fii: [44, 32], hcd: [21, 17], centro: [32, 25] };
  function zoom(c, o, parpadeo) {
    const g = ctx(c), pal = o.pal;
    g.clearRect(0, 0, 64, 48);
    rect(g, 0, 0, 64, 48, '#0d1828');
    const marca = (x, y) => { if (!parpadeo) return; px(g, x, y, '#ff3b3b'); px(g, x - 2, y, '#ff3b3b'); px(g, x + 2, y, '#ff3b3b'); px(g, x, y - 2, '#ff3b3b'); px(g, x, y + 2, '#ff3b3b'); };
    const mano = (x, y, dy = 0) => {
      const capa = lienzo(64, 48), cg = ctx(capa);
      capsula(cg, x + 8, y - 8 + dy, x + 16, y - 18 + dy, 2, BATA);
      elipse(cg, x + 3, y - 2 + dy, 5, 3, MANO_MED);
      contorno(capa);
      g.drawImage(capa, 0, 0);
    };
    if (o.tipo === 'espalda') {
      poli(g, [[10, 0], [54, 0], [56, 46], [8, 46]], pal.piel);
      punteada(g, 32, 1, 32, 45, pal.pielD);
      linea(g, 14, 8, 24, 16, pal.pielD); linea(g, 50, 8, 40, 16, pal.pielD);
      linea(g, 32, 26, 46, 33, pal.pielD); linea(g, 32, 26, 18, 33, pal.pielD);
      const dy = parpadeo ? 2 : 0;
      marca(40, 30);
      const capa = lienzo(64, 48), cg = ctx(capa);
      elipse(cg, 46, 22 + dy, 5, 4, MANO_MED); rect(cg, 42, 19 + dy, 8, 1, '#c08b62');
      capsula(cg, 50, 18 + dy, 60, 8 + dy, 2, BATA);
      contorno(capa); g.drawImage(capa, 0, 0);
      if (parpadeo) { px(g, 38, 25, '#ffd166'); px(g, 36, 23, '#ffd166'); px(g, 44, 29, '#ffd166'); }
      return;
    }
    // abdomen (vista anterior; el lado derecho de la paciente queda a la izquierda)
    rect(g, 10, 0, 44, 3, pal.ropa);
    poli(g, [[12, 3], [52, 3], [54, 30], [50, 46], [14, 46], [10, 30]], pal.piel);
    rect(g, 10, 43, 44, 5, '#79c2a2');
    linea(g, 32, 6, 20, 14, pal.pielD); linea(g, 20, 14, 13, 18, pal.pielD);
    linea(g, 32, 6, 44, 14, pal.pielD); linea(g, 44, 14, 51, 18, pal.pielD);
    for (let y = 4; y < 43; y += 3) px(g, 32, y, '#d9a27a');
    for (let x = 12; x < 53; x += 3) px(g, x, 25, '#d9a27a');
    px(g, 32, 25, '#8b5a3c'); px(g, 32, 26, '#a8714d');
    px(g, 14, 36, pal.pielD); px(g, 50, 36, pal.pielD);
    punteada(g, 32, 26, 15, 35, '#b07a55');
    const P = ZOOM_PUNTOS, z = o.zona;
    if (z === 'insp') { if (parpadeo) { linea(g, 12, 3, 52, 3, '#ffd166'); linea(g, 10, 30, 14, 46, '#ffd166'); linea(g, 54, 30, 50, 46, '#ffd166'); } }
    else if (z === 'ausc') {
      linea(g, 32, 25, 46, 2, '#4a4f55'); disco(g, 32, 25, 3, '#c0c6cc'); disco(g, 32, 25, 1, '#7c858e');
      if (parpadeo) { px(g, 38, 20, '#ffd166'); px(g, 26, 30, '#ffd166'); }
    }
    else if (z === 'perc') { mano(P.mcburney[0], P.mcburney[1], parpadeo ? -2 : 0); marca(...P.mcburney); }
    else if (z === 'psup') mano(P.mcburney[0] - 2, P.mcburney[1] + 1);
    else if (z === 'mcburney') { mano(...P.mcburney); marca(...P.mcburney); }
    else if (z === 'blumberg') {
      mano(P.mcburney[0], P.mcburney[1], parpadeo ? -5 : 0); marca(...P.mcburney);
      if (parpadeo) { linea(g, 28, 34, 28, 26, '#ffd166'); px(g, 27, 27, '#ffd166'); px(g, 29, 27, '#ffd166'); }
    }
    else if (z === 'rovsing') {
      mano(...P.fii); marca(...P.mcburney);
      if (parpadeo) punteada(g, 40, 34, 24, 34, '#ffd166', 2);
    }
    else if (z === 'murphy') { mano(...P.hcd); marca(...P.hcd); }
  }

  // ------------------------------------------------------------ retratos 64x64 (recorte del busto)
  const FONDO_RETRATO = { paciente: '#3a3226', enfermera: '#33293f', medico: '#1c2f3d', narrador: '#26302a' };
  function retrato(c, quien, expr, pal) {
    const g = ctx(c);
    g.clearRect(0, 0, 64, 64);
    textura(g, 0, 0, 64, 64, FONDO_RETRATO[quien] || '#26302a', 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.12)');
    const capa = lienzo(64, 64), f = ctx(capa);
    if (quien === 'narrador') {
      rect(f, 17, 10, 30, 46, '#8a6a45'); rect(f, 20, 15, 24, 38, C.papel); rect(f, 25, 7, 14, 6, C.metal);
      for (let y = 21; y < 50; y += 5) rect(f, 24, y, y % 10 ? 16 : 12, 1, C.papelDD);
      rect(f, 22, 21, 2, 2, '#3fb6a8');
      contorno(capa, '#1d1410'); g.drawImage(capa, 0, 0);
      return;
    }
    if (quien === 'medico') {
      poli(f, [[4, 64], [8, 50], [20, 43], [44, 43], [56, 50], [60, 64]], BATA);
      poli(f, [[25, 43], [32, 55], [39, 43]], '#3f8f86');
      linea(f, 24, 44, 29, 63, '#cfd0c8'); linea(f, 40, 44, 35, 63, '#cfd0c8');
      rect(f, 26, 36, 12, 8, '#22323f');
      elipse(f, 32, 24, 13, 15, '#2c4252');
      capsula(f, 20, 42, 18, 54, 1, '#3a3d40'); capsula(f, 44, 42, 46, 54, 1, '#3a3d40'); disco(f, 46, 57, 3, '#b7bdc2');
      contorno(capa, '#1d1410'); g.drawImage(capa, 0, 0);
      px(g, 46, 57, '#7c858e');
      return;
    }
    if (quien === 'enfermera') { // voz fuera de pantalla: solo un ícono de altavoz con ondas
      rect(f, 14, 24, 10, 16, '#6d5a8a'); poli(f, [[24, 24], [36, 12], [36, 52], [24, 40]], '#806c9e');
      contorno(capa, '#1d1410'); g.drawImage(capa, 0, 0);
      [[42, 26, 6], [46, 22, 10], [50, 18, 14]].forEach(([x, y, h], i) => { rect(g, x, y + 2, 2, h * 2 - 4, i === 2 ? '#806c9e' : '#b9a0dd'); px(g, x - 1, y + 1, '#b9a0dd'); px(g, x - 1, y + h * 2 - 2, '#b9a0dd'); });
      return;
    }
    const tmp = lienzo(W, H), tg = ctx(tmp);
    busto(tg, pal, expr);
    contorno(tmp, '#1d1410');
    g.drawImage(tmp, 128, 52, 64, 64, 0, 0, 64, 64);
  }

  window.Pixel = { W, H, POSES, escena, miniatura, zoom, retrato };
})();
