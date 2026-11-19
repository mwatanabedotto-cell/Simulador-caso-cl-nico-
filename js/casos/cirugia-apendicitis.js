/*
 * Caso 1 — Cirugía general: Apendicitis aguda
 * Formato de datos documentado en README.md
 */
(function () {
  'use strict';
  window.CASOS = window.CASOS || [];

  // Atajo para líneas de diálogo: [quien, texto, expresión]
  const P = (t, e) => ['paciente', t, e];
  const M = (t) => ['medico', t];
  const N = (t) => ['narrador', t];
  const E = (t) => ['enfermera', t];

  window.CASOS.push({
    id: 'cirugia-apendicitis',
    area: 'Cirugía general',
    areaCorta: 'Cirugía',
    color: '#e0795b',
    titulo: 'Dolor en fosa ilíaca derecha',
    subtitulo: 'Urgencias · Mujer de 24 años',
    dificultad: 'Intermedio',
    duracionExamen: 600, // segundos (modo examen, como la estación del PEP)
    horaLlegada: [14, 10],

    paciente: {
      nombre: 'Laura Méndez',
      nombreCompleto: 'Laura Méndez Ortiz',
      sexo: 'Femenino',
      corto: 'Laura',
      edad: 24,
      // paleta de la ilustración (bata = ropa en el box; suéter = ropa en el consultorio)
      arte: {
        piel: '#f6c7a1', pielD: '#e0a27c', pielL: '#ffe0c7', pielDD: '#c9845e',
        pelo: '#5a3524', peloD: '#2f1b12', peloL: '#7a4a32', ojos: '#6b3e1f',
        ropa: '#6ec6f0', ropaD: '#3fa3d6', zapato: '#34495e',
        sueter: '#16a085', sueterD: '#0e7a64', sueterL: '#1fc2a0', cuello: '#ffffff',
      },
    },
    personajes: {
      paciente: { nombre: 'Laura', clase: 'pac' },
      medico: { nombre: 'Tú (médico/a de guardia)', clase: 'med' },
      enfermera: { nombre: 'Enf. Rosa (fuera de escena)', clase: 'enf' },
      narrador: { nombre: '', clase: 'nar' },
    },
    exprInicial: 'dolor',
    posInicial: 'sedestacion',

    escenario: {
      lugar: 'Servicio de Urgencias — Hospital General',
      texto:
        'Mujer de 24 años acude a urgencias por dolor abdominal. En el triaje fue clasificada como **amarillo (urgente)**. Usted es el/la médico/a de guardia.',
      tareas: [
        'Decidir dónde ubicar y atender a la paciente.',
        'Realizar la anamnesis dirigida.',
        'Realizar el examen físico pertinente.',
        'Solicitar e interpretar los exámenes complementarios.',
        'Formular el diagnóstico sindrómico, el etiológico y los diferenciales.',
        'Definir la conducta y comunicarla a la paciente.',
      ],
    },

    introLineas: [
      E('Doc, buenas tardes. Llegó una paciente con dolor abdominal: se llama Laura y tiene 24 años.'),
      E('En el triaje: FC 104, temperatura 38,1 °C, PA 118/76, saturación 98 % y dolor 8 sobre 10. La clasifiqué como **amarillo (urgente)**.'),
      E('¿Dónde la ubico, Doc?'),
    ],

    // Decisión inicial: dónde ubicar y atender a la paciente
    ubicacion: {
      pregunta: '¿Dónde vas a ubicar y atender a Laura?',
      opciones: [
        {
          id: 'u_box', texto: 'Box de emergencia (camilla, monitor y acceso venoso)', lugar: 'box', tiempo: 2, flags: ['ubic_ok'],
          hc: ['Plan', 'Ubicación: box de emergencia (triaje amarillo).'],
          lineas: [E('Perfecto, Doc. La paso al box 3 y le dejo el monitor listo.')],
        },
        {
          id: 'u_cons', texto: 'Consultorio de atención ambulatoria', lugar: 'consultorio', tiempo: 2, flags: ['ubic_cons'],
          hc: ['Plan', 'Ubicación: consultorio ambulatorio.'],
          lineas: [E('¿Al consultorio, Doc? Tiene fiebre, está taquicárdica y con mucho dolor… Bueno, se la traigo.')],
        },
        {
          id: 'u_rcp', texto: 'Sala de reanimación (shock room)', lugar: 'box', tiempo: 5, flags: ['ubic_reanimacion'],
          hc: ['Plan', 'Ubicación: se solicitó sala de reanimación; queda en box de emergencia.'],
          lineas: [E('Doc, la sala de reanimación es para pacientes críticos (rojos) y ahora está ocupada con un politraumatizado. La dejo en el box 3.')],
        },
        {
          id: 'u_esp', texto: 'Que espere en la sala de espera hasta que se libere un lugar', lugar: 'box', tiempo: 60, estabilidad: -10, flags: ['ubic_espera'],
          hc: ['Plan', 'Esperó 1 h en la sala de espera antes de ser atendida.'],
          lineas: [N('Laura espera una hora en la sala de espera, doblada de dolor…'), E('¡Doc! Laura vomitó en la sala de espera y está más pálida. La paso ya al box 3.')],
        },
      ],
      llegada: {
        box: [N('Entras al box de emergencia. Laura está sentada en la camilla, encorvada, con una mano sobre el lado derecho del abdomen.'), P('Doctor/a… menos mal que llegó. Me duele mucho.', 'dolor')],
        consultorio: [N('Laura entra al consultorio caminando encorvada y se sienta frente a tu escritorio, con una mano sobre el lado derecho del abdomen.'), P('Doctor/a… me duele mucho.', 'dolor')],
      },
    },

    hcSecciones: [
      'Identificación', 'Motivo de consulta', 'Enfermedad actual', 'Antecedentes',
      'Gineco-obstétricos', 'Hábitos', 'Examen físico', 'Laboratorio', 'Imagen',
      'Impresión diagnóstica', 'Plan',
    ],

    referencias: {
      wses: 'Di Saverio S, Podda M, De Simone B, et al. Diagnosis and treatment of acute appendicitis: 2020 update of the WSES Jerusalem guidelines. World J Emerg Surg. 2020;15:27.',
      alvarado: 'Alvarado A. A practical score for the early diagnosis of acute appendicitis. Ann Emerg Med. 1986;15(5):557-564.',
      cochrane: 'Manterola C, Vial M, Moraga J, Astudillo P. Analgesia in patients with acute abdominal pain. Cochrane Database Syst Rev. 2011;(1):CD005660.',
      coda: 'CODA Collaborative. A Randomized Trial Comparing Antibiotics with Appendectomy for Appendicitis. N Engl J Med. 2020;383:1907-1919.',
      sabiston: 'Townsend CM, Beauchamp RD, Evers BM, Mattox KL. Sabiston Textbook of Surgery. 21st ed. Elsevier; 2022. Cap. "The Appendix".',
      porto: 'Porto CC. Semiologia Médica. 8ª ed. Rio de Janeiro: Guanabara Koogan; 2019.',
      bratzler: 'Bratzler DW, Dellinger EP, Olsen KM, et al. Clinical practice guidelines for antimicrobial prophylaxis in surgery. Am J Health Syst Pharm. 2013;70(3):195-283.',
      manchester: 'Mackway-Jones K, Marsden J, Windle J, editores. Emergency Triage: Manchester Triage Group. 3rd ed. Chichester: Wiley-Blackwell; 2014.',
      oms: 'Organización Mundial de la Salud. Directrices de la OMS sobre higiene de las manos en la atención sanitaria (5 momentos). Ginebra: OMS; 2009.',
    },

    // ---------------------------------------------------------------- FASES
    fases: [
      // ============================ 1. ANAMNESIS
      {
        id: 'anamnesis',
        titulo: 'Anamnesis',
        tipo: 'acciones',
        ayuda: 'Elige qué preguntar. Cada pregunta consume tiempo clínico. Los grupos se van desbloqueando a medida que avanzas.',
        grupos: [
          {
            titulo: 'Presentación',
            opciones: [
              {
                id: 'pres', texto: 'Presentarte a la paciente', tiempo: 1, flags: ['presentacion'],
                lineas: [M('Buenas tardes, soy el/la médico/a de guardia y voy a atenderla hoy.'), P('Buenas tardes… gracias.', 'dolor')],
              },
              {
                id: 'manos', texto: 'Higienizar las manos (alcohol en gel)', tiempo: 1, flags: ['higiene'],
                lineas: [N('Te higienizas las manos con alcohol en gel frente a la paciente.')],
              },
              {
                id: 'ident', texto: '«¿Cuál es su nombre completo, su edad y a qué se dedica?»', tiempo: 1, flags: ['identifica'],
                hc: ['Identificación', 'Laura Méndez Ortiz, 24 años, sexo femenino, soltera, estudiante de Administración. Procedente de la ciudad.'],
                lineas: [P('Laura Méndez Ortiz, tengo 24 años. Estudio Administración y trabajo medio tiempo en una tienda.', 'dolor')],
              },
              {
                id: 'mc', texto: '«¿Qué la trae por aquí hoy?»', tiempo: 1, flags: ['motivo'],
                hc: ['Motivo de consulta', '«Dolor de barriga» de ~18 horas de evolución.'],
                lineas: [P('Me duele mucho la barriga, aquí abajo, a la derecha. Empezó ayer en la noche y cada vez está peor.', 'dolor')],
              },
            ],
          },
          {
            titulo: 'Caracterización del dolor',
            requiere: 'motivo',
            opciones: [
              {
                id: 'd_inicio', texto: '«¿Cuándo y cómo empezó? ¿De repente o poco a poco?»', tiempo: 1, flags: ['d_inicio'],
                hc: ['Enfermedad actual', 'Dolor de inicio insidioso hace ~18 h (ayer, a las 20:00).'],
                lineas: [P('Ayer como a las 8 de la noche. Fue poco a poco, primero como una molestia sorda.', 'dolor')],
              },
              {
                id: 'd_local', texto: '«¿Dónde empezó el dolor? Muéstreme con la mano.»', tiempo: 1, flags: ['d_localizacion'],
                hc: ['Enfermedad actual', 'Localización inicial periumbilical, difusa y mal definida.'],
                lineas: [N('Ella dibuja un círculo con la mano alrededor del ombligo.'), P('Al principio era aquí, alrededor del ombligo. No podía decir un punto exacto.', 'dolor')],
              },
              {
                id: 'd_migra', texto: '«¿El dolor ha cambiado de lugar?»', tiempo: 1, flags: ['d_migracion'],
                hc: ['Enfermedad actual', 'Migración hacia la fosa ilíaca derecha (FID) hace ~8 h; ahora el dolor es localizado.'],
                lineas: [P('Sí… desde esta mañana se me pasó aquí abajo, a la derecha. Ahora lo siento en un punto, justo aquí.', 'dolor'), N('Señala con un dedo un punto en la fosa ilíaca derecha.')],
              },
              {
                id: 'd_tipo', texto: '«¿Cómo es el dolor y qué tan fuerte es, del 0 al 10?»', tiempo: 1, flags: ['d_caracter'],
                hc: ['Enfermedad actual', 'Dolor continuo, tipo «inflamación interna», de intensidad 7–8/10.'],
                lineas: [P('Ahora es constante, como si algo se me estuviera inflamando por dentro. Un 7… un 8 cuando me muevo.', 'dolor')],
              },
              {
                id: 'd_agrav', texto: '«¿Hay algo que lo empeore o que lo alivie?»', tiempo: 1, flags: ['d_factores'],
                hc: ['Enfermedad actual', 'Empeora con el movimiento, la tos y las vibraciones; se alivia parcialmente en reposo con las caderas flexionadas.'],
                lineas: [P('Empeora cuando camino o toso, y en el taxi cada bache me dolía horrible. Si me quedo quieta y encogida, se calma un poco.', 'dolor')],
              },
              {
                id: 'd_irrad', texto: '«¿El dolor se va hacia la espalda, la pierna u otro lugar?»', tiempo: 1, flags: ['d_irradiacion'],
                hc: ['Enfermedad actual', 'Sin irradiación significativa (leve molestia hacia la ingle derecha).'],
                lineas: [P('No, se queda aquí. A veces tira un poquito hacia la ingle, pero poco.', 'dolor')],
              },
              {
                id: 'd_medic', texto: '«¿Tomó algún medicamento para el dolor?»', tiempo: 1, flags: ['d_automed'],
                hc: ['Enfermedad actual', 'Automedicación: ibuprofeno 400 mg anoche, con alivio parcial y transitorio.'],
                lineas: [P('Un ibuprofeno anoche. Me alivió un rato, pero después volvió más fuerte.', 'preocupada')],
              },
            ],
          },
          {
            titulo: 'Síntomas acompañantes',
            requiere: 'motivo',
            opciones: [
              {
                id: 'a_nausea', texto: '«¿Ha tenido náuseas o vómitos?»', tiempo: 1, flags: ['a_nauseas'],
                hc: ['Enfermedad actual', 'Náuseas y 1 episodio de vómito alimentario, posteriores al inicio del dolor.'],
                lineas: [P('Náuseas desde anoche, y vomité una vez esta mañana. Primero empezó el dolor y después vinieron las náuseas.', 'dolor')],
              },
              {
                id: 'a_apetito', texto: '«¿Cómo está su apetito?»', tiempo: 1, flags: ['a_anorexia'],
                hc: ['Enfermedad actual', 'Anorexia: no come desde ayer al mediodía.'],
                lineas: [P('Nada. No he comido desde ayer al mediodía; no me provoca nada.', 'dolor')],
              },
              {
                id: 'a_fiebre', texto: '«¿Ha tenido fiebre o escalofríos?»', tiempo: 1, flags: ['a_fiebre'],
                hc: ['Enfermedad actual', 'Sensación febril y escalofríos en la madrugada (no medidos).'],
                lineas: [P('En la madrugada me sentí caliente y con escalofríos, pero no me tomé la temperatura.', 'dolor')],
              },
              {
                id: 'a_intest', texto: '«¿Cómo están sus deposiciones? ¿Diarrea, estreñimiento, gases?»', tiempo: 1, flags: ['a_intestinal'],
                hc: ['Enfermedad actual', 'Última deposición ayer por la mañana, normal. Niega diarrea. Elimina gases.'],
                lineas: [P('La última vez fui ayer en la mañana, normal. No tengo diarrea. Gases sí.', 'dolor')],
              },
              {
                id: 'a_urin', texto: '«¿Siente ardor al orinar, orina más seguido o con sangre?»', tiempo: 1, flags: ['a_urinario'],
                hc: ['Enfermedad actual', 'Niega disuria, polaquiuria y hematuria.'],
                lineas: [P('No, orino normal.', 'dolor')],
              },
            ],
          },
          {
            titulo: 'Historia gineco-obstétrica',
            requiere: 'motivo',
            opciones: [
              {
                id: 'g_fum', texto: '«¿Cuándo fue su última menstruación? ¿Sus ciclos son regulares?»', tiempo: 1, flags: ['g_fum'],
                hc: ['Gineco-obstétricos', 'FUM hace ~3 semanas. Ciclos regulares 28/5. G0.'],
                lineas: [P('Hace unas tres semanas, el 28 del mes pasado. Soy bien regular, cada 28 días. Nunca he estado embarazada.', 'dolor')],
              },
              {
                id: 'g_sex', texto: '«Una pregunta de rutina y confidencial: ¿tiene vida sexual activa? ¿Usa algún método anticonceptivo?»', tiempo: 1, flags: ['g_sexual'],
                hc: ['Gineco-obstétricos', 'Vida sexual activa, pareja estable. Preservativo de uso irregular.'],
                lineas: [P('Eh… sí, tengo pareja. Usamos preservativo… casi siempre.', 'preocupada')],
              },
              {
                id: 'g_flujo', texto: '«¿Ha notado flujo anormal, sangrado fuera de la regla o dolor en las relaciones?»', tiempo: 1, flags: ['g_flujo'],
                hc: ['Gineco-obstétricos', 'Niega flujo vaginal anormal, sangrado intermenstrual y dispareunia.'],
                lineas: [P('No, nada de eso.', 'dolor')],
              },
            ],
          },
          {
            titulo: 'Antecedentes y hábitos',
            requiere: 'motivo',
            opciones: [
              {
                id: 'p_pat', texto: '«¿Tiene alguna enfermedad crónica? ¿Diabetes, hipertensión, asma?»', tiempo: 1, flags: ['p_patologicos'],
                hc: ['Antecedentes', 'Personales patológicos: niega.'],
                lineas: [P('No, ninguna.', 'dolor')],
              },
              {
                id: 'p_qx', texto: '«¿La han operado o internado alguna vez?»', tiempo: 1, flags: ['p_quirurgicos'],
                hc: ['Antecedentes', 'Quirúrgicos e internaciones: niega.'],
                lineas: [P('Nunca me han operado.', 'dolor')],
              },
              {
                id: 'p_alerg', texto: '«¿Es alérgica a algún medicamento o alimento?»', tiempo: 1, flags: ['p_alergias'],
                hc: ['Antecedentes', '⚠️ ALERGIA: metamizol (dipirona), con urticaria y angioedema facial.'],
                lineas: [P('¡Sí! A la dipirona… el metamizol. Una vez me salieron ronchas y se me hinchó la cara.', 'preocupada')],
              },
              {
                id: 'p_med', texto: '«¿Toma algún medicamento de forma habitual?»', tiempo: 1, flags: ['p_medicamentos'],
                hc: ['Antecedentes', 'Medicamentos habituales: ninguno (vitaminas ocasionales). Sin anticonceptivos hormonales.'],
                lineas: [P('No, solo vitaminas de vez en cuando.', 'dolor')],
              },
              {
                id: 'p_fam', texto: '«¿Hay enfermedades importantes en su familia?»', tiempo: 1, flags: ['p_familiares'],
                hc: ['Antecedentes', 'Familiares: madre hipertensa.'],
                lineas: [P('Mi mamá es hipertensa. Mi papá está sano.', 'dolor')],
              },
              {
                id: 'h_hab', texto: '«¿Fuma, toma alcohol o usa otras sustancias?»', tiempo: 1, flags: ['h_habitos'],
                hc: ['Hábitos', 'Tabaco: no. Alcohol: social. Niega otras sustancias.'],
                lineas: [P('No fumo. Tomo algo en las fiestas, nada más.', 'dolor')],
              },
              {
                id: 'h_comida', texto: '«¿Comió algo diferente o fuera de casa en los últimos días?»', tiempo: 1, flags: ['h_alimentos'],
                hc: ['Hábitos', 'Niega transgresión alimentaria o comida fuera de casa.'],
                lineas: [P('No, lo de siempre en casa.', 'dolor')],
              },
              {
                id: 'h_viaje', texto: '«¿Ha viajado recientemente?»', tiempo: 1, flags: ['irrelevante'],
                lineas: [P('No… no he salido de la ciudad. ¿Por qué?', 'preocupada')],
              },
              {
                id: 'escucha', texto: '«¿Hay algo más que quiera contarme o que le preocupe?»', tiempo: 1, flags: ['escucha'],
                lineas: [P('Solo que tengo miedo de que sea algo grave… mi mamá está de viaje y vine sola.', 'preocupada'), M('Entiendo. Vamos a averiguar qué está pasando y no la vamos a dejar sola en esto.')],
              },
            ],
          },
        ],
      },

      // ============================ 2. EXPLORACIÓN FÍSICA
      {
        id: 'exploracion',
        titulo: 'Exploración física',
        tipo: 'acciones',
        escena: 'box',
        posiciones: true,
        posInicial: 'sedestacion',
        ayuda: 'Elige qué examinar y en qué orden. Cada maniobra se hace en una posición anatómica; en el abdomen, el orden importa.',
        // Si la paciente estaba en el consultorio, hay que trasladarla al box (consume tiempo)
        intro: (s) => {
          if (s.ubicacion === 'consultorio') {
            s.ubicacion = 'box'; s.tiempo += 10; s.flags.ubic_traslado = true;
            return [N('El consultorio no tiene monitor, oxígeno ni camilla adecuada para una paciente febril y taquicárdica con abdomen agudo.'), E('Doc, la llevo al box de emergencia para examinarla y monitorizarla… perdimos unos minutos.'), P('¿Otra vez caminar…? Ay…', 'dolor')];
          }
          return [N('Terminas la entrevista. Laura sigue en la camilla del box.'), P('¿Me acuesto aquí?', 'preocupada')];
        },
        grupos: [
          {
            titulo: 'Preparación',
            opciones: [
              {
                id: 'ef_permiso', texto: 'Explicar el examen y pedir permiso', tiempo: 1, flags: ['ef_permiso'],
                lineas: [M('Ahora voy a examinarla. Si algo le duele, me avisa, ¿de acuerdo?'), P('Está bien.', 'preocupada')],
              },
              {
                id: 'ef_manos', texto: 'Higienizar las manos antes del contacto', tiempo: 1, flags: ['higiene', 'higiene_ef'],
                lineas: [N('Te lavas las manos con agua y jabón en el lavamanos del box.')],
              },
              {
                id: 'ef_chap', texto: 'Pedir a la enfermera que acompañe el examen', tiempo: 1, flags: ['ef_chaperona'],
                lineas: [M('Rosa, ¿me acompañas durante el examen, por favor?'), E('Claro, Doc.')],
              },
            ],
          },
          {
            titulo: 'Signos vitales y estado general',
            opciones: [
              {
                id: 'ef_sv', posicion: 'sedestacion', vista: { accesorio: 'manguito', marca: 'brazo' }, texto: 'Medir signos vitales', tiempo: 3, flags: ['ef_sv'],
                hc: ['Examen físico', 'PA 118/76 mmHg · FC 104 lpm · FR 18 rpm · T 38,1 °C (axilar) · SatO₂ 98 % (aire ambiente).'],
                efecto: (s, api) => { api.monitor({ PA: '118/76', FC: 104, FR: 18, T: '38,1', SpO2: 98 }); },
                lineas: [E('Doc, ya tengo los signos: presión 118/76, frecuencia cardíaca 104, respiratoria 18, temperatura 38,1 axilar y saturación 98 % al aire.')],
              },
              {
                id: 'ef_general', posicion: 'sedestacion', texto: 'Evaluar el estado general', tiempo: 1, flags: ['ef_general'],
                hc: ['Examen físico', 'Lúcida y orientada. Regular estado general, facies de dolor. Mucosas levemente secas. Llegó a la camilla encorvada y se sienta protegiendo el hemiabdomen derecho.'],
                lineas: [N('Inspección general: lúcida y orientada, en regular estado general y con facies de dolor. Mucosas levemente secas. Llegó a la camilla encorvada y se sienta protegiendo el lado derecho.')],
              },
              {
                id: 'ef_cp', posicion: 'sedestacion', vista: { accesorio: 'esteto', marca: 'torax' }, texto: 'Auscultar corazón y pulmones', tiempo: 2, flags: ['ef_cardiopulmonar'],
                hc: ['Examen físico', 'CV: ruidos cardíacos rítmicos, taquicárdicos, sin soplos. Resp.: murmullo vesicular presente bilateralmente, sin ruidos agregados.'],
                lineas: [N('Ruidos cardíacos rítmicos y taquicárdicos, sin soplos. Murmullo vesicular presente en ambos campos, sin ruidos agregados.')],
              },
            ],
          },
          {
            titulo: 'Abdomen',
            opciones: [
              {
                id: 'ab_insp', posicion: 'supino', vista: { zoom: 'abdomen', zona: 'insp', zoomTxt: 'Inspección del abdomen' }, texto: 'Inspección', tiempo: 1, flags: ['ab_inspeccion'],
                hc: ['Examen físico', 'Abdomen: plano, simétrico, sin cicatrices ni distensión. Movilidad respiratoria disminuida en el hemiabdomen inferior.'],
                lineas: [N('Abdomen plano, simétrico, sin cicatrices ni distensión. Moviliza poco el hemiabdomen inferior al respirar.')],
              },
              {
                id: 'ab_ausc', posicion: 'supino', vista: { accesorio: 'esteto', marca: 'abdomen', zoom: 'abdomen', zona: 'ausc', zoomTxt: 'Auscultar antes de percutir y palpar' }, texto: 'Auscultación', tiempo: 2, flags: ['ab_auscultacion'],
                efecto: (s) => { if (!s.flags.ab_percusion && !s.flags.ab_palpacion) s.flags.ab_orden = true; },
                hc: ['Examen físico', 'Ruidos hidroaéreos presentes, disminuidos.'],
                lineas: [N('Ruidos hidroaéreos presentes, pero disminuidos.')],
              },
              {
                id: 'ab_perc', posicion: 'supino', vista: { accesorio: 'mano', marca: 'abdomen', zoom: 'abdomen', zona: 'perc', zoomTxt: 'Percusión: dolor en FID' }, texto: 'Percusión', tiempo: 1, flags: ['ab_percusion'],
                hc: ['Examen físico', 'Timpanismo conservado. Dolor a la percusión en la FID.'],
                lineas: [N('Timpanismo conservado. La percusión de la fosa ilíaca derecha le provoca dolor.'), P('¡Ay!', 'dolor')],
              },
              {
                id: 'ab_psup', posicion: 'supino', vista: { accesorio: 'mano', marca: 'abdomen', zoom: 'abdomen', zona: 'psup', zoomTxt: 'Palpación superficial: defensa en FID' }, texto: 'Palpación superficial', tiempo: 1, flags: ['ab_palp_sup', 'ab_palpacion'],
                hc: ['Examen físico', 'Palpación superficial: defensa muscular voluntaria en la FID; resto depresible.'],
                lineas: [N('Defensa muscular voluntaria en la fosa ilíaca derecha. El resto del abdomen es depresible.')],
              },
              {
                id: 'ab_pprof', posicion: 'supino', vista: { accesorio: 'mano', marca: 'abdomen', zoom: 'abdomen', zona: 'mcburney', zoomTxt: 'McBurney: ⅓ externo de la línea espino-umbilical' }, texto: 'Palpación profunda', tiempo: 1, flags: ['ab_palp_prof', 'ab_palpacion', 'mcburney'],
                hc: ['Examen físico', 'Palpación profunda: dolor intenso en el punto de McBurney. Sin masas ni visceromegalias.'],
                lineas: [P('¡Ay! Ahí, ahí… ¡justo ahí!', 'dolor'), N('Dolor intenso en el **punto de McBurney** (unión del tercio externo con los dos tercios internos de la línea espino-umbilical derecha). No hay masas ni visceromegalias.')],
              },
            ],
          },
          {
            titulo: 'Maniobras y signos',
            opciones: [
              {
                id: 'm_blum', posicion: 'supino', vista: { accesorio: 'mano', marca: 'abdomen', zoom: 'abdomen', zona: 'blumberg', zoomTxt: 'Blumberg: dolor al soltar bruscamente' }, texto: 'Signo de Blumberg (descompresión brusca)', tiempo: 1, flags: ['m_blumberg'],
                hc: ['Examen físico', 'Blumberg (+).'],
                lineas: [P('¡Aaay! Me dolió más cuando soltó.', 'dolor'), N('**Blumberg positivo**: dolor a la descompresión brusca en la FID, que indica irritación peritoneal.')],
              },
              {
                id: 'm_rovs', posicion: 'supino', vista: { accesorio: 'mano', marca: 'abdomen', zoom: 'abdomen', zona: 'rovsing', zoomTxt: 'Rovsing: presión en FII → dolor en FID' }, texto: 'Signo de Rovsing', tiempo: 1, flags: ['m_rovsing'],
                hc: ['Examen físico', 'Rovsing (+).'],
                lineas: [N('Al comprimir la fosa ilíaca **izquierda**, la paciente refiere dolor en la **derecha**: **Rovsing positivo**.')],
              },
              {
                id: 'm_psoas', posicion: 'lateral', vista: { variante: 'psoas', accesorio: 'mano', marca: 'rodilla' }, texto: 'Signo del psoas', tiempo: 1, flags: ['m_psoas'],
                hc: ['Examen físico', 'Psoas (+).'],
                lineas: [N('En decúbito lateral izquierdo, la extensión pasiva de la cadera derecha provoca dolor: **psoas positivo** (sugiere un apéndice retrocecal).')],
              },
              {
                id: 'm_obt', posicion: 'supino', vista: { variante: 'obturador', accesorio: 'mano', marca: 'rodilla' }, texto: 'Signo del obturador', tiempo: 1, flags: ['m_obturador'],
                hc: ['Examen físico', 'Obturador (−).'],
                lineas: [N('La rotación interna del muslo derecho flexionado no provoca dolor: **obturador negativo**.')],
              },
              {
                id: 'm_gior', posicion: 'sedestacion', vista: { zoom: 'espalda', zona: 'giordano', zoomTxt: 'Puñopercusión del ángulo costovertebral' }, texto: 'Puñopercusión lumbar (Giordano)', tiempo: 1, flags: ['m_giordano'],
                hc: ['Examen físico', 'Puñopercusión lumbar (Giordano) negativa bilateral.'],
                lineas: [N('**Puñopercusión lumbar negativa** bilateral: es poco probable una pielonefritis.')],
              },
              {
                id: 'm_murphy', posicion: 'supino', vista: { accesorio: 'mano', marca: 'abdomen', zoom: 'abdomen', zona: 'murphy', zoomTxt: 'Murphy: bajo el reborde costal derecho' }, texto: 'Signo de Murphy', tiempo: 1, flags: ['m_murphy'],
                hc: ['Examen físico', 'Murphy (−).'],
                lineas: [N('**Murphy negativo**: no hay detención inspiratoria a la palpación del hipocondrio derecho.')],
              },
            ],
          },
          {
            titulo: 'Examen ginecológico y otros',
            opciones: [
              {
                id: 'gin', posicion: 'litotomia', texto: 'Examen ginecológico (especuloscopía y tacto bimanual)', tiempo: 4, flags: ['gin_examen'],
                hc: ['Examen físico', 'Especuloscopía: cuello sano, sin flujo patológico ni sangrado. Tacto bimanual: movilización cervical indolora, anexos no palpables, fondo de saco no abombado.'],
                efecto: (s) => {
                  if (!s.flags.ef_chaperona) {
                    s.flags.gin_sin_chaperona = true;
                    return [N('Nota: realizas el examen íntimo sin acompañante.')];
                  }
                },
                lineas: [M('Laura, voy a hacer un examen ginecológico. Es importante para descartar otras causas del dolor. ¿Me autoriza?'), P('Sí, está bien.', 'preocupada'),
                  N('Cuello uterino sano, sin flujo patológico ni sangrado. **La movilización cervical es indolora**, los anexos no se palpan y el fondo de saco no está abombado.')],
              },
              {
                id: 'tacto', posicion: 'lateral', texto: 'Tacto rectal', tiempo: 3, flags: ['tacto_rectal'],
                hc: ['Examen físico', 'Tacto rectal: ampolla vacía, dolor leve a la derecha.'],
                lineas: [P('¿Eso es necesario…?', 'preocupada'), N('Ampolla rectal vacía y dolor leve hacia la derecha. En este contexto aporta poca información diagnóstica adicional.')],
              },
            ],
          },
        ],
      },

      // ============================ 3. LABORATORIO Y GABINETE
      {
        id: 'estudios',
        titulo: 'Laboratorio y gabinete',
        tipo: 'solicitud',
        ayuda: 'Llena la hoja de solicitud: marca los exámenes, firma y envía. Los exámenes de una misma hoja se procesan en paralelo (demora el más lento). Pedir de más también cuenta.',
        intro: [N('Vuelves al consultorio con Laura y tomas una hoja de solicitud de exámenes.'), E('Doc, cuando tenga la hoja firmada, tomo las muestras y aviso a imagen.')],
        institucion: 'HOSPITAL GENERAL',
        servicio: 'Servicio de Urgencias',
        ubicacion: 'Box 3',
        textoEnvio: 'Recibí la solicitud, Doc. Ya tomo las muestras y aviso a imagen.',
        secciones: [
          {
            titulo: 'Hematología',
            opciones: [
              {
                id: 'lab_hemo', texto: 'Hemograma completo', tiempo: 30, flags: ['lab_hemograma'],
                hc: ['Laboratorio', 'Hemograma: Hb 13,1 g/dL · Leucocitos 14 800/mm³ (neutrófilos 72 %, bastones 3 %) · Plaquetas 268 000/mm³.'],
                lineas: [{ quien: 'enfermera', texto: 'Doc, llegó el hemograma.', reporte: { titulo: 'Hemograma', filas: [
                  ['Hemoglobina', '13,1 g/dL', '12–16'], ['Hematocrito', '39 %', '36–46'],
                  ['Leucocitos', '14 800 /mm³', '4 000–10 000', true], ['Neutrófilos', '72 %', '40–75'],
                  ['Bastones', '3 %', '0–5'], ['Linfocitos', '20 %', '20–45'], ['Plaquetas', '268 000 /mm³', '150 000–450 000'],
                ] } }],
              },
              {
                id: 'lab_coag', texto: 'Coagulograma (TP/INR, TTPa)', tiempo: 30, flags: ['lab_coag'],
                hc: ['Laboratorio', 'Coagulograma: INR 1,0 · TTPa 29 s.'],
                lineas: [{ quien: 'enfermera', texto: 'Coagulograma normal.', reporte: { titulo: 'Coagulograma', filas: [['INR', '1,0', '0,8–1,2'], ['TTPa', '29 s', '25–35']] } }],
              },
              {
                id: 'lab_vsg', texto: 'Velocidad de sedimentación (VSG)', tiempo: 30, flags: ['lab_vsg'],
                hc: ['Laboratorio', 'VSG: 28 mm/h (VR < 20).'],
                lineas: [{ quien: 'enfermera', texto: 'Llegó la VSG.', reporte: { titulo: 'Hematología', filas: [['VSG', '28 mm/h', '< 20', true]] } }],
              },
              {
                id: 'lab_grupo', texto: 'Grupo sanguíneo y factor Rh', tiempo: 30, flags: ['lab_grupo'],
                hc: ['Laboratorio', 'Grupo sanguíneo: O, Rh positivo.'],
                lineas: [{ quien: 'enfermera', texto: 'Tipificación lista.', reporte: { titulo: 'Inmunohematología', filas: [['Grupo ABO', 'O', '—'], ['Factor Rh', 'Positivo', '—']] } }],
              },
            ],
          },
          {
            titulo: 'Bioquímica',
            opciones: [
              {
                id: 'lab_pcr', texto: 'Proteína C reactiva (PCR)', tiempo: 30, flags: ['lab_pcr'],
                hc: ['Laboratorio', 'PCR: 48 mg/L (VR < 5).'],
                lineas: [{ quien: 'enfermera', texto: 'Resultado de la PCR.', reporte: { titulo: 'Bioquímica', filas: [['Proteína C reactiva', '48 mg/L', '< 5', true]] } }],
              },
              {
                id: 'lab_bioq', texto: 'Electrolitos, urea y creatinina', tiempo: 30, flags: ['lab_bioq'],
                hc: ['Laboratorio', 'Na 138 · K 3,9 mEq/L · Urea 28 mg/dL · Creatinina 0,7 mg/dL.'],
                lineas: [{ quien: 'enfermera', texto: 'Electrolitos y función renal.', reporte: { titulo: 'Bioquímica', filas: [
                  ['Sodio', '138 mEq/L', '135–145'], ['Potasio', '3,9 mEq/L', '3,5–5,0'], ['Urea', '28 mg/dL', '15–40'], ['Creatinina', '0,7 mg/dL', '0,5–1,1'],
                ] } }],
              },
              {
                id: 'lab_glu', texto: 'Glucemia', tiempo: 30, flags: ['lab_glucemia'],
                hc: ['Laboratorio', 'Glucemia: 96 mg/dL.'],
                lineas: [{ quien: 'enfermera', texto: 'Glucemia normal.', reporte: { titulo: 'Bioquímica', filas: [['Glucemia', '96 mg/dL', '70–110']] } }],
              },
              {
                id: 'lab_hep', texto: 'Perfil hepático (TGO, TGP, FA, bilirrubinas)', tiempo: 30, flags: ['lab_hepatico'],
                hc: ['Laboratorio', 'TGO 22 · TGP 18 · FA 70 U/L · Bilirrubina total 0,6 mg/dL (normales).'],
                lineas: [{ quien: 'enfermera', texto: 'Perfil hepático normal.', reporte: { titulo: 'Perfil hepático', filas: [
                  ['TGO (AST)', '22 U/L', '< 35'], ['TGP (ALT)', '18 U/L', '< 35'], ['Fosfatasa alcalina', '70 U/L', '40–130'], ['Bilirrubina total', '0,6 mg/dL', '0,2–1,2'],
                ] } }],
              },
              {
                id: 'lab_amil', texto: 'Amilasa y lipasa', tiempo: 30, flags: ['lab_amilasa'],
                hc: ['Laboratorio', 'Amilasa 62 U/L · Lipasa 30 U/L (normales).'],
                lineas: [{ quien: 'enfermera', texto: 'Amilasa y lipasa normales.', reporte: { titulo: 'Enzimas pancreáticas', filas: [['Amilasa', '62 U/L', '28–100'], ['Lipasa', '30 U/L', '13–60']] } }],
              },
            ],
          },
          {
            titulo: 'Orina',
            opciones: [
              {
                id: 'lab_orina', texto: 'Examen general de orina', tiempo: 30, flags: ['lab_orina'],
                hc: ['Laboratorio', 'EGO: densidad 1025, leucocitos 2–3/campo, hematíes 1–2/campo, nitritos (−), sin bacterias.'],
                lineas: [{ quien: 'enfermera', texto: 'Llegó el examen de orina.', reporte: { titulo: 'Examen general de orina', filas: [
                  ['Densidad', '1025', '1005–1030'], ['Leucocitos', '2–3 /campo', '< 5'], ['Hematíes', '1–2 /campo', '< 3'],
                  ['Nitritos', 'Negativo', 'Negativo'], ['Bacterias', 'Ausentes', 'Ausentes'],
                ] } }],
              },
              {
                id: 'lab_urocult', texto: 'Urocultivo', tiempo: 10, flags: ['lab_urocultivo'],
                hc: ['Laboratorio', 'Urocultivo enviado (resultado en 48–72 h).'],
                lineas: [E('Mandé el urocultivo, Doc. El resultado demora entre 48 y 72 horas.')],
              },
            ],
          },
          {
            titulo: 'Hormonas',
            opciones: [
              {
                id: 'lab_bhcg', texto: 'β-hCG sérica (prueba de embarazo)', tiempo: 30, flags: ['lab_bhcg'],
                hc: ['Laboratorio', 'β-hCG sérica: negativa (< 5 mUI/mL).'],
                lineas: [{ quien: 'enfermera', texto: 'La β-hCG salió negativa, Doc.', reporte: { titulo: 'Prueba de embarazo', filas: [['β-hCG sérica', '< 5 mUI/mL', 'Negativa < 5']] } }],
              },
            ],
          },
          {
            titulo: 'Microbiología',
            opciones: [
              {
                id: 'lab_hcult', texto: 'Hemocultivos', tiempo: 10, flags: ['lab_hemocultivo'],
                hc: ['Laboratorio', 'Hemocultivos enviados (resultado en 48–72 h).'],
                lineas: [E('Mandé los hemocultivos, Doc, pero el resultado demora entre 48 y 72 horas.')],
              },
            ],
          },
          {
            titulo: 'Imagen (gabinete)',
            opciones: [
              {
                id: 'img_eco', texto: 'Ecografía abdominal y pélvica', tiempo: 40, flags: ['img_eco'],
                hc: ['Imagen', 'Ecografía: apéndice no compresible de 9 mm, pared engrosada, grasa periapendicular hiperecogénica y mínimo líquido periapendicular. Útero y ovarios normales. Sin líquido libre. → Compatible con apendicitis aguda no complicada.'],
                lineas: [{ quien: 'enfermera', texto: 'Doc, el radiólogo mandó el informe de la ecografía.', reporte: { titulo: 'Ecografía abdominal y pélvica', texto:
                  'En la FID se observa una estructura tubular ciega, **no compresible**, de **9 mm** de diámetro, con pared engrosada y aumento de la ecogenicidad de la grasa periapendicular. Hay mínimo líquido periapendicular, sin colecciones. Útero y ovarios de aspecto normal. No hay líquido libre en el fondo de saco.\n**Conclusión:** compatible con apendicitis aguda no complicada.' } }],
              },
              {
                id: 'img_tv', texto: 'Ecografía transvaginal', tiempo: 30, flags: ['img_tv'],
                hc: ['Imagen', 'Ecografía transvaginal: útero y ovarios normales, sin masas anexiales ni líquido libre. Sin saco gestacional.'],
                lineas: [{ quien: 'enfermera', texto: 'Informe de la ecografía transvaginal.', reporte: { titulo: 'Ecografía transvaginal', texto:
                  'Útero en anteversión, de tamaño normal, endometrio de 8 mm. Ovarios de aspecto normal con folículos, **sin masas anexiales**. No hay saco gestacional ni líquido libre en el fondo de saco. El apéndice no se evalúa por esta vía.' } }],
              },
              {
                id: 'img_tc', texto: 'Tomografía de abdomen y pelvis con contraste', tiempo: 60, flags: ['img_tc'],
                efecto: (s) => {
                  const extra = [];
                  if (!s.flags.lab_bhcg) { s.flags.tc_sin_bhcg = true; extra.push(N('Indicaste radiación ionizante a una mujer en edad fértil **sin descartar antes un embarazo**.')); }
                  if (s.flags.img_eco) { s.flags.tc_innecesaria = true; }
                  return extra;
                },
                hc: ['Imagen', 'TC: apéndice de 10 mm con realce parietal y alteración de la grasa periapendicular. Sin apendicolito, perforación ni absceso.'],
                lineas: [{ quien: 'enfermera', texto: 'Llegó el informe de la tomografía.', reporte: { titulo: 'TC de abdomen y pelvis con contraste', texto:
                  'Apéndice cecal de **10 mm**, con realce parietal y alteración de la grasa periapendicular. No hay apendicolito, aire extraluminal ni colecciones.\n**Conclusión:** apendicitis aguda no complicada.' } }],
              },
              {
                id: 'img_rx', texto: 'Radiografía simple de abdomen', tiempo: 20, flags: ['img_rx'],
                hc: ['Imagen', 'Rx de abdomen: patrón gaseoso inespecífico, sin niveles hidroaéreos ni neumoperitoneo.'],
                lineas: [{ quien: 'enfermera', texto: 'Radiografía de abdomen lista.', reporte: { titulo: 'Rx simple de abdomen', texto: 'Distribución inespecífica del gas intestinal. No hay niveles hidroaéreos, neumoperitoneo ni apendicolito visible.' } }],
              },
              {
                id: 'img_rxt', texto: 'Radiografía de tórax', tiempo: 20, flags: ['img_rxtorax'],
                hc: ['Imagen', 'Rx de tórax: sin alteraciones.'],
                lineas: [{ quien: 'enfermera', texto: 'Radiografía de tórax normal.', reporte: { titulo: 'Rx de tórax PA', texto: 'Campos pulmonares libres. Silueta cardíaca normal. No hay neumoperitoneo subdiafragmático.' } }],
              },
            ],
          },
          {
            titulo: 'Otros',
            opciones: [
              {
                id: 'ecg', texto: 'Electrocardiograma', tiempo: 10, flags: ['ecg'],
                hc: ['Laboratorio', 'ECG: taquicardia sinusal (102 lpm), sin otras alteraciones.'],
                lineas: [E('ECG: taquicardia sinusal a 102, sin otras alteraciones.')],
              },
              {
                id: 'colono', texto: 'Colonoscopía', tiempo: 5, flags: ['critico_colonoscopia'],
                lineas: [E('Doc… ¿una colonoscopía? El gastroenterólogo de turno dice que con sospecha de abdomen agudo inflamatorio está contraindicada por el riesgo de perforación. No la va a hacer.')],
              },
            ],
          },
        ],
      },

      // ============================ 4. DIAGNÓSTICO
      {
        id: 'diagnostico',
        titulo: 'Diagnóstico',
        tipo: 'pasos',
        ayuda: 'Integra la anamnesis, el examen y los estudios. Puedes revisar la historia clínica (📋) antes de responder.',
        intro: [N('Con los datos reunidos, revisas la historia clínica y formulas tus hipótesis.')],
        pasos: [
          {
            id: 'sindrome', tipo: 'unica', pregunta: '¿Cuál es el diagnóstico sindrómico?', hcSeccion: 'Impresión diagnóstica', hcPrefijo: 'Síndrome: ',
            opciones: [
              { id: 's_infl', texto: 'Abdomen agudo inflamatorio', flags: ['dx_sindrome'] },
              { id: 's_obst', texto: 'Abdomen agudo obstructivo' },
              { id: 's_perf', texto: 'Abdomen agudo perforativo' },
              { id: 's_hem', texto: 'Abdomen agudo hemorrágico' },
              { id: 's_vasc', texto: 'Abdomen agudo vascular (isquémico)' },
            ],
          },
          {
            id: 'principal', tipo: 'unica', pregunta: '¿Cuál es el diagnóstico etiológico más probable?', hcSeccion: 'Impresión diagnóstica', hcPrefijo: 'Diagnóstico principal: ',
            opciones: [
              { id: 'p_apno', texto: 'Apendicitis aguda no complicada', flags: ['dx_principal'] },
              { id: 'p_apco', texto: 'Apendicitis aguda complicada (perforada o con absceso)', flags: ['dx_parcial'] },
              { id: 'p_eip', texto: 'Enfermedad inflamatoria pélvica' },
              { id: 'p_ect', texto: 'Embarazo ectópico roto' },
              { id: 'p_tors', texto: 'Torsión anexial' },
              { id: 'p_lnf', texto: 'Linfadenitis mesentérica' },
              { id: 'p_pielo', texto: 'Pielonefritis aguda' },
            ],
          },
          {
            id: 'alvarado', tipo: 'unica', pregunta: 'Con los datos obtenidos, ¿cuántos puntos suma la escala de Alvarado?', hcSeccion: 'Impresión diagnóstica', hcPrefijo: 'Alvarado: ',
            opciones: [
              { id: 'alv5', texto: '5 puntos (posible)' },
              { id: 'alv7', texto: '7 puntos (probable)' },
              { id: 'alv9', texto: '9 puntos (muy probable)', flags: ['dx_alvarado'] },
              { id: 'alv10', texto: '10 puntos (máximo)' },
            ],
          },
          {
            id: 'diferenciales', tipo: 'multiple', max: 4, pregunta: 'Selecciona los diagnósticos diferenciales más relevantes en esta paciente (hasta 4).', hcSeccion: 'Impresión diagnóstica', hcPrefijo: 'Diferenciales: ',
            opciones: [
              { id: 'df_ect', texto: 'Embarazo ectópico', correcto: true },
              { id: 'df_eip', texto: 'Enfermedad inflamatoria pélvica', correcto: true },
              { id: 'df_ovar', texto: 'Quiste ovárico roto / torsión anexial', correcto: true },
              { id: 'df_uro', texto: 'Pielonefritis / urolitiasis derecha', correcto: true },
              { id: 'df_lnf', texto: 'Linfadenitis mesentérica', correcto: true },
              { id: 'df_cole', texto: 'Colecistitis aguda', correcto: false },
              { id: 'df_panc', texto: 'Pancreatitis aguda', correcto: false },
              { id: 'df_iam', texto: 'Infarto agudo de miocardio de cara inferior', correcto: false },
            ],
            alConfirmar: (s, elegidas) => {
              s.flags.dif_correctos = elegidas.filter((o) => o.correcto).length;
              s.flags.dif_incorrectos = elegidas.filter((o) => !o.correcto).length;
            },
          },
        ],
      },

      // ============================ 5. TOMA DE DECISIONES
      {
        id: 'decisiones',
        titulo: 'Toma de decisiones',
        tipo: 'pasos',
        ayuda: 'Tus decisiones tienen consecuencias sobre la evolución de la paciente.',
        intro: [E('Doc, ¿cómo seguimos con Laura?')],
        pasos: [
          {
            id: 'iniciales', tipo: 'multiple', pregunta: 'Medidas iniciales en urgencias (selecciona todas las que indicarías):', hcSeccion: 'Plan', hcPrefijo: 'Medidas iniciales: ',
            opciones: [
              { id: 'i_ayuno', texto: 'Ayuno absoluto (nada por boca)', flags: ['i_ayuno'], lineas: [N('Indicas ayuno absoluto.')] },
              { id: 'i_acc', texto: 'Acceso venoso periférico e hidratación con cristaloides (Ringer lactato)', flags: ['i_hidratacion'], lineas: [N('Rosa canaliza una vena e inicia Ringer lactato.')] },
              {
                id: 'i_morf', texto: 'Analgesia: morfina EV en dosis tituladas', flags: ['i_analgesia'],
                lineas: [N('Administras morfina EV en dosis tituladas.'), P('Ay… ya me duele bastante menos. Gracias.', 'alivio')],
              },
              {
                id: 'i_para', texto: 'Analgesia: paracetamol 1 g EV', flags: ['i_analgesia'],
                lineas: [N('Administras paracetamol 1 g EV.'), P('Creo que me está haciendo efecto…', 'alivio')],
              },
              {
                id: 'i_dipi', texto: 'Analgesia: metamizol (dipirona) 2 g EV', flags: ['critico_alergia'], estabilidad: -25,
                lineas: (s) => [
                  E('¡Doc! A Laura le están saliendo ronchas en el cuello y dice que siente la cara hinchada.'),
                  P('Me… me pica todo… siento la garganta rara…', 'sorpresa'),
                  N('Suspendes la infusión de inmediato. Administras **adrenalina IM**, antihistamínico y corticoide, y das oxígeno. La reacción cede en unos minutos.'),
                  N(s.flags.p_alergias ? 'Ella te había dicho en la anamnesis que era **alérgica al metamizol**.' : 'Nunca le preguntaste por alergias. En la historia del triaje decía: **ALERGIA A METAMIZOL**.'),
                ],
              },
              { id: 'i_ond', texto: 'Antiemético (ondansetrón EV)', flags: ['i_antiemetico'], lineas: [N('Indicas ondansetrón EV.')] },
              {
                id: 'i_atb', texto: 'Profilaxis antibiótica preoperatoria (cefazolina 2 g + metronidazol 500 mg EV)', flags: ['i_antibiotico'],
                lineas: [N('Indicas cefazolina más metronidazol EV antes de la incisión.')],
              },
              { id: 'i_cx', texto: 'Solicitar la evaluación del cirujano de guardia', flags: ['i_cirujano'], lineas: [N('Llamas al cirujano de guardia, que viene a evaluar a la paciente y concuerda con la indicación quirúrgica.')] },
              {
                id: 'i_enema', texto: 'Enema o laxante para aliviar el dolor', flags: ['critico_laxante', 'perforada'], estabilidad: -30,
                lineas: [N('Una hora después del enema, el dolor de Laura se vuelve **difuso e intenso**. Tiene fiebre de 39 °C y el abdomen está rígido.'), P('¡Me duele todo! ¡No aguanto!', 'dolor'), E('Doc, la frecuencia cardíaca está en 128…')],
              },
              { id: 'i_sng', texto: 'Sonda nasogástrica de rutina', flags: ['i_sng_innecesaria'], lineas: [P('¿Por la nariz…? ¡Es muy incómodo!', 'sorpresa'), N('Colocas una sonda nasogástrica.')] },
              {
                id: 'i_noanalg', texto: 'No dar analgesia hasta que el cirujano la examine, para no enmascarar el cuadro', flags: ['i_sin_analgesia'],
                lineas: [P('Doctor/a, por favor… me duele demasiado.', 'dolor')],
              },
            ],
          },
          {
            id: 'definitiva', tipo: 'unica', pregunta: '¿Cuál es la conducta definitiva?', hcSeccion: 'Plan', hcPrefijo: 'Conducta: ',
            opciones: [
              { id: 'c_lap', texto: 'Apendicectomía videolaparoscópica de urgencia', flags: ['cx_lap'], lineas: [N('Coordinas con el cirujano y el anestesiólogo. Laura entra a quirófano para una **apendicectomía videolaparoscópica**.')] },
              { id: 'c_abierta', texto: 'Apendicectomía abierta (incisión de McBurney o Rocky-Davis)', flags: ['cx_abierta'], lineas: [N('Coordinas con el cirujano. Laura entra a quirófano para una **apendicectomía abierta**.')] },
              { id: 'c_atb', texto: 'Tratamiento antibiótico exclusivo, sin cirugía', flags: ['cx_atb'], lineas: [N('Inicias antibióticos EV y la internas en observación, sin cirugía por ahora.')] },
              {
                id: 'c_obs', texto: 'Observación durante 12 horas y reevaluación', flags: ['cx_observacion'], tiempo: 720,
                lineas: [N('Dejas a Laura en observación…')],
              },
              {
                id: 'c_alta', texto: 'Alta con analgésicos y control en 48 horas', flags: ['critico_alta'],
                lineas: [N('Le das el alta con una receta de analgésicos.'), P('¿Está seguro/a…? Bueno… gracias.', 'preocupada'), N('Laura se va a su casa, sola.')],
              },
            ],
          },
          {
            id: 'comunicacion', tipo: 'multiple', saltarSi: 'critico_alta',
            pregunta: '¿Cómo comunicas el plan a Laura? (selecciona todo lo que harías)', hcSeccion: 'Plan', hcPrefijo: 'Comunicación: ',
            opciones: [
              {
                id: 'k_expl', texto: 'Explicar el diagnóstico con palabras sencillas', flags: ['k_explica'],
                lineas: [M('Laura, lo que encontramos es una inflamación del apéndice, una pequeña parte del intestino. Se llama apendicitis.'), P('¿Y eso es grave?', 'preocupada')],
              },
              {
                id: 'k_cons', texto: 'Explicar el tratamiento, sus riesgos, beneficios y alternativas, y obtener el consentimiento informado', flags: ['k_consent'],
                lineas: (s) => s.flags.cx_atb
                  ? [M('Vamos a tratarla con antibióticos por la vena. Funciona en muchos casos, pero cerca de 3 de cada 10 pacientes terminan necesitando cirugía. La alternativa es operar ahora. ¿Tiene preguntas antes de firmar?'), P('Entiendo… está bien, firmo.', 'preocupada')]
                  : [M('El tratamiento indicado es una cirugía para retirar el apéndice, en lo posible por laparoscopía, con incisiones pequeñas. Los riesgos, como infección o sangrado, son poco frecuentes. Si no la operamos, podría perforarse. ¿Le parece si firmamos el consentimiento?'), P('Entiendo… está bien, firmo.', 'preocupada')],
              },
              {
                id: 'k_dudas', texto: 'Preguntar si tiene dudas y acoger su miedo', flags: ['k_dudas'],
                lineas: [M('¿Qué dudas tiene? Es normal tener miedo.'), P('Gracias por explicarme con calma. Me siento más tranquila.', 'alivio')],
              },
              {
                id: 'k_fam', texto: 'Ofrecer avisar a un familiar o acompañante', flags: ['k_familia'],
                lineas: [M('¿Quiere que llamemos a alguien para que la acompañe?'), P('Sí, a mi tía, por favor. Mi mamá está de viaje.', 'alivio')],
              },
              {
                id: 'k_sinr', texto: 'Tranquilizarla diciendo que es una cirugía sin ningún riesgo', flags: ['k_falsa'],
                lineas: [M('Tranquila, esta cirugía no tiene ningún riesgo.'), P('¿De verdad? Ah, qué bueno…', 'alivio')],
              },
              {
                id: 'k_tec', texto: 'Explicar usando solo términos técnicos, para ser preciso/a', flags: ['k_tecnico'],
                lineas: [M('Usted presenta un abdomen agudo inflamatorio por apendicitis no complicada, con indicación de apendicectomía y antibioticoprofilaxis.'), P('Perdón… no entendí casi nada.', 'sorpresa')],
              },
            ],
          },
        ],
      },
    ],

    // ------------------------------------------------- EVOLUCIÓN CLÍNICA
    progresion: {
      limite: 480, // minutos de tiempo clínico antes de que el apéndice se perfore
      flag: 'perforada',
      aplicar: (s) => {
        s.estabilidad -= 30;
        return [
          E('¡Doc! Laura empeoró: fiebre de 39,4 °C, frecuencia cardíaca de 126 y dolor en todo el abdomen.'),
          P('Doctor/a… me duele todo… ya no aguanto…', 'dolor'),
          N('El abdomen está en tabla, con defensa generalizada. Es un cuadro de **peritonitis**: la demora favoreció la perforación del apéndice.'),
        ];
      },
    },

    // ------------------------------------------------- DESENLACE
    desenlace: (s) => {
      const f = s.flags;
      const notaAlergia = f.critico_alergia ? ' La reacción alérgica al metamizol prolongó la estadía y generó un evento adverso evitable, que debe notificarse.' : '';
      if (s.motivoFin === 'tiempo' && !f.cx_lap && !f.cx_abierta && !f.cx_atb && !f.critico_alta) {
        return { tipo: 'regular', titulo: 'Tiempo agotado', texto: 'Se acabaron los 10 minutos de la estación antes de que definieras la conducta. En el examen, cada ítem del checklist que no cumpliste vale cero.' };
      }
      if (f.critico_alta) {
        return { tipo: 'malo', titulo: 'Retorno con peritonitis', texto: 'Laura vuelve 36 horas después con dolor difuso, fiebre de 39,5 °C y peritonitis generalizada. La operan por laparotomía: tenía un apéndice perforado con pus en la cavidad. Pasa 3 días en la UCI y 9 días internada.' + notaAlergia };
      }
      if (f.perforada) {
        return { tipo: 'regular', titulo: 'Apendicitis complicada', texto: 'En la cirugía se encuentra el apéndice perforado, con peritonitis localizada. Laura necesita antibióticos después de la operación y tiene el alta al 5.º día. La evolución fue buena, pero con más riesgo de absceso y de infección de la herida.' + notaAlergia };
      }
      if (f.cx_atb) {
        return { tipo: 'regular', titulo: 'Tratamiento no operatorio', texto: 'Laura mejora con los antibióticos y tiene el alta a las 72 horas. La estrategia es una alternativa en casos seleccionados de apendicitis no complicada, pero no es el estándar: cerca de 3 de cada 10 pacientes terminan operados en 90 días (ensayo CODA), y con apendicolito el riesgo de fracaso es mayor.' + notaAlergia };
      }
      if (f.cx_lap || f.cx_abierta) {
        return { tipo: 'bueno', titulo: 'Evolución favorable', texto: 'La cirugía confirma una apendicitis aguda flemonosa, sin perforación. Laura evoluciona sin complicaciones, tolera la dieta en pocas horas y tiene el alta en 24–48 horas.' + notaAlergia };
      }
      return { tipo: 'regular', titulo: 'Conducta incompleta', texto: 'No llegaste a definir la conducta definitiva.' + notaAlergia };
    },

    // ------------------------------------------------- CHECKLIST (estilo PEP)
    // A = n.º de subítems para «Adecuado», P = para «Parcial». eval(flags) permite reglas propias.
    checklist: [
      {
        id: 'c0', texto: 'Ubica a la paciente en el lugar adecuado (box de emergencia)', peso: 0.5,
        eval: (f) => (f.ubic_ok ? 'A' : f.ubic_reanimacion ? 'P' : 'I'),
        explicacion: 'Paciente amarilla (urgente) en el triaje de Manchester, con fiebre, taquicardia y dolor intenso: debe ir a un box de emergencia con camilla, monitorización y acceso venoso. El consultorio ambulatorio no tiene esos recursos; la sala de reanimación se reserva para pacientes críticos (rojos); y para un paciente amarillo la espera recomendada es de hasta 60 minutos, que ya consumió en el triaje.', refs: ['manchester'],
      },
      {
        id: 'c1', texto: 'Se presenta, identifica a la paciente e higieniza las manos', peso: 0.5, A: 3, P: 2,
        sub: [{ flag: 'presentacion', texto: 'Se presenta' }, { flag: 'identifica', texto: 'Identifica a la paciente' }, { flag: 'higiene', texto: 'Higiene de manos' }],
        explicacion: 'La higiene de manos antes del contacto con el paciente es el 1.er de los «5 momentos» de la OMS. La presentación y la identificación son ítems fijos del PEP.', refs: ['oms'],
      },
      {
        id: 'c2', texto: 'Caracteriza el dolor abdominal', peso: 1, A: 5, P: 3,
        sub: [{ flag: 'd_inicio', texto: 'Inicio y tiempo' }, { flag: 'd_localizacion', texto: 'Localización inicial' }, { flag: 'd_migracion', texto: 'Migración' },
          { flag: 'd_caracter', texto: 'Tipo e intensidad' }, { flag: 'd_factores', texto: 'Agravantes y atenuantes' }, { flag: 'd_irradiacion', texto: 'Irradiación' }],
        explicacion: 'La migración del dolor periumbilical a la FID (cronología de Murphy) es el dato de la anamnesis con mayor valor para apendicitis y suma 1 punto en Alvarado.', refs: ['porto', 'alvarado'],
      },
      {
        id: 'c3', texto: 'Investiga los síntomas acompañantes', peso: 0.75, A: 4, P: 2,
        sub: [{ flag: 'a_nauseas', texto: 'Náuseas y vómitos' }, { flag: 'a_anorexia', texto: 'Anorexia' }, { flag: 'a_fiebre', texto: 'Fiebre' },
          { flag: 'a_intestinal', texto: 'Hábito intestinal' }, { flag: 'a_urinario', texto: 'Síntomas urinarios' }],
        explicacion: 'Anorexia y náuseas o vómitos (que aparecen después del dolor) suman puntos en Alvarado. Los síntomas urinarios y el hábito intestinal orientan los diferenciales.', refs: ['alvarado', 'sabiston'],
      },
      {
        id: 'c4', texto: 'Obtiene la historia gineco-obstétrica', peso: 0.75, A: 3, P: 2,
        sub: [{ flag: 'g_fum', texto: 'FUM y ciclos' }, { flag: 'g_sexual', texto: 'Actividad sexual y anticoncepción' }, { flag: 'g_flujo', texto: 'Flujo, sangrado y dispareunia' }],
        explicacion: 'En toda mujer en edad fértil con dolor abdominal bajo hay que descartar causas ginecológicas (embarazo ectópico, EIP, patología anexial).', refs: ['wses'],
      },
      {
        id: 'c5', texto: 'Pregunta por antecedentes y alergias', peso: 0.5, A: 4, P: 2, obligatorio: ['p_alergias'],
        sub: [{ flag: 'p_patologicos', texto: 'Patológicos' }, { flag: 'p_quirurgicos', texto: 'Quirúrgicos' }, { flag: 'p_alergias', texto: 'Alergias (obligatorio)' }, { flag: 'p_medicamentos', texto: 'Medicamentos' }],
        explicacion: 'Preguntar por alergias es indispensable antes de prescribir. En este caso, la paciente era alérgica al metamizol.', refs: ['porto'],
      },
      {
        id: 'c6', texto: 'Explica el examen, mide signos vitales y evalúa el estado general', peso: 0.5, A: 3, P: 2,
        sub: [{ flag: 'ef_permiso', texto: 'Explica y pide permiso' }, { flag: 'ef_sv', texto: 'Signos vitales' }, { flag: 'ef_general', texto: 'Estado general' }],
        explicacion: 'La fiebre (≥ 37,3 °C) suma 1 punto en Alvarado. La taquicardia y la deshidratación orientan la reanimación.', refs: ['alvarado', 'porto'],
      },
      {
        id: 'c7', texto: 'Examina el abdomen de forma sistematizada', peso: 1, A: 5, P: 3,
        sub: [{ flag: 'ab_inspeccion', texto: 'Inspección' }, { flag: 'ab_auscultacion', texto: 'Auscultación' }, { flag: 'ab_percusion', texto: 'Percusión' },
          { flag: 'ab_palpacion', texto: 'Palpación' }, { flag: 'ab_orden', texto: 'Ausculta antes de percutir y palpar' }],
        explicacion: 'En el abdomen, el orden es inspección → auscultación → percusión → palpación, porque la manipulación altera los ruidos hidroaéreos.', refs: ['porto'],
      },
      {
        id: 'c8', texto: 'Busca el punto de McBurney y los signos apendiculares', peso: 0.75, A: 4, P: 2,
        sub: [{ flag: 'mcburney', texto: 'Punto de McBurney' }, { flag: 'm_blumberg', texto: 'Blumberg' }, { flag: 'm_rovsing', texto: 'Rovsing' },
          { flag: 'm_psoas', texto: 'Psoas' }, { flag: 'm_obturador', texto: 'Obturador' }],
        explicacion: 'El dolor en la FID suma 2 puntos en Alvarado y el dolor a la descompresión (Blumberg), 1. Psoas y obturador orientan la posición del apéndice.', refs: ['alvarado', 'sabiston'],
      },
      {
        id: 'c9', texto: 'Solicita los exámenes pertinentes (incluida la β-hCG)', peso: 1.25, A: 5, P: 3, obligatorio: ['lab_bhcg'],
        sub: [{ flag: 'lab_hemograma', texto: 'Hemograma' }, { flag: 'lab_pcr', texto: 'PCR' }, { flag: 'lab_bhcg', texto: 'β-hCG (obligatorio)' },
          { flag: 'lab_orina', texto: 'Examen de orina' }, { flag: 'img_eco', texto: 'Ecografía' }],
        explicacion: 'La WSES recomienda la ecografía como primer estudio de imagen en jóvenes y embarazadas; la TC se reserva para casos dudosos. La β-hCG es obligatoria en mujeres en edad fértil.', refs: ['wses'],
      },
      {
        id: 'c10', texto: 'Formula el diagnóstico sindrómico y el etiológico', peso: 1, A: 3, P: 2, obligatorio: ['dx_principal'],
        sub: [{ flag: 'dx_sindrome', texto: 'Abdomen agudo inflamatorio' }, { flag: 'dx_principal', texto: 'Apendicitis aguda no complicada' }, { flag: 'dx_alvarado', texto: 'Alvarado = 9' }],
        explicacion: 'Alvarado de 9 = migración 1 + anorexia 1 + náuseas 1 + dolor en FID 2 + descompresión 1 + fiebre 1 + leucocitosis 2 (neutrófilos 72 %, < 75 %: no suma). Con ≥ 7 puntos, la apendicitis es muy probable.', refs: ['alvarado', 'wses'],
      },
      {
        id: 'c11', texto: 'Plantea diagnósticos diferenciales pertinentes', peso: 0.5,
        eval: (f) => ((f.dif_correctos || 0) >= 3 && !f.dif_incorrectos ? 'A' : (f.dif_correctos || 0) >= 2 ? 'P' : 'I'),
        explicacion: 'En mujeres jóvenes priman los diferenciales ginecológicos (ectópico, EIP, patología anexial) y urológicos. Colecistitis, pancreatitis e IAM no encajan con el cuadro.', refs: ['wses', 'sabiston'],
      },
      {
        id: 'c12', texto: 'Indica las medidas iniciales adecuadas', peso: 1, A: 5, P: 3,
        sub: [{ flag: 'i_ayuno', texto: 'Ayuno' }, { flag: 'i_hidratacion', texto: 'Hidratación EV' }, { flag: 'i_analgesia', texto: 'Analgesia segura' },
          { flag: 'i_antibiotico', texto: 'Profilaxis antibiótica' }, { flag: 'i_cirujano', texto: 'Evaluación quirúrgica' }],
        explicacion: 'La analgesia precoz NO enmascara el diagnóstico (Cochrane). Se recomienda la profilaxis antibiótica de amplio espectro antes de la incisión.', refs: ['cochrane', 'bratzler', 'wses'],
      },
      {
        id: 'c13', texto: 'Define la conducta definitiva', peso: 1,
        eval: (f) => (f.critico_alta || f.cx_observacion ? 'I' : f.cx_lap || f.cx_abierta ? 'A' : f.cx_atb ? 'P' : 'I'),
        explicacion: 'La apendicectomía (preferentemente laparoscópica) es el tratamiento estándar. El tratamiento antibiótico exclusivo es una alternativa en casos seleccionados, con decisión compartida.', refs: ['wses', 'coda'],
      },
      {
        id: 'c14', texto: 'Comunica el plan y obtiene el consentimiento informado', peso: 0.5, A: 4, P: 2, obligatorio: ['k_consent'],
        sub: [{ flag: 'k_explica', texto: 'Explica con lenguaje claro' }, { flag: 'k_consent', texto: 'Consentimiento informado (obligatorio)' },
          { flag: 'k_dudas', texto: 'Resuelve dudas' }, { flag: 'k_familia', texto: 'Ofrece avisar a un familiar' }, { flag: 'escucha', texto: 'Escucha activa en la anamnesis' }],
        explicacion: 'El consentimiento informado debe incluir los riesgos, los beneficios y las alternativas, en lenguaje comprensible.', refs: ['sabiston'],
      },
      {
        id: 'c15', texto: 'Coloca a la paciente en la posición anatómica correcta para cada maniobra', peso: 0.5,
        // Solo se evalúa en modo desafío (en modo automático la paciente se coloca sola)
        eval: (f, s) => (!s.posManual ? 'NA' : !f.pos_aciertos ? 'I' : !f.pos_errores ? 'A' : f.pos_errores <= 2 ? 'P' : 'I'),
        explicacion: 'Examen abdominal en decúbito supino (con las piernas semiflexionadas para relajar la pared), psoas en decúbito lateral izquierdo, obturador en supino con cadera y rodilla flexionadas a 90°, Giordano sentada, examen ginecológico en posición de litotomía y tacto rectal en decúbito lateral (Sims).', refs: ['porto'],
      },
    ],

    criticos: [
      { flag: 'critico_alta', texto: 'Alta de una paciente con abdomen agudo quirúrgico.', ref: 'wses' },
      { flag: 'critico_laxante', texto: 'Indicación de enema o laxante en un abdomen agudo inflamatorio (riesgo de perforación).', ref: 'sabiston' },
      { flag: 'critico_alergia', texto: 'Administración de un fármaco al que la paciente es alérgica (metamizol).', ref: 'porto' },
      { flag: 'critico_colonoscopia', texto: 'Solicitud de colonoscopía, contraindicada en el abdomen agudo inflamatorio.', ref: 'sabiston' },
      { flag: 'tc_sin_bhcg', texto: 'Tomografía (radiación ionizante) sin descartar antes un embarazo.', ref: 'wses' },
    ],

    observaciones: [
      { flag: 'ubic_cons', texto: 'Atender en el consultorio ambulatorio a una paciente amarilla con signos de abdomen agudo obligó a trasladarla después al box (más tiempo y sin monitorización durante la entrevista).', ref: 'manchester' },
      { flag: 'ubic_reanimacion', texto: 'Sobretriaje: la sala de reanimación es para pacientes rojos (riesgo vital inmediato).', ref: 'manchester' },
      { flag: 'ubic_espera', texto: 'Dejarla en la sala de espera retrasó una hora la atención de una paciente urgente y empeoró su estado.', ref: 'manchester' },
      { flag: 'gin_sin_chaperona', texto: 'Examen ginecológico sin acompañante: se recomienda la presencia de un/a profesional durante los exámenes íntimos.' },
      { flag: 'i_sin_analgesia', texto: 'Retrasar la analgesia es un mito: no enmascara el diagnóstico y prolonga el sufrimiento de la paciente.', ref: 'cochrane' },
      { flag: 'i_sng_innecesaria', texto: 'La sonda nasogástrica no está indicada de rutina en la apendicitis no complicada.' },
      { flag: 'tc_innecesaria', texto: 'TC después de una ecografía concluyente: más radiación, más costo y más tiempo, sin cambiar la conducta.', ref: 'wses' },
      { flag: 'lab_urocultivo', texto: 'Con un examen de orina normal y sin síntomas urinarios, el urocultivo no aporta al diagnóstico.' },
      { flag: 'lab_hemocultivo', texto: 'Los hemocultivos no están indicados en la apendicitis no complicada sin sepsis.' },
      { flag: 'img_rx', texto: 'La radiografía simple de abdomen tiene bajo rendimiento para apendicitis.', ref: 'wses' },
      { flag: 'k_falsa', texto: 'Prometer «cero riesgo» es falso y vicia el consentimiento informado.' },
      { flag: 'k_tecnico', texto: 'El lenguaje técnico sin traducción impide que la paciente comprenda el plan.' },
      { flag: 'tacto_rectal', texto: 'El tacto rectal no se recomienda de rutina para el diagnóstico de apendicitis.', ref: 'wses' },
      { flag: 'cx_observacion', texto: 'Con Alvarado ≥ 7 y una ecografía concluyente, observar 12 h solo retrasa el tratamiento.', ref: 'wses' },
    ],

    // Bloque extra en la pantalla de resultados
    extraResultado: (s) => {
      const f = s.flags;
      const filas = [
        ['Migración del dolor a la FID', 1, f.d_migracion],
        ['Anorexia', 1, f.a_anorexia],
        ['Náuseas o vómitos', 1, f.a_nauseas],
        ['Dolor en la FID', 2, f.mcburney || f.ab_palp_sup],
        ['Dolor a la descompresión (Blumberg)', 1, f.m_blumberg],
        ['Fiebre ≥ 37,3 °C', 1, f.ef_sv],
        ['Leucocitosis > 10 000', 2, f.lab_hemograma],
        ['Neutrofilia > 75 % (72 %: no suma)', 0, f.lab_hemograma],
      ];
      const tot = filas.reduce((a, r) => a + r[1], 0);
      return {
        titulo: 'Escala de Alvarado de la paciente',
        html:
          '<table class="tabla"><thead><tr><th>Criterio</th><th>Puntos</th><th>¿Lo investigaste?</th></tr></thead><tbody>' +
          filas.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2] ? '✅' : '❌'}</td></tr>`).join('') +
          `</tbody><tfoot><tr><td>Total</td><td><strong>${tot}</strong></td><td></td></tr></tfoot></table>` +
          '<p class="nota-peq">0–4: improbable · 5–6: posible · 7–8: probable · 9–10: muy probable.</p>',
      };
    },
  });
})();
