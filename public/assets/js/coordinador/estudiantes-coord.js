// ============================================================
// assets/js/coordinador/estudiantes-coord.js
// Vista de estudiantes del coordinador (solo lectura)
// ============================================================

function initEstudiantesCoord() {
    document.getElementById('content-area').innerHTML = `

        <!-- Modal detalle de evaluación (reutilizado aquí) -->
        <div class="modal-overlay" id="modal-eval-detalle-est">
            <div class="modal" style="max-width:680px;max-height:85vh;overflow-y:auto">
                <div class="modal-header">
                    <h3 id="modal-eval-detalle-est-titulo">Detalle de evaluación</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-eval-detalle-est')">&times;</button>
                </div>
                <div class="modal-body" id="modal-eval-detalle-est-body">
                    <div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-eval-detalle-est')">Cerrar</button>
                </div>
            </div>
        </div>

        <!-- Modal historial de evaluaciones del estudiante -->
        <div class="modal-overlay" id="modal-est-eval">
            <div class="modal" style="max-width:680px;max-height:85vh;overflow-y:auto">
                <div class="modal-header">
                    <h3 id="modal-est-eval-titulo">Evaluaciones del estudiante</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-est-eval')">&times;</button>
                </div>
                <div class="modal-body" id="modal-est-eval-body">
                    <div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-est-eval')">Cerrar</button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-users" style="color:var(--verde-itc);margin-right:8px"></i>Estudiantes</h2>
            </div>
            <div class="card-body">
                <table id="tabla-est-coord" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Matrícula</th>
                            <th>Nombre completo</th>
                            <th>Semestre</th>
                            <th>Estado</th>
                            <th style="width:80px">Historial</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-est-coord"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarEstudiantesCoord();
}

// ------------------------------------------------------------
let tablaEstCoord = null;

async function cargarEstudiantesCoord() {
    const result = await apiFetch(`/estudiantes/index.php?carrera=${usuarioCoord.id_carrera}`);
    if (!result?.ok) return;

    const filas = result.data.data.map(e => {
        const nombre  = [e.apellido_paterno, e.apellido_materno, e.nombre].filter(Boolean).join(' ');
        const semestre = e.semestre ? `${e.semestre}°` : '—';
        const estado  = e.activo == 1
            ? `<span style="padding:2px 8px;border-radius:12px;font-size:0.72rem;font-weight:700;
                            background:#f0fff4;color:#276749;border:1px solid #9ae6b4">Activo</span>`
            : `<span style="padding:2px 8px;border-radius:12px;font-size:0.72rem;font-weight:700;
                            background:#fff5f5;color:#c53030;border:1px solid #feb2b2">Inactivo</span>`;

        return `
        <tr>
            <td><strong>${e.matricula}</strong></td>
            <td>${nombre}</td>
            <td style="text-align:center">${semestre}</td>
            <td>${estado}</td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="verHistorialEstudiante(${e.id_estudiante}, '${e.matricula}')">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                </button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:#a0aec0">Sin estudiantes registrados</td></tr>';

    if (tablaEstCoord) { tablaEstCoord.destroy(); tablaEstCoord = null; }
    document.getElementById('tbody-est-coord').innerHTML = filas;
    tablaEstCoord = $('#tabla-est-coord').DataTable(dtOpciones({
        pageLength: 15,
        columnDefs: [{ orderable: false, targets: [3, 4] }],
    }));
}

// ------------------------------------------------------------
const PROM_COLOR_EST = p => p >= 3.5 ? '#276749' : p >= 2.5 ? '#2b6cb0' : p >= 1.5 ? '#d69e2e' : '#c53030';

async function verHistorialEstudiante(idEstudiante, matricula) {
    document.getElementById('modal-est-eval-titulo').textContent = `Evaluaciones — ${matricula}`;
    document.getElementById('modal-est-eval-body').innerHTML =
        '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
    abrirModal('modal-est-eval');

    const result = await apiFetch(
        `/evaluaciones/index.php?carrera=${usuarioCoord.id_carrera}&estudiante=${idEstudiante}`
    );

    if (!result?.ok) {
        document.getElementById('modal-est-eval-body').innerHTML =
            '<p style="color:#c53030">Error al cargar el historial.</p>';
        return;
    }

    const evals = result.data.data;
    if (evals.length === 0) {
        document.getElementById('modal-est-eval-body').innerHTML =
            '<p style="text-align:center;color:#a0aec0">Este estudiante no tiene evaluaciones registradas.</p>';
        return;
    }

    const filas = evals.map(ev => {
        const prom = ev.promedio ? parseFloat(ev.promedio) : null;
        const promHtml = prom !== null
            ? `<strong style="color:${PROM_COLOR_EST(prom)}">${prom.toFixed(2)}</strong>`
            : '—';

        return `
        <tr>
            <td style="padding:10px 12px;font-size:0.82rem">
                <strong style="font-size:0.78rem">${ev.id_materia}</strong>
                <div style="color:#4a5568;font-size:0.78rem">${ev.materia_nombre}</div>
            </td>
            <td style="padding:10px 12px;font-size:0.82rem;color:#4a5568">${ev.periodo_nombre}</td>
            <td style="padding:10px 12px;text-align:center;font-size:0.82rem">${ev.total_criterios}</td>
            <td style="padding:10px 12px;text-align:center">${promHtml}</td>
            <td style="padding:10px 12px;text-align:center">
                <button class="btn btn-secondary btn-sm"
                    onclick="verDetalleEvalEst(${ev.id_evaluacion})">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    document.getElementById('modal-est-eval-body').innerHTML = `
        <table style="width:100%;border-collapse:collapse">
            <thead>
                <tr style="background:#f7fafc">
                    <th style="padding:8px 12px;font-size:0.72rem;color:#718096;text-align:left">Materia</th>
                    <th style="padding:8px 12px;font-size:0.72rem;color:#718096;text-align:left">Período</th>
                    <th style="padding:8px 12px;font-size:0.72rem;color:#718096;text-align:center;width:70px">Criterios</th>
                    <th style="padding:8px 12px;font-size:0.72rem;color:#718096;text-align:center;width:80px">Promedio</th>
                    <th style="padding:8px 12px;font-size:0.72rem;color:#718096;text-align:center;width:60px">Ver</th>
                </tr>
            </thead>
            <tbody>${filas}</tbody>
        </table>`;
}

// ------------------------------------------------------------
const LIKERT_LABEL_EST = { 1: 'No suficiente', 2: 'Suficiente', 3: 'Bueno', 4: 'Muy Bueno' };
const LIKERT_COLOR_EST = { 1: '#c53030', 2: '#d69e2e', 3: '#2b6cb0', 4: '#276749' };

async function verDetalleEvalEst(id) {
    document.getElementById('modal-eval-detalle-est-titulo').textContent = 'Detalle de evaluación';
    document.getElementById('modal-eval-detalle-est-body').innerHTML =
        '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
    abrirModal('modal-eval-detalle-est');

    const result = await apiFetch(`/evaluaciones/item.php?id=${id}`);
    if (!result?.ok) {
        document.getElementById('modal-eval-detalle-est-body').innerHTML =
            '<p style="color:#c53030">Error al cargar el detalle.</p>';
        return;
    }

    const { cabecera, detalle } = result.data;
    const nombreEst = [cabecera.apellido_paterno, cabecera.apellido_materno, cabecera.est_nombre]
        .filter(Boolean).join(' ');

    document.getElementById('modal-eval-detalle-est-titulo').textContent =
        `${cabecera.matricula} — ${cabecera.id_materia}`;

    const seccionesAE = detalle.map(ae => {
        const criterioRows = ae.criterios.map(cr => {
            const color = LIKERT_COLOR_EST[cr.likert];
            const label = LIKERT_LABEL_EST[cr.likert];
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

    document.getElementById('modal-eval-detalle-est-body').innerHTML = `
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
