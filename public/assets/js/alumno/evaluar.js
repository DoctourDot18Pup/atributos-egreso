// ============================================================
// assets/js/alumno/evaluar.js
// Vista de autoevaluación — selección de materia y llenado del formulario
// ============================================================

async function initEvaluar() {
    document.getElementById('content-area').innerHTML =
        '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';

    const result = await apiFetch('/evaluaciones/pendientes.php');
    if (!result?.ok) {
        document.getElementById('content-area').innerHTML =
            `<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i>
             <p>Error al cargar evaluaciones pendientes.</p></div>`;
        return;
    }

    const { periodo, pendientes } = result.data;

    if (!periodo) {
        document.getElementById('content-area').innerHTML = `
            <div class="card">
                <div class="card-body" style="text-align:center;padding:48px;color:#718096">
                    <i class="fa-solid fa-calendar-xmark" style="font-size:2.5rem;color:#a0aec0;margin-bottom:16px;display:block"></i>
                    <strong style="font-size:1rem;color:#4a5568">Sin período activo</strong>
                    <p style="margin-top:8px;font-size:0.85rem">No hay un período de evaluación activo en este momento. Consulta con tu coordinador.</p>
                </div>
            </div>`;
        return;
    }

    if (pendientes.length === 0) {
        document.getElementById('content-area').innerHTML = `
            <div class="card">
                <div class="card-body" style="text-align:center;padding:48px">
                    <i class="fa-solid fa-circle-check" style="font-size:2.5rem;color:#276749;margin-bottom:16px;display:block"></i>
                    <strong style="font-size:1rem;color:#276749">¡Completaste todas las evaluaciones!</strong>
                    <p style="margin-top:8px;font-size:0.85rem;color:#718096">
                        No tienes materias pendientes en el período <strong>${periodo.nombre}</strong>.
                    </p>
                </div>
            </div>`;
        return;
    }

    // Mostrar lista de materias pendientes para seleccionar
    const opciones = pendientes.map(m => `
        <div class="materia-card" data-materia="${m.id_materia}"
             style="display:flex;justify-content:space-between;align-items:center;
                    padding:18px 20px;background:#fff;border:1.5px solid #e2e8f0;
                    border-radius:10px;cursor:pointer;transition:border-color .2s,box-shadow .2s"
             onmouseover="this.style.borderColor='var(--verde-itc)';this.style.boxShadow='0 2px 12px rgba(26,107,53,0.12)'"
             onmouseout="this.style.borderColor='#e2e8f0';this.style.boxShadow='none'"
             onclick="cargarFormularioEval('${m.id_materia}', '${m.materia_nombre.replace(/'/g, "\\'")}', ${periodo.id_periodo}, '${periodo.nombre.replace(/'/g, "\\'")}')">
            <div>
                <div style="font-size:0.78rem;font-weight:700;color:#276749">${m.id_materia}</div>
                <div style="font-size:0.92rem;font-weight:600;color:#1a202c;margin-top:2px">${m.materia_nombre}</div>
            </div>
            <i class="fa-solid fa-chevron-right" style="color:#a0aec0;font-size:0.9rem"></i>
        </div>`).join('');

    document.getElementById('content-area').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-pen-to-square" style="color:var(--verde-itc);margin-right:8px"></i>Selecciona una materia para evaluar</h2>
                <span style="font-size:0.8rem;color:#718096;background:#f7fafc;padding:4px 12px;border-radius:20px;border:1px solid #e2e8f0">
                    <i class="fa-solid fa-calendar" style="margin-right:4px"></i>${periodo.nombre}
                </span>
            </div>
            <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:12px">${opciones}</div>
            </div>
        </div>`;
}

// ------------------------------------------------------------
const LIKERT_DESC_COLORS = ['', '#c53030', '#d69e2e', '#2b6cb0', '#276749'];
const LIKERT_LABELS = ['', 'No suficiente', 'Suficiente', 'Bueno', 'Muy Bueno'];

async function cargarFormularioEval(idMateria, nombreMateria, idPeriodo, nombrePeriodo) {
    document.getElementById('content-area').innerHTML =
        '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando criterios...</div>';

    // Obtener carrera del alumno
    const carrera = usuarioAlumno.id_carrera;

    // Cargar criterios de la materia (via AE de la carrera que están en materias_ae)
    const [resMAE, resCrit] = await Promise.all([
        apiFetch(`/materias_ae/index.php?materia=${encodeURIComponent(idMateria)}`),
        apiFetch(`/criterios/index.php?carrera=${carrera}`),
    ]);

    if (!resMAE?.ok || !resCrit?.ok) {
        document.getElementById('content-area').innerHTML =
            `<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i>
             <p>Error al cargar el formulario.</p></div>`;
        return;
    }

    // Filtrar solo AE de esta carrera que están relacionados con esta materia
    const aeIds = new Set(
        resMAE.data.data
            .filter(r => r.id_carrera === carrera)
            .map(r => r.id_ae)
    );

    if (aeIds.size === 0) {
        document.getElementById('content-area').innerHTML = `
            <div class="card">
                <div class="card-body" style="text-align:center;padding:48px;color:#718096">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;color:#d69e2e;margin-bottom:12px;display:block"></i>
                    <p>Esta materia no tiene Atributos de Egreso asignados para tu carrera.</p>
                    <button class="btn btn-secondary" style="margin-top:16px" onclick="initEvaluar()">
                        <i class="fa-solid fa-arrow-left"></i> Volver
                    </button>
                </div>
            </div>`;
        return;
    }

    // Agrupar criterios activos por AE (solo los AE de esta materia+carrera)
    const criteriosPorAE = {};
    resCrit.data.data
        .filter(cr => cr.activo == 1 && aeIds.has(cr.id_ae))
        .forEach(cr => {
            const key = cr.id_ae;
            if (!criteriosPorAE[key]) {
                criteriosPorAE[key] = {
                    id_ae: cr.id_ae,
                    codigo_ae: cr.codigo_ae,
                    ae_nombre: cr.ae_nombre_corto || '',
                    criterios: [],
                };
            }
            criteriosPorAE[key].criterios.push(cr);
        });

    const grupos = Object.values(criteriosPorAE);

    if (grupos.length === 0) {
        document.getElementById('content-area').innerHTML = `
            <div class="card">
                <div class="card-body" style="text-align:center;padding:48px;color:#718096">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;color:#d69e2e;margin-bottom:12px;display:block"></i>
                    <p>No hay criterios activos configurados para esta materia.</p>
                    <button class="btn btn-secondary" style="margin-top:16px" onclick="initEvaluar()">
                        <i class="fa-solid fa-arrow-left"></i> Volver
                    </button>
                </div>
            </div>`;
        return;
    }

    // Construir secciones del formulario
    const secciones = grupos.map(ae => {
        const filasCriterios = ae.criterios.map(cr => `
            <div class="criterio-item" id="ci-${cr.id_criterio}"
                 style="padding:16px 20px;border:1.5px solid #e2e8f0;border-radius:10px;margin-bottom:12px">
                <div style="display:flex;gap:10px;margin-bottom:12px">
                    <span style="font-size:0.7rem;font-weight:700;color:#276749;background:#f0fff4;
                                 padding:2px 8px;border-radius:10px;border:1px solid #9ae6b4;white-space:nowrap">
                        ${cr.codigo_criterio}
                    </span>
                    <span style="font-size:0.85rem;color:#1a202c;font-weight:500">${cr.descripcion}</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
                    ${[1,2,3,4].map(n => {
                        const desc  = cr[`desc_n${n}`] || LIKERT_LABELS[n];
                        const color = LIKERT_DESC_COLORS[n];
                        return `
                        <label class="likert-opt" data-criterio="${cr.id_criterio}" data-val="${n}"
                               style="display:flex;flex-direction:column;align-items:center;padding:10px 6px;
                                      border:2px solid #e2e8f0;border-radius:8px;cursor:pointer;
                                      text-align:center;transition:all .15s;user-select:none"
                               onclick="seleccionarLikert(${cr.id_criterio}, ${n}, this)">
                            <span style="font-size:1.4rem;font-weight:700;color:${color}">${n}</span>
                            <span style="font-size:0.65rem;font-weight:700;color:${color};margin:3px 0 2px">${LIKERT_LABELS[n]}</span>
                            <span style="font-size:0.6rem;color:#718096;line-height:1.3">${desc}</span>
                        </label>`;
                    }).join('')}
                </div>
            </div>`).join('');

        return `
        <div style="margin-bottom:24px">
            <div style="background:#f7fafc;border-left:4px solid var(--verde-itc);
                        padding:10px 16px;border-radius:0 8px 8px 0;margin-bottom:12px">
                <strong style="font-size:0.88rem;color:#1a202c">AE-${ae.codigo_ae} — ${ae.ae_nombre}</strong>
                <span style="font-size:0.72rem;color:#718096;margin-left:8px">${ae.criterios.length} criterio${ae.criterios.length !== 1 ? 's' : ''}</span>
            </div>
            ${filasCriterios}
        </div>`;
    }).join('');

    const totalCriterios = grupos.reduce((s, ae) => s + ae.criterios.length, 0);

    document.getElementById('content-area').innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
            <button class="btn btn-secondary btn-sm" onclick="initEvaluar()">
                <i class="fa-solid fa-arrow-left"></i> Volver
            </button>
            <div>
                <div style="font-size:0.78rem;font-weight:700;color:#276749">${idMateria}</div>
                <div style="font-size:1rem;font-weight:700;color:#1a202c">${nombreMateria}</div>
                <div style="font-size:0.75rem;color:#718096">Período: ${nombrePeriodo} · ${totalCriterios} criterios</div>
            </div>
        </div>

        <div id="progreso-eval" style="background:#fff;border-radius:10px;padding:14px 20px;
             margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06);
             display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:0.82rem;color:#4a5568">
                Respondidos: <strong id="resp-count">0</strong> / ${totalCriterios}
            </span>
            <div style="height:8px;width:200px;background:#e2e8f0;border-radius:20px;overflow:hidden">
                <div id="barra-progreso" style="height:100%;width:0%;background:var(--verde-itc);
                     border-radius:20px;transition:width .3s"></div>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                ${secciones}

                <div style="margin-top:8px">
                    <label style="display:block;font-size:0.82rem;font-weight:600;color:#4a5568;margin-bottom:6px">
                        Observaciones <span style="font-weight:400;color:#a0aec0">(opcional)</span>
                    </label>
                    <textarea id="obs-eval" rows="3" class="form-control"
                              placeholder="Comentarios adicionales sobre tu desempeño en esta materia..."
                              style="resize:vertical"></textarea>
                </div>

                <div id="msg-eval" class="form-msg" style="margin-top:12px"></div>

                <div style="display:flex;justify-content:flex-end;margin-top:20px">
                    <button id="btn-enviar-eval" class="btn btn-primary" disabled
                            onclick="enviarEvaluacion('${idMateria}', ${idPeriodo})">
                        <i class="fa-solid fa-paper-plane"></i> Enviar evaluación
                    </button>
                </div>
            </div>
        </div>`;

    // Guardar total para la validación
    window._totalCriteriosEval  = totalCriterios;
    window._respuestasEval = {};
}

// ------------------------------------------------------------
function seleccionarLikert(idCriterio, valor, labelEl) {
    // Desmarcar todas las opciones del mismo criterio
    document.querySelectorAll(`.likert-opt[data-criterio="${idCriterio}"]`).forEach(el => {
        el.style.borderColor     = '#e2e8f0';
        el.style.background      = '#fff';
        el.style.transform       = 'scale(1)';
    });

    // Marcar la seleccionada
    const color = LIKERT_DESC_COLORS[valor];
    labelEl.style.borderColor = color;
    labelEl.style.background  = `${color}12`;
    labelEl.style.transform   = 'scale(1.03)';

    // Guardar respuesta
    window._respuestasEval[idCriterio] = valor;

    // Actualizar progreso
    const respondidos = Object.keys(window._respuestasEval).length;
    const total       = window._totalCriteriosEval;
    document.getElementById('resp-count').textContent   = respondidos;
    document.getElementById('barra-progreso').style.width = `${Math.round(respondidos / total * 100)}%`;

    // Habilitar botón si están todos respondidos
    document.getElementById('btn-enviar-eval').disabled = respondidos < total;
}

// ------------------------------------------------------------
async function enviarEvaluacion(idMateria, idPeriodo) {
    const btn = document.getElementById('btn-enviar-eval');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

    const respuestas = Object.entries(window._respuestasEval).map(([id_criterio, likert]) => ({
        id_criterio: parseInt(id_criterio),
        likert,
    }));

    const obs = document.getElementById('obs-eval')?.value?.trim() || null;

    const result = await apiFetch('/evaluaciones/crear.php', {
        method: 'POST',
        body: JSON.stringify({
            id_materia: idMateria,
            id_periodo: idPeriodo,
            observaciones: obs,
            respuestas,
        }),
    });

    if (result?.ok) {
        // Éxito — redirigir a historial
        document.getElementById('content-area').innerHTML = `
            <div class="card">
                <div class="card-body" style="text-align:center;padding:48px">
                    <i class="fa-solid fa-circle-check" style="font-size:3rem;color:#276749;margin-bottom:16px;display:block"></i>
                    <strong style="font-size:1.1rem;color:#276749">¡Evaluación enviada!</strong>
                    <p style="margin-top:8px;font-size:0.88rem;color:#718096">Tu autoevaluación de <strong>${idMateria}</strong> ha sido registrada correctamente.</p>
                    <div style="display:flex;justify-content:center;gap:12px;margin-top:24px">
                        <button class="btn btn-secondary" onclick="initEvaluar()">
                            <i class="fa-solid fa-pen"></i> Evaluar otra materia
                        </button>
                        <button class="btn btn-primary" onclick="cargarVistaAlumno('historial')">
                            <i class="fa-solid fa-clock-rotate-left"></i> Ver historial
                        </button>
                    </div>
                </div>
            </div>`;
    } else {
        const msg = result?.data?.message || 'Error al enviar la evaluación.';
        const el  = document.getElementById('msg-eval');
        if (el) { el.textContent = msg; el.className = 'form-msg error show'; }
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar evaluación';
    }
}
