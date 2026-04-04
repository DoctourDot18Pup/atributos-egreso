// ============================================================
// assets/js/admin/estudiantes.js
// Módulo CRUD de Estudiantes
// ============================================================

function initEstudiantes() {
    document.getElementById('content-area').innerHTML = `

        <div class="modal-overlay" id="modal-estudiante">
            <div class="modal" style="max-width:580px">
                <div class="modal-header">
                    <h3 id="modal-estudiante-titulo">Nuevo Estudiante</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-estudiante')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-estudiante" novalidate>
                        <input type="hidden" id="est-modo">
                        <input type="hidden" id="est-id">

                        <div class="form-row">
                            <div class="form-group">
                                <label for="est-matricula">Matrícula *</label>
                                <input id="est-matricula" class="form-control" type="text"
                                       placeholder="Ej: 25030001" maxlength="20">
                            </div>
                            <div class="form-group">
                                <label for="est-carrera">Carrera *</label>
                                <select id="est-carrera" class="form-control"></select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="est-nombre">Nombre(s) *</label>
                                <input id="est-nombre" class="form-control" type="text"
                                       placeholder="Ej: Juan" maxlength="100">
                            </div>
                            <div class="form-group">
                                <label for="est-semestre">Semestre</label>
                                <select id="est-semestre" class="form-control">
                                    <option value="">— sin especificar —</option>
                                    ${Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}°</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="est-ap-pat">Apellido paterno</label>
                                <input id="est-ap-pat" class="form-control" type="text"
                                       placeholder="Ej: Pérez" maxlength="50">
                            </div>
                            <div class="form-group">
                                <label for="est-ap-mat">Apellido materno</label>
                                <input id="est-ap-mat" class="form-control" type="text"
                                       placeholder="Ej: García" maxlength="50">
                            </div>
                        </div>
                        <div class="form-group" id="grupo-activo-est" style="display:none">
                            <label for="est-activo">Estado</label>
                            <select id="est-activo" class="form-control">
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </div>
                        <div id="msg-estudiante" class="form-msg"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-estudiante')">Cancelar</button>
                    <button class="btn btn-primary" id="btn-guardar-est" onclick="guardarEstudiante()">
                        <i class="fa-solid fa-floppy-disk"></i> Guardar
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-users" style="color:var(--verde-itc);margin-right:8px"></i>Estudiantes</h2>
                <div style="display:flex;gap:10px;align-items:center">
                    <select id="filtro-carrera-est" class="form-control" style="width:220px" onchange="filtrarEstudiantes()">
                        <option value="">Todas las carreras</option>
                    </select>
                    <button class="btn btn-primary" onclick="abrirModalCrearEstudiante()">
                        <i class="fa-solid fa-plus"></i> Nuevo estudiante
                    </button>
                </div>
            </div>
            <div class="card-body">
                <table id="tabla-estudiantes" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Matrícula</th>
                            <th>Nombre completo</th>
                            <th>Carrera</th>
                            <th>Semestre</th>
                            <th>Estado</th>
                            <th style="width:100px">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-estudiantes"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarCarrerasEst();
    cargarEstudiantes();
}

// ------------------------------------------------------------
let tablaEstudiantes = null;
let datosEstCache    = {};

async function cargarCarrerasEst() {
    const result = await apiFetch('/carreras/index.php');
    if (!result?.ok) return;

    const carreras     = result.data.data.filter(c => c.activo == 1);
    const filtro       = document.getElementById('filtro-carrera-est');
    const selectForm   = document.getElementById('est-carrera');

    carreras.forEach(c => {
        const opt = `<option value="${c.id_carrera}">${c.id_carrera} — ${c.nombre}</option>`;
        if (filtro)     filtro.innerHTML    += opt;
        if (selectForm) selectForm.innerHTML += opt;
    });
}

async function filtrarEstudiantes() {
    const carrera = document.getElementById('filtro-carrera-est')?.value || '';
    await cargarEstudiantes(carrera);
}

async function cargarEstudiantes(carrera = '') {
    const url    = carrera ? `/estudiantes/index.php?carrera=${carrera}` : '/estudiantes/index.php';
    const result = await apiFetch(url);
    if (!result?.ok) return;

    datosEstCache = {};
    result.data.data.forEach(e => { datosEstCache[e.id_estudiante] = e; });

    const filas = result.data.data.map(e => {
        const nombreCompleto = [e.apellido_paterno, e.apellido_materno, e.nombre]
            .filter(Boolean).join(' ');
        return `
        <tr>
            <td><strong>${e.matricula}</strong></td>
            <td>${nombreCompleto}</td>
            <td><strong>${e.id_carrera}</strong> <small style="color:#718096">${e.carrera_nombre}</small></td>
            <td>${e.semestre ? e.semestre + '°' : '—'}</td>
            <td>
                <span class="badge badge-${e.activo == 1 ? 'activo' : 'inactivo'}">
                    ${e.activo == 1 ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="abrirModalEditarEstudiante(${e.id_estudiante})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-danger btn-sm" style="margin-left:4px"
                    onclick="toggleEstudiante(${e.id_estudiante},${e.activo})">
                    <i class="fa-solid fa-${e.activo == 1 ? 'ban' : 'circle-check'}"></i>
                </button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="6" style="text-align:center;color:#a0aec0">Sin estudiantes registrados</td></tr>';

    if (tablaEstudiantes) { tablaEstudiantes.destroy(); tablaEstudiantes = null; }

    document.getElementById('tbody-estudiantes').innerHTML = filas;

    tablaEstudiantes = $('#tabla-estudiantes').DataTable(dtOpciones({
        pageLength: 15,
        columnDefs: [{ orderable: false, targets: 5 }],
    }));
}

// ------------------------------------------------------------
function abrirModalCrearEstudiante() {
    document.getElementById('modal-estudiante-titulo').textContent  = 'Nuevo Estudiante';
    document.getElementById('est-modo').value                       = 'crear';
    document.getElementById('est-id').value                         = '';
    document.getElementById('est-matricula').value                  = '';
    document.getElementById('est-matricula').disabled               = false;
    document.getElementById('est-nombre').value                     = '';
    document.getElementById('est-ap-pat').value                     = '';
    document.getElementById('est-ap-mat').value                     = '';
    document.getElementById('est-carrera').selectedIndex            = 0;
    document.getElementById('est-semestre').value                   = '';
    document.getElementById('grupo-activo-est').style.display       = 'none';
    document.getElementById('msg-estudiante').className             = 'form-msg';
    abrirModal('modal-estudiante');
}

function abrirModalEditarEstudiante(id) {
    const e = datosEstCache[id];
    if (!e) return;

    document.getElementById('modal-estudiante-titulo').textContent  = 'Editar Estudiante';
    document.getElementById('est-modo').value                       = 'editar';
    document.getElementById('est-id').value                         = e.id_estudiante;
    document.getElementById('est-matricula').value                  = e.matricula;
    document.getElementById('est-matricula').disabled               = true;
    document.getElementById('est-nombre').value                     = e.nombre;
    document.getElementById('est-ap-pat').value                     = e.apellido_paterno || '';
    document.getElementById('est-ap-mat').value                     = e.apellido_materno || '';
    document.getElementById('est-carrera').value                    = e.id_carrera;
    document.getElementById('est-semestre').value                   = e.semestre || '';
    document.getElementById('est-activo').value                     = e.activo;
    document.getElementById('grupo-activo-est').style.display       = 'flex';
    document.getElementById('grupo-activo-est').style.flexDirection = 'column';
    document.getElementById('msg-estudiante').className             = 'form-msg';
    abrirModal('modal-estudiante');
}

// ------------------------------------------------------------
async function guardarEstudiante() {
    const modo     = document.getElementById('est-modo').value;
    const id       = document.getElementById('est-id').value;
    const matricula = document.getElementById('est-matricula').value.trim();
    const nombre   = document.getElementById('est-nombre').value.trim();
    const apPat    = document.getElementById('est-ap-pat').value.trim();
    const apMat    = document.getElementById('est-ap-mat').value.trim();
    const carrera  = document.getElementById('est-carrera').value;
    const semestre = document.getElementById('est-semestre').value;
    const btn      = document.getElementById('btn-guardar-est');

    if (!matricula || !nombre || !carrera) {
        mostrarMensajeModal('msg-estudiante', 'Matrícula, nombre y carrera son requeridos.', 'error');
        return;
    }

    btn.disabled = true;

    const body = {
        matricula, nombre,
        apellido_paterno: apPat || null,
        apellido_materno: apMat || null,
        id_carrera: carrera,
        semestre: semestre || null,
    };

    let result;
    if (modo === 'crear') {
        result = await apiFetch('/estudiantes/index.php', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    } else {
        body.activo = parseInt(document.getElementById('est-activo').value);
        result = await apiFetch(`/estudiantes/index.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    btn.disabled = false;

    if (!result?.ok) {
        mostrarMensajeModal('msg-estudiante', result?.data?.message || 'Error al guardar.', 'error');
        return;
    }

    cerrarModal('modal-estudiante');
    await cargarEstudiantes(document.getElementById('filtro-carrera-est')?.value || '');
}

// ------------------------------------------------------------
async function toggleEstudiante(id, activo) {
    const e = datosEstCache[id];
    if (!e) return;

    const nombreCompleto = [e.apellido_paterno, e.apellido_materno, e.nombre].filter(Boolean).join(' ');
    const msg = activo == 1
        ? `¿Desactivar al estudiante "${nombreCompleto}" (${e.matricula})?\n\nPodrás reactivarlo desde Editar.`
        : `¿Activar al estudiante "${nombreCompleto}" (${e.matricula})?`;
    if (!confirm(msg)) return;

    const nuevoEstado = activo == 1 ? 0 : 1;
    const result = activo == 1
        ? await apiFetch(`/estudiantes/index.php?id=${id}`, { method: 'DELETE' })
        : await apiFetch(`/estudiantes/index.php?id=${id}`, {
              method: 'PUT',
              body: JSON.stringify({ activo: nuevoEstado }),
          });

    if (!result?.ok) { alert(result?.data?.message || 'Error.'); return; }
    await cargarEstudiantes(document.getElementById('filtro-carrera-est')?.value || '');
}
