# 🩺 Simulador de Consulta Clínica

Novela visual educativa en la que juegas **desde el punto de vista del médico**. Atiendes a un paciente siguiendo todos los pasos de la consulta, y al final recibes una evaluación con un **checklist al estilo de la prueba práctica (PEP) del Revalida**.

## Fases de la consulta

1. **Anamnesis**: presentación, motivo de consulta, enfermedad actual, antecedentes y hábitos
2. **Exploración física**: signos vitales, estado general, examen segmentario y maniobras (el orden importa)
3. **Laboratorio y gabinete**: pides estudios y recibes los informes
4. **Diagnóstico**: sindrómico, etiológico, escalas y diferenciales
5. **Toma de decisiones**: medidas iniciales, conducta definitiva y comunicación con el paciente
6. **Resultado**: nota sobre 10, checklist (Adecuado / Parcial / Inadecuado), errores críticos, observaciones, línea de tiempo y bibliografía

## Mecánicas

- **Reloj clínico**: cada acción consume minutos. Si demoras demasiado o tomas decisiones peligrosas, el paciente empeora y aparecen **finales alternativos**.
- **Modo Estudio** (sin reloj) y **Modo Examen** (10 minutos reales, como en la estación del PEP).
- **Historia clínica** (📋), que se va llenando sola con lo que descubres, y un espacio para **notas personales**.
- **Progreso guardado** en el navegador: puedes salir y continuar después. Se guardan también las mejores notas y el historial.

## Casos

| Área | Caso | Estado |
|---|---|---|
| Cirugía | Apendicitis aguda (mujer, 24 años) | ✅ Disponible |
| Clínica médica | Dolor torácico / SCA | 🔒 Próximamente |
| Ginecología y obstetricia | Embarazo ectópico | 🔒 Próximamente |
| Pediatría | Bronquiolitis | 🔒 Próximamente |
| Medicina preventiva | Prenatal y vacunación | 🔒 Próximamente |

## Cómo jugar

- **Local**: abre `index.html` en el navegador. No necesita servidor ni instalar nada.
- **En línea**: está publicado con GitHub Pages (ver abajo).

### Publicar en GitHub Pages

1. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Haz merge a `main`. El workflow `.github/workflows/pages.yml` publica el sitio automáticamente.
3. El enlace queda en la forma `https://<usuario>.github.io/<repositorio>/`.

## Estructura

```
index.html
css/estilos.css
js/motor.js                      ← motor de novela visual (genérico)
js/proximos.js                   ← tarjetas "Próximamente"
js/casos/cirugia-apendicitis.js  ← datos del caso
```

## Cómo agregar un caso nuevo

Crea `js/casos/<id>.js` que haga `window.CASOS.push({...})` (usa el caso de apendicitis como plantilla) y agrégalo en `index.html`. Campos principales:

- `paciente`, `personajes`, `escenario`, `introLineas`, `hcSecciones`, `referencias`
- `fases[]` de dos tipos:
  - `tipo: 'acciones'` → `grupos[]` con `opciones[]` (`id`, `texto`, `tiempo`, `flags`, `hc`, `lineas`, `efecto`, `estabilidad`). Un grupo con `requiere: 'flag'` se desbloquea con ese flag.
  - `tipo: 'pasos'` → `pasos[]` de `tipo: 'unica' | 'multiple'`, con `opciones[]` y, opcionalmente, `saltarSi` y `alConfirmar`.
- Líneas de diálogo: `['paciente' | 'medico' | 'enfermera' | 'narrador', 'texto', 'expresión']`. Expresiones: `neutral`, `dolor`, `preocupada`, `alivio`, `sorpresa`. Para informes de laboratorio o imagen se usa `{ quien, texto, reporte: { titulo, filas | texto } }`.
- `progresion` (evolución por tiempo), `desenlace(estado)`, `checklist[]`, `criticos[]`, `observaciones[]` y `extraResultado`.

> ⚠️ Simulador con fines educativos. No reemplaza el juicio clínico ni los protocolos institucionales.
