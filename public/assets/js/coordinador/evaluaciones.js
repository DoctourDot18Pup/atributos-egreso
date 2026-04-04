// ============================================================
// assets/js/coordinador/evaluaciones.js
// Vista de evaluaciones del coordinador
// ============================================================

function initEvaluaciones() {
    document.getElementById('content-area').innerHTML = `

        <!-- Modal detalle evaluación -->
        <div class="modal-overlay" id="modal-eval-detalle">
            <div class="modal" style="max-width:680px;max-height:85vh;overflow-y:auto">
                <div class="modal-header">
                    <h3 id="modal-eval-titulo">Detalle de evaluación</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-eval-detalle')">&times;</button>
                </div>
                <div class="modal-body" id="modal-eval-body">
                    <div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-eval-detalle')">Cerrar</button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-clipboard-list" style="color:var(--verde-itc);margin-right:8px"></i>Evaluaciones</h2>
                <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                    <select id="filtro-periodo-ev" class="form-control" style="width:190px" onchange="filtrarEvaluaciones()">
                        <option value="">Todos los períodos</option>
                    </select>
                    <select id="filtro-materia-ev" class="form-control" style="width:220px" onchange="filtrarEvaluaciones()">
                        <option value="">Todas las materias</option>
                    </select>
                </div>
            </div>
            <div class="card-body">
                <table id="tabla-eval" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Matrícula</th>
                            <th>Estudiante</th>
                            <th>Materia</th>
                            <th>Período</th>
                            <th>Criterios</th>
                            <th>Promedio</th>
                            <th style="width:80px">Detalle</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-eval"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarFiltrosEval(); // llama a cargarEvaluaciones internamente al terminar
}

// ------------------------------------------------------------
let tablaEval = null;

async function cargarFiltrosEval() {
    const [resPer, resMat] = await Promise.all([
        apiFetch('/periodos/index.php'),
        apiFetch(`/materias/index.php?carrera=${usuarioCoord.id_carrera}`),
    ]);

    const selPer = document.getElementById('filtro-periodo-ev');
    if (resPer?.ok) {
        resPer.data.data.forEach(p => {
            selPer.innerHTML += `<option value="${p.id_periodo}">${p.nombre}</option>`;
        });
        // Preseleccionar período activo
        const activo = resPer.data.data.find(p => p.activo == 1);
        if (activo) selPer.value = activo.id_periodo;
    }

    const selMat = document.getElementById('filtro-materia-ev');
    if (resMat?.ok) {
        resMat.data.data.forEach(m => {
            selMat.innerHTML += `<option value="${m.id_materia}">${m.id_materia} — ${m.nombre}</option>`;
        });
    }

    // Cargar tabla con los filtros ya establecidos
    await filtrarEvaluaciones();
}

async function filtrarEvaluaciones() {
    const periodo = document.getElementById('filtro-periodo-ev')?.value  || '';
    const materia = document.getElementById('filtro-materia-ev')?.value  || '';
    await cargarEvaluaciones(periodo, materia);
}

async function cargarEvaluaciones(periodo = '', materia = '') {
    let url = `/evaluaciones/index.php?carrera=${usuarioCoord.id_carrera}`;
    if (periodo) url += `&periodo=${periodo}`;
    if (materia) url += `&materia=${encodeURIComponent(materia)}`;

    const result = await apiFetch(url);
    if (!result?.ok) return;

    const PROM_COLOR = p => p >= 3.5 ? '#276749' : p >= 2.5 ? '#2b6cb0' : p >= 1.5 ? '#d69e2e' : '#c53030';

    const filas = result.data.data.map(ev => {
        const nombre = [ev.apellido_paterno, ev.apellido_materno, ev.est_nombre].filter(Boolean).join(' ');
        const prom   = ev.promedio ? parseFloat(ev.promedio) : null;
        return `
        <tr>
            <td><strong>${ev.matricula}</strong></td>
            <td>${nombre}</td>
            <td><small>${ev.id_materia}</small> ${ev.materia_nombre}</td>
            <td>${ev.periodo_nombre}</td>
            <td style="text-align:center">${ev.total_criterios}</td>
            <td style="text-align:center">
                ${prom !== null
                    ? `<strong style="color:${PROM_COLOR(prom)}">${prom.toFixed(2)}</strong>`
                    : '—'}
            </td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="verDetalleEval(${ev.id_evaluacion})">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center;color:#a0aec0">Sin evaluaciones registradas</td></tr>';

    if (tablaEval) { tablaEval.destroy(); tablaEval = null; }

    document.getElementById('tbody-eval').innerHTML = filas;

    tablaEval = $('#tabla-eval').DataTable(dtOpciones({
        pageLength: 15,
        columnDefs: [{ orderable: false, targets: 6 }],
    }));
}

// ------------------------------------------------------------
const LIKERT_LABEL_EV = { 1: 'No suficiente', 2: 'Suficiente', 3: 'Bueno', 4: 'Muy Bueno' };
const LIKERT_COLOR_EV = { 1: '#c53030', 2: '#d69e2e', 3: '#2b6cb0', 4: '#276749' };

async function verDetalleEval(id) {
    document.getElementById('modal-eval-titulo').textContent = 'Detalle de evaluación';
    document.getElementById('modal-eval-body').innerHTML =
        '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
    abrirModal('modal-eval-detalle');

    const result = await apiFetch(`/evaluaciones/item.php?id=${id}`);
    if (!result?.ok) {
        document.getElementById('modal-eval-body').innerHTML =
            '<p style="color:#c53030">Error al cargar el detalle.</p>';
        return;
    }

    const { cabecera, detalle } = result.data;
    const nombreEst = [cabecera.apellido_paterno, cabecera.apellido_materno, cabecera.est_nombre]
        .filter(Boolean).join(' ');

    document.getElementById('modal-eval-titulo').textContent =
        `${cabecera.matricula} — ${cabecera.id_materia}`;

    const seccionesAE = detalle.map(ae => {
        const criterioRows = ae.criterios.map(cr => {
            const color = LIKERT_COLOR_EV[cr.likert];
            const label = LIKERT_LABEL_EV[cr.likert];
            return `
            <tr>
                <td style="padding:8px 12px;font-size:0.82rem;color:#4a5568">${cr.codigo}</td>
                <td style="padding:8px 12px;font-size:0.82rem;color:#1a202c">${cr.descripcion}</td>
                <td style="padding:8px 12px;text-align:center">
                    <span style="font-weight:700;color:${color}">${cr.likert}</span>
                    <span style="font-size:0.72rem;color:${color};margin-left:4px">${label}</span>
                </td>
            </tr>`;
        }).join('');

        return `
        <div style="margin-bottom:20px">
            <div style="background:#f7fafc;border-left:4px solid var(--verde-itc);
                        padding:8px 14px;border-radius:0 6px 6px 0;margin-bottom:8px">
                <strong style="font-size:0.85rem;color:#1a202c">AE-${ae.codigo_ae} — ${ae.nombre || ''}</strong>
            </div>
            <table style="width:100%;border-collapse:collapse">
                <thead>
                    <tr style="background:#f7fafc">
                        <th style="padding:6px 12px;font-size:0.72rem;color:#718096;text-align:left;width:50px">Crit.</th>
                        <th style="padding:6px 12px;font-size:0.72rem;color:#718096;text-align:left">Descripción</th>
                        <th style="padding:6px 12px;font-size:0.72rem;color:#718096;text-align:center;width:140px">Calificación</th>
                    </tr>
                </thead>
                <tbody>${criterioRows}</tbody>
            </table>
        </div>`;
    }).join('');

    document.getElementById('modal-eval-body').innerHTML = `
        <div style="background:#f7fafc;border-radius:8px;padding:14px;margin-bottom:20px;
                    font-size:0.82rem;display:grid;grid-template-columns:1fr 1fr;gap:8px;color:#4a5568">
            <div><strong>Estudiante:</strong> ${nombreEst}</div>
            <div><strong>Matrícula:</strong> ${cabecera.matricula}</div>
            <div><strong>Materia:</strong> ${cabecera.id_materia} — ${cabecera.materia_nombre}</div>
            <div><strong>Período:</strong> ${cabecera.periodo_nombre}</div>
        </div>
        ${seccionesAE || '<p style="color:#a0aec0;text-align:center">Sin detalle registrado.</p>'}
    `;
}
