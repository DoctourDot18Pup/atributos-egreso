// ============================================================
// assets/js/coordinador/inscripciones.js
// Gestión de inscripciones por período — panel coordinador
// ============================================================

function initInscripciones() {
    document.getElementById('content-area').innerHTML = `

        <!-- Modal gestionar materias de un alumno -->
        <div class="modal-overlay" id="modal-gestionar-ins">
            <div class="modal" style="max-width:640px;max-height:85vh;overflow-y:auto">
                <div class="modal-header">
                    <h3 id="modal-ins-titulo">Materias inscritas</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-gestionar-ins')">&times;</button>
                </div>
                <div class="modal-body" id="modal-ins-body">
                    <div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-gestionar-ins')">Cerrar</button>
                </div>
            </div>
        </div>

        <!-- Modal importar CSV -->
        <div class="modal-overlay" id="modal-importar-csv">
            <div class="modal" style="max-width:680px;max-height:90vh;overflow-y:auto">
                <div class="modal-header">
                    <h3>Importar inscripciones desde CSV</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-importar-csv')">&times;</button>
                </div>
                <div class="modal-body">

                    <div style="background:#ebf8ff;border:1px solid #bee3f8;border-radius:8px;
                                padding:14px 16px;margin-bottom:20px;font-size:0.82rem;color:#2c5282">
                        <strong>Formato del archivo CSV:</strong> dos columnas sin encabezado especial o con encabezado
                        <code style="background:#fff;padding:1px 5px;border-radius:3px">matricula,id_materia</code>.
                        El separador debe ser coma (<code>,</code>) o punto y coma (<code>;</code>).
                        <br><br>
                        Ejemplo:
                        <pre style="background:#fff;padding:8px 10px;border-radius:4px;margin-top:6px;
                                    font-size:0.78rem;border:1px solid #bee3f8;overflow-x:auto">matricula,id_materia
21031430,SCG-1009
21031430,ACA-0910
21031430,IDD-2502
21020001,SCD-1021</pre>
                        <a id="btn-descargar-plantilla" href="#" onclick="descargarPlantillaCSV(event)"
                           style="font-size:0.8rem;color:#2b6cb0;text-decoration:underline">
                            <i class="fa-solid fa-download"></i> Descargar plantilla vacía
                        </a>
                    </div>

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
                        <div>
                            <label style="font-size:0.82rem;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">
                                Período <span style="color:#c53030">*</span>
                            </label>
                            <select id="csv-periodo" class="form-control">
                                <option value="">Selecciona un período</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size:0.82rem;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">
                                Archivo CSV <span style="color:#c53030">*</span>
                            </label>
                            <input type="file" id="csv-file" accept=".csv,.txt"
                                   class="form-control" style="padding:6px"
                                   onchange="previsualizarCSV()">
                        </div>
                    </div>

                    <div id="csv-preview" style="display:none">
                        <div style="font-size:0.82rem;font-weight:600;color:#4a5568;margin-bottom:8px">
                            Vista previa — <span id="csv-count">0</span> filas detectadas
                        </div>
                        <div style="max-height:220px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:6px">
                            <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
                                <thead>
                                    <tr style="background:#f7fafc;position:sticky;top:0">
                                        <th style="padding:6px 10px;text-align:left;color:#718096">Fila</th>
                                        <th style="padding:6px 10px;text-align:left;color:#718096">Matrícula</th>
                                        <th style="padding:6px 10px;text-align:left;color:#718096">ID Materia</th>
                                    </tr>
                                </thead>
                                <tbody id="csv-preview-body"></tbody>
                            </table>
                        </div>
                    </div>

                    <div id="csv-resultado" style="display:none;margin-top:16px"></div>
                    <div id="msg-csv" class="form-msg" style="margin-top:12px"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-importar-csv')">Cerrar</button>
                    <button id="btn-ejecutar-import" class="btn btn-primary" disabled
                            onclick="ejecutarImportCSV()">
                        <i class="fa-solid fa-file-import"></i> Importar
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-list-check" style="color:var(--verde-itc);margin-right:8px"></i>Inscripciones</h2>
                <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                    <select id="filtro-periodo-ins" class="form-control" style="width:200px"
                            onchange="cargarTablaInscripciones()">
                        <option value="">— Selecciona período —</option>
                    </select>
                    <button class="btn btn-primary btn-sm" onclick="abrirModalImportCSV()">
                        <i class="fa-solid fa-file-csv"></i> Importar CSV
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div id="ins-content">
                    <table id="tabla-ins" class="display" style="width:100%">
                        <thead>
                            <tr>
                                <th>Matrícula</th>
                                <th>Estudiante</th>
                                <th style="width:80px">Semestre</th>
                                <th>Materias inscritas</th>
                                <th style="width:100px">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-ins"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    cargarPeriodosIns();
}

// ------------------------------------------------------------
let periodoInsCache = [];
let materiasInsCache = [];
let estudiantesInsCache = [];

async function cargarPeriodosIns() {
    const [resPer, resMat, resEst] = await Promise.all([
        apiFetch('/periodos/index.php'),
        apiFetch(`/materias/index.php?carrera=${usuarioCoord.id_carrera}`),
        apiFetch(`/estudiantes/index.php?carrera=${usuarioCoord.id_carrera}`),
    ]);

    if (resMat?.ok) materiasInsCache = resMat.data.data;
    if (resEst?.ok) estudiantesInsCache = resEst.data.data.filter(e => e.activo == 1);

    if (resPer?.ok) {
        periodoInsCache = resPer.data.data;
        const sel = document.getElementById('filtro-periodo-ins');
        periodoInsCache.forEach(p => {
            sel.innerHTML += `<option value="${p.id_periodo}">${p.nombre}</option>`;
        });
        // Preseleccionar período activo
        const activo = periodoInsCache.find(p => p.activo == 1);
        if (activo) {
            sel.value = activo.id_periodo;
            cargarTablaInscripciones();
        }
    }
}

// ------------------------------------------------------------
let tablaIns = null;

async function cargarTablaInscripciones() {
    const idPeriodo = document.getElementById('filtro-periodo-ins')?.value;
    if (!idPeriodo) return;

    if (tablaIns) { tablaIns.destroy(); tablaIns = null; }
    document.getElementById('tbody-ins').innerHTML =
        '<tr><td colspan="5" style="text-align:center"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>';

    const result = await apiFetch(
        `/inscripciones/index.php?periodo=${idPeriodo}&carrera=${usuarioCoord.id_carrera}`
    );
    console.log('[inscripciones] periodo:', idPeriodo, '| carrera:', usuarioCoord.id_carrera);
    console.log('[inscripciones] respuesta API:', result);
    if (!result?.ok) return;

    // El API ya devuelve TODOS los alumnos de la carrera (LEFT JOIN).
    // Una fila por alumno-materia; id_materia es null cuando no tiene inscripciones.
    const porEst = {};
    result.data.data.forEach(fila => {
        if (!porEst[fila.id_estudiante]) {
            porEst[fila.id_estudiante] = {
                id_estudiante: fila.id_estudiante,
                matricula:     fila.matricula,
                nombre:        [fila.apellido_paterno, fila.apellido_materno, fila.est_nombre].filter(Boolean).join(' '),
                semestre:      fila.semestre,
                materias:      [],
            };
        }
        // Solo agregar materia si existe (no es null)
        if (fila.id_materia) {
            porEst[fila.id_estudiante].materias.push({
                id_inscripcion: fila.id_inscripcion,
                id_materia:     fila.id_materia,
                nombre:         fila.materia_nombre,
            });
        }
    });

    const filas = Object.values(porEst).map(est => {
        const sem     = est.semestre ? `${est.semestre}°` : '—';
        const numMat  = est.materias.length;
        const badge   = numMat > 0
            ? est.materias.map(m => `
                <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;
                             border-radius:12px;font-size:0.72rem;background:#f0fff4;
                             color:#276749;border:1px solid #9ae6b4;margin:2px 3px 2px 0">
                    <span style="font-weight:700">${m.id_materia}</span>
                    <span style="color:#4a7c59">${m.nombre}</span>
                </span>`).join('')
            : `<span style="padding:2px 8px;border-radius:12px;font-size:0.72rem;font-weight:700;
                            background:#fff5f5;color:#c53030;border:1px solid #feb2b2">Sin inscripciones</span>`;

        return `<tr>
            <td><strong>${est.matricula}</strong></td>
            <td>${est.nombre}</td>
            <td style="text-align:center">${sem}</td>
            <td>${badge}</td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="abrirGestionarIns(${est.id_estudiante}, ${idPeriodo})">
                    <i class="fa-solid fa-pen-to-square"></i> Gestionar
                </button>
            </td>
        </tr>`;
    }).join('');

    document.getElementById('tbody-ins').innerHTML = filas;
    tablaIns = $('#tabla-ins').DataTable(dtOpciones({
        pageLength: 20,
        columnDefs: [{ orderable: false, targets: [3, 4] }],
    }));
}

// ------------------------------------------------------------
// Modal gestionar inscripciones de un alumno
// ------------------------------------------------------------
let _insGestEstId  = null;
let _insGestPerId  = null;

async function abrirGestionarIns(idEstudiante, idPeriodo) {
    _insGestEstId = idEstudiante;
    _insGestPerId = idPeriodo;

    const est = estudiantesInsCache.find(e => e.id_estudiante == idEstudiante);
    const nombreEst = est
        ? [est.apellido_paterno, est.apellido_materno, est.nombre].filter(Boolean).join(' ')
        : `Alumno #${idEstudiante}`;

    document.getElementById('modal-ins-titulo').textContent = nombreEst;
    document.getElementById('modal-ins-body').innerHTML =
        '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
    abrirModal('modal-gestionar-ins');

    await renderGestionarIns();
}

async function renderGestionarIns() {
    const result = await apiFetch(
        `/inscripciones/index.php?periodo=${_insGestPerId}&estudiante=${_insGestEstId}`
    );
    if (!result?.ok) {
        document.getElementById('modal-ins-body').innerHTML =
            '<p style="color:#c53030">Error al cargar inscripciones.</p>';
        return;
    }

    // Filtrar solo las filas con materia (LEFT JOIN puede traer fila sin materia)
    const inscritas = result.data.data.filter(f => f.id_materia);
    const inscritasIds = new Set(inscritas.map(i => i.id_materia));

    // Materias disponibles para agregar (de la carrera, no inscritas aún)
    const disponibles = materiasInsCache.filter(m => !inscritasIds.has(m.id_materia));

    const listaInscritas = inscritas.length > 0
        ? inscritas.map(ins => `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:10px 14px;background:#f7fafc;border-radius:8px;margin-bottom:6px;
                        border:1px solid #e2e8f0">
                <div>
                    <span style="font-size:0.75rem;font-weight:700;color:#276749">${ins.id_materia}</span>
                    <span style="font-size:0.85rem;color:#1a202c;margin-left:8px">${ins.materia_nombre}</span>
                </div>
                <button class="btn btn-sm" style="background:#fff5f5;color:#c53030;border:1px solid #feb2b2"
                    onclick="eliminarInscripcion(${ins.id_inscripcion})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>`).join('')
        : '<p style="text-align:center;color:#a0aec0;font-size:0.85rem;padding:16px 0">Sin materias inscritas en este período.</p>';

    const selectDisponibles = disponibles.length > 0
        ? `<select id="sel-nueva-materia" class="form-control" style="flex:1">
                <option value="">— Selecciona materia —</option>
                ${disponibles.map(m => `<option value="${m.id_materia}">${m.id_materia} — ${m.nombre}</option>`).join('')}
           </select>
           <button class="btn btn-primary btn-sm" onclick="agregarInscripcion()">
               <i class="fa-solid fa-plus"></i> Agregar
           </button>`
        : `<span style="font-size:0.82rem;color:#a0aec0">Todas las materias de la carrera ya están inscritas.</span>`;

    document.getElementById('modal-ins-body').innerHTML = `
        <div style="margin-bottom:16px">
            <div style="font-size:0.78rem;font-weight:700;color:#718096;text-transform:uppercase;
                        letter-spacing:.04em;margin-bottom:10px">
                Materias inscritas (${inscritas.length})
            </div>
            ${listaInscritas}
        </div>
        <div style="border-top:1px solid #e2e8f0;padding-top:16px">
            <div style="font-size:0.78rem;font-weight:700;color:#718096;text-transform:uppercase;
                        letter-spacing:.04em;margin-bottom:10px">
                Agregar materia
            </div>
            <div style="display:flex;gap:8px;align-items:center">${selectDisponibles}</div>
            <div id="msg-ins-gestion" class="form-msg" style="margin-top:10px"></div>
        </div>`;
}

async function agregarInscripcion() {
    const idMateria = document.getElementById('sel-nueva-materia')?.value;
    if (!idMateria) return;

    const result = await apiFetch('/inscripciones/index.php', {
        method: 'POST',
        body: JSON.stringify({
            id_estudiante: _insGestEstId,
            id_materia:    idMateria,
            id_periodo:    _insGestPerId,
        }),
    });

    if (result?.ok) {
        await renderGestionarIns();
        cargarTablaInscripciones(); // Refrescar tabla principal
    } else {
        const el = document.getElementById('msg-ins-gestion');
        if (el) { el.textContent = result?.data?.message || 'Error al agregar.'; el.className = 'form-msg error show'; }
    }
}

async function eliminarInscripcion(idInscripcion) {
    if (!confirm('¿Eliminar esta inscripción?')) return;

    const result = await apiFetch(`/inscripciones/index.php?id=${idInscripcion}`, {
        method: 'DELETE',
    });

    if (result?.ok) {
        await renderGestionarIns();
        cargarTablaInscripciones();
    } else {
        alert(result?.data?.message || 'Error al eliminar.');
    }
}

// ------------------------------------------------------------
// CSV Import
// ------------------------------------------------------------
let _csvFilas = [];

function abrirModalImportCSV() {
    // Poblar selector de períodos en el modal
    const sel = document.getElementById('csv-periodo');
    sel.innerHTML = '<option value="">Selecciona un período</option>';
    periodoInsCache.forEach(p => {
        const opt = document.createElement('option');
        opt.value       = p.id_periodo;
        opt.textContent = p.nombre;
        if (p.activo == 1) opt.selected = true;
        sel.appendChild(opt);
    });

    // Preseleccionar período activo explícitamente DESPUÉS de añadir opciones
    const periodoActivo = periodoInsCache.find(p => p.activo == 1);
    if (periodoActivo) sel.value = periodoActivo.id_periodo;

    // Limpiar estado previo
    document.getElementById('csv-file').value       = '';
    document.getElementById('csv-preview').style.display  = 'none';
    document.getElementById('csv-resultado').style.display = 'none';
    document.getElementById('msg-csv').className    = 'form-msg';
    document.getElementById('msg-csv').textContent  = '';
    document.getElementById('btn-ejecutar-import').disabled = true;
    _csvFilas = [];

    abrirModal('modal-importar-csv');
}

function previsualizarCSV() {
    const file = document.getElementById('csv-file').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        const texto = e.target.result;
        _csvFilas   = parsearCSV(texto);

        const tbody = document.getElementById('csv-preview-body');
        document.getElementById('csv-count').textContent = _csvFilas.length;

        tbody.innerHTML = _csvFilas.map((f, i) => `
            <tr style="border-bottom:1px solid #f7fafc">
                <td style="padding:5px 10px;color:#a0aec0">${i + 2}</td>
                <td style="padding:5px 10px;font-weight:600">${f.matricula}</td>
                <td style="padding:5px 10px">${f.id_materia}</td>
            </tr>`).join('') || '<tr><td colspan="3" style="padding:10px;color:#c53030;text-align:center">No se detectaron filas válidas</td></tr>';

        document.getElementById('csv-preview').style.display  = _csvFilas.length > 0 ? 'block' : 'none';
        document.getElementById('csv-resultado').style.display = 'none';
        document.getElementById('btn-ejecutar-import').disabled = _csvFilas.length === 0;
    };
    reader.readAsText(file, 'UTF-8');
}

function parsearCSV(texto) {
    const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const filas  = [];

    for (let i = 0; i < lineas.length; i++) {
        // Detectar separador (coma o punto y coma)
        const sep    = lineas[i].includes(';') ? ';' : ',';
        const cols   = lineas[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
        const mat    = cols[0]?.toUpperCase() || '';
        const matId  = cols[1]?.toUpperCase() || '';

        // Saltar encabezado si la primera columna dice "matricula" (case-insensitive)
        if (i === 0 && mat.toLowerCase() === 'matricula') continue;
        if (!mat || !matId) continue;

        filas.push({ matricula: mat, id_materia: matId });
    }

    return filas;
}

async function ejecutarImportCSV() {
    const idPeriodo = document.getElementById('csv-periodo')?.value;
    if (!idPeriodo) {
        const el = document.getElementById('msg-csv');
        el.textContent = 'Selecciona un período antes de importar.';
        el.className = 'form-msg error show';
        return;
    }
    if (_csvFilas.length === 0) return;

    const btn = document.getElementById('btn-ejecutar-import');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importando...';

    const result = await apiFetch('/inscripciones/importar.php', {
        method: 'POST',
        body: JSON.stringify({ id_periodo: parseInt(idPeriodo), filas: _csvFilas }),
    });

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-file-import"></i> Importar';

    if (!result?.ok) {
        const el = document.getElementById('msg-csv');
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
        <div style="font-size:0.8rem;font-weight:600;color:#c53030;margin-bottom:6px">
            Filas con error:
        </div>
        <div style="max-height:160px;overflow-y:auto;border:1px solid #fed7d7;border-radius:6px">
            <table style="width:100%;border-collapse:collapse;font-size:0.78rem">
                <thead>
                    <tr style="background:#fff5f5">
                        <th style="padding:5px 10px;color:#718096;text-align:left">Fila</th>
                        <th style="padding:5px 10px;color:#718096;text-align:left">Matrícula</th>
                        <th style="padding:5px 10px;color:#718096;text-align:left">Materia</th>
                        <th style="padding:5px 10px;color:#718096;text-align:left">Motivo</th>
                    </tr>
                </thead>
                <tbody>
                    ${errores.map(er => `
                    <tr style="border-top:1px solid #fff5f5">
                        <td style="padding:5px 10px;color:#a0aec0">${er.fila}</td>
                        <td style="padding:5px 10px;font-weight:600">${er.matricula}</td>
                        <td style="padding:5px 10px">${er.id_materia}</td>
                        <td style="padding:5px 10px;color:#c53030">${er.motivo}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    }

    const divRes = document.getElementById('csv-resultado');
    divRes.innerHTML = html;
    divRes.style.display = 'block';

    if (insertados > 0) cargarTablaInscripciones();
}

function descargarPlantillaCSV(e) {
    e.preventDefault();
    const contenido = 'matricula,id_materia\n21030001,SCG-1009\n21030001,ACA-0910\n';
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'plantilla_inscripciones.csv';
    a.click();
    URL.revokeObjectURL(url);
}
