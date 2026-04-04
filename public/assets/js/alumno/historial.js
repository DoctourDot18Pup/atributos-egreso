// ============================================================
// assets/js/alumno/historial.js
// Historial de evaluaciones del alumno
// ============================================================

function initHistorialAlumno() {
    document.getElementById('content-area').innerHTML = `

        <!-- Modal detalle evaluación -->
        <div class="modal-overlay" id="modal-hist-detalle">
            <div class="modal" style="max-width:680px;max-height:85vh;overflow-y:auto">
                <div class="modal-header">
                    <h3 id="modal-hist-titulo">Detalle de evaluación</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-hist-detalle')">&times;</button>
                </div>
                <div class="modal-body" id="modal-hist-body">
                    <div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-hist-detalle')">Cerrar</button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-clock-rotate-left" style="color:var(--verde-itc);margin-right:8px"></i>Mis evaluaciones</h2>
                <select id="filtro-periodo-hist" class="form-control" style="width:200px"
                        onchange="filtrarHistorial()">
                    <option value="">Todos los períodos</option>
                </select>
            </div>
            <div class="card-body">
                <table id="tabla-hist" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Materia</th>
                            <th>Período</th>
                            <th>Criterios</th>
                            <th>Promedio</th>
                            <th style="width:80px">Detalle</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-hist"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarHistorial();
    cargarFiltrosPeriodoHist();
}

// ------------------------------------------------------------
let tablaHist = null;

async function cargarFiltrosPeriodoHist() {
    const res = await apiFetch('/periodos/index.php');
    if (!res?.ok) return;
    const sel = document.getElementById('filtro-periodo-hist');
    if (!sel) return;
    res.data.data.forEach(p => {
        sel.innerHTML += `<option value="${p.id_periodo}">${p.nombre}</option>`;
    });
}

async function filtrarHistorial() {
    const periodo = document.getElementById('filtro-periodo-hist')?.value || '';
    await cargarHistorial(periodo);
}

async function cargarHistorial(periodo = '') {
    let url = '/evaluaciones/index.php';
    if (periodo) url += `?periodo=${periodo}`;

    const result = await apiFetch(url);
    if (!result?.ok) return;

    const PROM_COLOR = p => p >= 3.5 ? '#276749' : p >= 2.5 ? '#2b6cb0' : p >= 1.5 ? '#d69e2e' : '#c53030';

    const filas = result.data.data.map(ev => {
        const prom = ev.promedio ? parseFloat(ev.promedio) : null;
        return `
        <tr>
            <td>
                <strong style="font-size:0.78rem">${ev.id_materia}</strong>
                <div style="font-size:0.82rem;color:#4a5568">${ev.materia_nombre}</div>
            </td>
            <td>${ev.periodo_nombre}</td>
            <td style="text-align:center">${ev.total_criterios}</td>
            <td style="text-align:center">
                ${prom !== null
                    ? `<strong style="color:${PROM_COLOR(prom)}">${prom.toFixed(2)}</strong>`
                    : '—'}
            </td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="verDetalleHist(${ev.id_evaluacion})">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    if (tablaHist) { tablaHist.destroy(); tablaHist = null; }
    document.getElementById('tbody-hist').innerHTML = filas;
    tablaHist = $('#tabla-hist').DataTable(dtOpcionesAlumno({
        pageLength: 15,
        columnDefs: [{ orderable: false, targets: 4 }],
    }));
}

// ------------------------------------------------------------
const LIKERT_LABEL_HIST = { 1: 'No suficiente', 2: 'Suficiente', 3: 'Bueno', 4: 'Muy Bueno' };
const LIKERT_COLOR_HIST = { 1: '#c53030', 2: '#d69e2e', 3: '#2b6cb0', 4: '#276749' };

async function verDetalleHist(id) {
    document.getElementById('modal-hist-titulo').textContent = 'Detalle de evaluación';
    document.getElementById('modal-hist-body').innerHTML =
        '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
    abrirModal('modal-hist-detalle');

    const result = await apiFetch(`/evaluaciones/item.php?id=${id}`);
    if (!result?.ok) {
        document.getElementById('modal-hist-body').innerHTML =
            '<p style="color:#c53030">Error al cargar el detalle.</p>';
        return;
    }

    const { cabecera, detalle } = result.data;
    document.getElementById('modal-hist-titulo').textContent =
        `${cabecera.id_materia} — ${cabecera.periodo_nombre}`;

    const seccionesAE = detalle.map(ae => {
        const criterioRows = ae.criterios.map(cr => {
            const color = LIKERT_COLOR_HIST[cr.likert];
            const label = LIKERT_LABEL_HIST[cr.likert];
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

    document.getElementById('modal-hist-body').innerHTML = `
        <div style="background:#f7fafc;border-radius:8px;padding:14px;margin-bottom:20px;
                    font-size:0.82rem;display:grid;grid-template-columns:1fr 1fr;gap:8px;color:#4a5568">
            <div><strong>Materia:</strong> ${cabecera.id_materia} — ${cabecera.materia_nombre}</div>
            <div><strong>Período:</strong> ${cabecera.periodo_nombre}</div>
            <div><strong>Fecha:</strong> ${cabecera.fecha_evaluacion ? new Date(cabecera.fecha_evaluacion).toLocaleDateString('es-MX') : '—'}</div>
        </div>
        ${seccionesAE || '<p style="color:#a0aec0;text-align:center">Sin detalle registrado.</p>'}
    `;
}
