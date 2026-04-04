// ============================================================
// assets/js/coordinador/estudiantes-coord.js
// Vista de estudiantes del coordinador
// ============================================================

function initEstudiantesCoord() {
    document.getElementById('content-area').innerHTML = `

        <!-- Modal detalle de evaluación -->
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

        <!-- Modal importar alumnos desde CSV -->
        <div class="modal-overlay" id="modal-importar-est-csv">
            <div class="modal" style="max-width:700px;max-height:90vh;overflow-y:auto">
                <div class="modal-header">
                    <h3>Importar alumnos desde CSV</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-importar-est-csv')">&times;</button>
                </div>
                <div class="modal-body">

                    <div style="background:#ebf8ff;border:1px solid #bee3f8;border-radius:8px;
                                padding:14px 16px;margin-bottom:20px;font-size:0.82rem;color:#2c5282">
                        <strong>Formato del archivo CSV:</strong> cinco columnas con encabezado:
                        <code style="background:#fff;padding:1px 5px;border-radius:3px">
                            matricula,nombre,apellido_paterno,apellido_materno,semestre
                        </code>.
                        El separador puede ser coma (<code>,</code>) o punto y coma (<code>;</code>).
                        <br><br>
                        Ejemplo:
                        <pre style="background:#fff;padding:8px 10px;border-radius:4px;margin-top:6px;
                                    font-size:0.78rem;border:1px solid #bee3f8;overflow-x:auto">matricula,nombre,apellido_paterno,apellido_materno,semestre
21031430,Luis Roberto,Gómez,Ramírez,10
22031101,Ana,González,López,8</pre>
                        <a href="#" onclick="descargarPlantillaEstCSV(event)"
                           style="font-size:0.8rem;color:#2b6cb0;text-decoration:underline">
                            <i class="fa-solid fa-download"></i> Descargar plantilla vacía
                        </a>
                        <br><br>
                        <i class="fa-solid fa-circle-info" style="color:#3182ce"></i>
                        El correo se genera automáticamente como <strong>{matrícula}@itcelaya.edu.mx</strong>
                        y la contraseña temporal será el número de control del alumno.
                    </div>

                    <div style="margin-bottom:16px">
                        <label style="font-size:0.82rem;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">
                            Archivo CSV <span style="color:#c53030">*</span>
                        </label>
                        <input type="file" id="est-csv-file" accept=".csv,.txt"
                               class="form-control" style="padding:6px"
                               onchange="previsualizarEstCSV()">
                    </div>

                    <div id="est-csv-preview" style="display:none">
                        <div style="font-size:0.82rem;font-weight:600;color:#4a5568;margin-bottom:8px">
                            Vista previa — <span id="est-csv-count">0</span> alumnos detectados
                        </div>
                        <div style="max-height:240px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:6px">
                            <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
                                <thead>
                                    <tr style="background:#f7fafc;position:sticky;top:0">
                                        <th style="padding:6px 10px;text-align:left;color:#718096">Fila</th>
                                        <th style="padding:6px 10px;text-align:left;color:#718096">Matrícula</th>
                                        <th style="padding:6px 10px;text-align:left;color:#718096">Nombre</th>
                                        <th style="padding:6px 10px;text-align:left;color:#718096">Ap. Paterno</th>
                                        <th style="padding:6px 10px;text-align:left;color:#718096">Ap. Materno</th>
                                        <th style="padding:6px 10px;text-align:center;color:#718096">Sem.</th>
                                    </tr>
                                </thead>
                                <tbody id="est-csv-preview-body"></tbody>
                            </table>
                        </div>
                    </div>

                    <div id="est-csv-resultado" style="display:none;margin-top:16px"></div>
                    <div id="msg-est-csv" class="form-msg" style="margin-top:12px"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-importar-est-csv')">Cerrar</button>
                    <button id="btn-ejecutar-import-est" class="btn btn-primary" disabled
                            onclick="ejecutarImportEstCSV()">
                        <i class="fa-solid fa-user-plus"></i> Importar alumnos
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-users" style="color:var(--verde-itc);margin-right:8px"></i>Estudiantes</h2>
                <button class="btn btn-primary btn-sm" onclick="abrirModalImportEstCSV()">
                    <i class="fa-solid fa-file-csv"></i> Importar CSV
                </button>
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
// Modal importar CSV de alumnos
// ------------------------------------------------------------
let _estCsvFilas = [];

function abrirModalImportEstCSV() {
    document.getElementById('est-csv-file').value         = '';
    document.getElementById('est-csv-preview').style.display  = 'none';
    document.getElementById('est-csv-resultado').style.display = 'none';
    document.getElementById('msg-est-csv').className      = 'form-msg';
    document.getElementById('msg-est-csv').textContent    = '';
    document.getElementById('btn-ejecutar-import-est').disabled = true;
    _estCsvFilas = [];
    abrirModal('modal-importar-est-csv');
}

function previsualizarEstCSV() {
    const file = document.getElementById('est-csv-file').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        _estCsvFilas = parsearEstCSV(e.target.result);

        document.getElementById('est-csv-count').textContent = _estCsvFilas.length;
        const tbody = document.getElementById('est-csv-preview-body');
        tbody.innerHTML = _estCsvFilas.map((f, i) => `
            <tr style="border-bottom:1px solid #f7fafc">
                <td style="padding:5px 10px;color:#a0aec0">${i + 2}</td>
                <td style="padding:5px 10px;font-weight:600">${f.matricula}</td>
                <td style="padding:5px 10px">${f.nombre}</td>
                <td style="padding:5px 10px">${f.apellido_paterno}</td>
                <td style="padding:5px 10px">${f.apellido_materno}</td>
                <td style="padding:5px 10px;text-align:center">${f.semestre}</td>
            </tr>`).join('')
            || '<tr><td colspan="6" style="padding:10px;color:#c53030;text-align:center">No se detectaron filas válidas</td></tr>';

        document.getElementById('est-csv-preview').style.display  = _estCsvFilas.length > 0 ? 'block' : 'none';
        document.getElementById('est-csv-resultado').style.display = 'none';
        document.getElementById('btn-ejecutar-import-est').disabled = _estCsvFilas.length === 0;
    };
    reader.readAsText(file, 'UTF-8');
}

function parsearEstCSV(texto) {
    const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const filas  = [];

    for (let i = 0; i < lineas.length; i++) {
        const sep  = lineas[i].includes(';') ? ';' : ',';
        const cols = lineas[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''));

        // Saltar encabezado
        if (i === 0 && cols[0].toLowerCase() === 'matricula') continue;

        const matricula      = cols[0]?.toUpperCase() || '';
        const nombre         = cols[1] || '';
        const apellido_pat   = cols[2] || '';
        const apellido_mat   = cols[3] || '';
        const semestre       = parseInt(cols[4] || '0', 10);

        if (!matricula || !nombre) continue;

        filas.push({ matricula, nombre, apellido_paterno: apellido_pat, apellido_materno: apellido_mat, semestre });
    }

    return filas;
}

async function ejecutarImportEstCSV() {
    if (_estCsvFilas.length === 0) return;

    const btn = document.getElementById('btn-ejecutar-import-est');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importando...';

    const result = await apiFetch('/estudiantes/importar.php', {
        method: 'POST',
        body: JSON.stringify({ filas: _estCsvFilas }),
    });

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Importar alumnos';

    if (!result?.ok) {
        const el = document.getElementById('msg-est-csv');
        el.textContent = result?.data?.message || 'Error al importar.';
        el.className = 'form-msg error show';
        return;
    }

    const { insertados, duplicados, errores } = result.data;

    let html = `
        <div style="background:#f0fff4;border:1px solid #9ae6b4;border-radius:8px;padding:14px 16px;margin-bottom:12px">
            <strong style="color:#276749">Resultado de la importación</strong>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;font-size:0.82rem">
                <div style="text-align:center">
                    <div style="font-size:1.5rem;font-weight:700;color:#276749">${insertados}</div>
                    <div style="color:#718096">Insertados</div>
                </div>
                <div style="text-align:center">
                    <div style="font-size:1.5rem;font-weight:700;color:#d69e2e">${duplicados}</div>
                    <div style="color:#718096">Duplicados</div>
                </div>
                <div style="text-align:center">
                    <div style="font-size:1.5rem;font-weight:700;color:#c53030">${errores.length}</div>
                    <div style="color:#718096">Errores</div>
                </div>
            </div>
        </div>`;

    if (errores.length > 0) {
        html += `
        <div style="font-size:0.8rem;font-weight:600;color:#c53030;margin-bottom:6px">Filas con error:</div>
        <div style="max-height:160px;overflow-y:auto;border:1px solid #fed7d7;border-radius:6px">
            <table style="width:100%;border-collapse:collapse;font-size:0.78rem">
                <thead>
                    <tr style="background:#fff5f5">
                        <th style="padding:5px 10px;color:#718096;text-align:left">Fila</th>
                        <th style="padding:5px 10px;color:#718096;text-align:left">Matrícula</th>
                        <th style="padding:5px 10px;color:#718096;text-align:left">Motivo</th>
                    </tr>
                </thead>
                <tbody>
                    ${errores.map(er => `
                    <tr style="border-top:1px solid #fff5f5">
                        <td style="padding:5px 10px;color:#a0aec0">${er.fila}</td>
                        <td style="padding:5px 10px;font-weight:600">${er.matricula}</td>
                        <td style="padding:5px 10px;color:#c53030">${er.motivo}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    }

    const divRes = document.getElementById('est-csv-resultado');
    divRes.innerHTML = html;
    divRes.style.display = 'block';

    if (insertados > 0) cargarEstudiantesCoord();
}

function descargarPlantillaEstCSV(e) {
    e.preventDefault();
    const contenido = 'matricula,nombre,apellido_paterno,apellido_materno,semestre\n21031430,Luis Roberto,Gómez,Ramírez,10\n22031101,Ana,González,López,8\n';
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'plantilla_alumnos.csv';
    a.click();
    URL.revokeObjectURL(url);
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
