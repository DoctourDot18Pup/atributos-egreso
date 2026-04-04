// ============================================================
// assets/js/admin/materias.js
// Módulo CRUD de Materias
// ============================================================

function initMaterias() {
    document.getElementById('content-area').innerHTML = `

        <div class="modal-overlay" id="modal-materia">
            <div class="modal" style="max-width:540px">
                <div class="modal-header">
                    <h3 id="modal-materia-titulo">Nueva Materia</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-materia')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-materia" novalidate>
                        <input type="hidden" id="materia-modo">
                        <input type="hidden" id="materia-id-original">

                        <div class="form-row">
                            <div class="form-group">
                                <label for="materia-id">Clave (ID) *</label>
                                <input id="materia-id" class="form-control" type="text"
                                       placeholder="Ej: ACA-0907" maxlength="20"
                                       style="text-transform:uppercase">
                            </div>
                            <div class="form-group">
                                <label for="materia-nombre">Nombre *</label>
                                <input id="materia-nombre" class="form-control" type="text"
                                       placeholder="Nombre de la materia" maxlength="200">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="materia-inicio">Fecha inicio</label>
                                <input id="materia-inicio" class="form-control" type="date">
                            </div>
                            <div class="form-group">
                                <label for="materia-fin">Fecha fin <small style="color:#a0aec0">(vacío = vigente)</small></label>
                                <input id="materia-fin" class="form-control" type="date">
                            </div>
                        </div>
                        <div class="form-group" id="grupo-activo-materia" style="display:none">
                            <label for="materia-activo">Estado</label>
                            <select id="materia-activo" class="form-control">
                                <option value="1">Activa</option>
                                <option value="0">Inactiva</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Carreras asociadas</label>
                            <div id="checkboxes-carreras" style="
                                display:grid;grid-template-columns:1fr 1fr;gap:8px;
                                background:#f7fafc;border:1.5px solid #d1d9d1;
                                border-radius:7px;padding:12px;max-height:180px;overflow-y:auto">
                                <span style="color:#a0aec0;font-size:0.8rem">Cargando carreras...</span>
                            </div>
                        </div>
                        <div id="msg-materia" class="form-msg"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-materia')">Cancelar</button>
                    <button class="btn btn-primary" id="btn-guardar-materia" onclick="guardarMateria()">
                        <i class="fa-solid fa-floppy-disk"></i> Guardar
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-book" style="color:var(--verde-itc);margin-right:8px"></i>Materias</h2>
                <div style="display:flex;gap:10px;align-items:center">
                    <select id="filtro-carrera-mat" class="form-control" style="width:220px" onchange="filtrarMaterias()">
                        <option value="">Todas las carreras</option>
                    </select>
                    <button class="btn btn-primary" onclick="abrirModalCrearMateria()">
                        <i class="fa-solid fa-plus"></i> Nueva materia
                    </button>
                </div>
            </div>
            <div class="card-body">
                <table id="tabla-materias" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Clave</th>
                            <th>Nombre</th>
                            <th>Carreras</th>
                            <th>Fecha inicio</th>
                            <th>Estado</th>
                            <th style="width:120px">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-materias"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarCarrerasMaterias();
    cargarMaterias();
}

// ------------------------------------------------------------
let tablaMaterias = null;
let carrerasCacheMat = [];

async function cargarCarrerasMaterias() {
    const result = await apiFetch('/carreras/index.php');
    if (!result?.ok) return;

    carrerasCacheMat = result.data.data.filter(c => c.activo == 1);

    const select = document.getElementById('filtro-carrera-mat');
    if (select) {
        carrerasCacheMat.forEach(c => {
            select.innerHTML += `<option value="${c.id_carrera}">${c.id_carrera} — ${c.nombre}</option>`;
        });
    }
}

async function cargarMaterias(carrera = '') {
    const url    = carrera ? `/materias/index.php?carrera=${carrera}` : '/materias/index.php';
    const result = await apiFetch(url);
    if (!result?.ok) return;

    const filas = result.data.data.map(m => `
        <tr>
            <td><strong>${m.id_materia}</strong></td>
            <td>${m.nombre}</td>
            <td>${m.carreras || '—'}</td>
            <td>${m.fecha_inicio ? formatearFechaMateria(m.fecha_inicio) : '—'}</td>
            <td>
                <span class="badge badge-${m.activo == 1 ? 'activo' : 'inactivo'}">
                    ${m.activo == 1 ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="abrirModalEditarMateria('${m.id_materia}','${m.nombre.replace(/'/g,"\\'")}','${m.fecha_inicio||''}','${m.fecha_fin||''}',${m.activo},'${m.carreras||''}')">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-danger btn-sm" style="margin-left:4px"
                    onclick="toggleMateria('${m.id_materia}','${m.nombre.replace(/'/g,"\\'")}',${m.activo})">
                    <i class="fa-solid fa-${m.activo == 1 ? 'ban' : 'circle-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;color:#a0aec0">Sin materias registradas</td></tr>';

    if (tablaMaterias) { tablaMaterias.destroy(); tablaMaterias = null; }

    document.getElementById('tbody-materias').innerHTML = filas;

    tablaMaterias = $('#tabla-materias').DataTable(dtOpciones({
        pageLength: 15,
        columnDefs: [{ orderable: false, targets: 5 }]
    }));
}

function filtrarMaterias() {
    const carrera = document.getElementById('filtro-carrera-mat')?.value || '';
    cargarMaterias(carrera);
}

function formatearFechaMateria(fecha) {
    if (!fecha) return '—';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
}

// ------------------------------------------------------------
function renderCheckboxesCarreras(seleccionadas = []) {
    const cont = document.getElementById('checkboxes-carreras');
    if (!cont) return;

    cont.innerHTML = carrerasCacheMat.map(c => `
        <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;cursor:pointer">
            <input type="checkbox" value="${c.id_carrera}"
                   ${seleccionadas.includes(c.id_carrera) ? 'checked' : ''}>
            <span><strong>${c.id_carrera}</strong> — ${c.nombre}</span>
        </label>
    `).join('');
}

function getCarrerasSeleccionadas() {
    return Array.from(
        document.querySelectorAll('#checkboxes-carreras input[type=checkbox]:checked')
    ).map(cb => cb.value);
}

// ------------------------------------------------------------
function abrirModalCrearMateria() {
    document.getElementById('modal-materia-titulo').textContent      = 'Nueva Materia';
    document.getElementById('materia-modo').value                    = 'crear';
    document.getElementById('materia-id-original').value            = '';
    document.getElementById('materia-id').value                      = '';
    document.getElementById('materia-id').disabled                   = false;
    document.getElementById('materia-nombre').value                  = '';
    document.getElementById('materia-inicio').value                  = '';
    document.getElementById('materia-fin').value                     = '';
    document.getElementById('grupo-activo-materia').style.display    = 'none';
    document.getElementById('msg-materia').className                 = 'form-msg';
    renderCheckboxesCarreras([]);
    abrirModal('modal-materia');
}

function abrirModalEditarMateria(id, nombre, inicio, fin, activo, carrerasStr) {
    const seleccionadas = carrerasStr ? carrerasStr.split(', ').map(s => s.trim()) : [];

    document.getElementById('modal-materia-titulo').textContent      = 'Editar Materia';
    document.getElementById('materia-modo').value                    = 'editar';
    document.getElementById('materia-id-original').value            = id;
    document.getElementById('materia-id').value                      = id;
    document.getElementById('materia-id').disabled                   = true;
    document.getElementById('materia-nombre').value                  = nombre;
    document.getElementById('materia-inicio').value                  = inicio;
    document.getElementById('materia-fin').value                     = fin;
    document.getElementById('materia-activo').value                  = activo;
    document.getElementById('grupo-activo-materia').style.display    = 'flex';
    document.getElementById('grupo-activo-materia').style.flexDirection = 'column';
    document.getElementById('msg-materia').className                 = 'form-msg';
    renderCheckboxesCarreras(seleccionadas);
    abrirModal('modal-materia');
}

// ------------------------------------------------------------
async function guardarMateria() {
    const modo     = document.getElementById('materia-modo').value;
    const id       = document.getElementById('materia-id').value.trim().toUpperCase();
    const idOrig   = document.getElementById('materia-id-original').value;
    const nombre   = document.getElementById('materia-nombre').value.trim();
    const inicio   = document.getElementById('materia-inicio').value || null;
    const fin      = document.getElementById('materia-fin').value    || null;
    const carreras = getCarrerasSeleccionadas();
    const btn      = document.getElementById('btn-guardar-materia');

    if (!id || !nombre) {
        mostrarMensajeModal('msg-materia', 'Clave y nombre son requeridos.', 'error');
        return;
    }

    btn.disabled = true;

    const activo = modo === 'editar' ? parseInt(document.getElementById('materia-activo').value) : undefined;
    const body   = JSON.stringify({
        id_materia: id, nombre,
        fecha_inicio: inicio, fecha_fin: fin,
        carreras,
        ...(activo !== undefined && { activo })
    });

    const result = modo === 'crear'
        ? await apiFetch('/materias/index.php', { method: 'POST', body })
        : await apiFetch(`/materias/index.php?id=${idOrig}`, { method: 'PUT', body });

    btn.disabled = false;

    if (!result?.ok) {
        mostrarMensajeModal('msg-materia', result?.data?.message || 'Error al guardar.', 'error');
        return;
    }

    cerrarModal('modal-materia');
    await cargarMaterias(document.getElementById('filtro-carrera-mat')?.value || '');
}

// ------------------------------------------------------------
async function toggleMateria(id, nombre, activo) {
    const accion = activo == 1 ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} la materia "${nombre}"?`)) return;

    const nuevoEstado = activo == 1 ? 0 : 1;
    const result = await apiFetch(`/materias/index.php?id=${id}`, {
        method: nuevoEstado === 0 ? 'DELETE' : 'PUT',
        body: JSON.stringify({ nombre, activo: nuevoEstado }),
    });

    if (!result?.ok) { alert(result?.data?.message || 'Error.'); return; }
    await cargarMaterias(document.getElementById('filtro-carrera-mat')?.value || '');
}