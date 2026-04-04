// ============================================================
// assets/js/admin/carreras.js
// Módulo CRUD de Carreras
// ============================================================

function initCarreras() {
    document.getElementById('content-area').innerHTML = `

        <div class="modal-overlay" id="modal-carrera">
            <div class="modal">
                <div class="modal-header">
                    <h3 id="modal-carrera-titulo">Nueva Carrera</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-carrera')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-carrera" novalidate>
                        <input type="hidden" id="carrera-modo">
                        <input type="hidden" id="carrera-id-original">

                        <div class="form-group">
                            <label for="carrera-id">Clave (ID) *</label>
                            <input id="carrera-id" class="form-control" type="text"
                                   placeholder="Ej: ISC, IQ, LA" maxlength="10"
                                   style="text-transform:uppercase">
                            <small style="color:#718096;font-size:0.75rem">
                                Solo letras, sin espacios. Ej: ISC, IBQ, IMCN
                            </small>
                        </div>
                        <div class="form-group">
                            <label for="carrera-nombre">Nombre completo *</label>
                            <input id="carrera-nombre" class="form-control" type="text"
                                   placeholder="Ej: Ingeniería en Sistemas Computacionales" maxlength="100">
                        </div>
                        <div class="form-group" id="grupo-activo-carrera" style="display:none">
                            <label for="carrera-activo">Estado</label>
                            <select id="carrera-activo" class="form-control">
                                <option value="1">Activa</option>
                                <option value="0">Inactiva</option>
                            </select>
                        </div>
                        <div id="msg-carrera" class="form-msg"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-carrera')">Cancelar</button>
                    <button class="btn btn-primary" id="btn-guardar-carrera" onclick="guardarCarrera()">
                        <i class="fa-solid fa-floppy-disk"></i> Guardar
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-building-columns" style="color:var(--verde-itc);margin-right:8px"></i>Carreras</h2>
                <button class="btn btn-primary" onclick="abrirModalCrearCarrera()">
                    <i class="fa-solid fa-plus"></i> Nueva carrera
                </button>
            </div>
            <div class="card-body">
                <table id="tabla-carreras" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Clave</th>
                            <th>Nombre</th>
                            <th>Estado</th>
                            <th style="width:120px">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-carreras"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarCarreras();
}

// ------------------------------------------------------------
let tablaCarreras = null;

async function cargarCarreras() {
    const result = await apiFetch('/carreras/index.php');
    if (!result?.ok) return;

    const filas = result.data.data.map(c => `
        <tr>
            <td><strong>${c.id_carrera}</strong></td>
            <td>${c.nombre}</td>
            <td>
                <span class="badge badge-${c.activo == 1 ? 'activo' : 'inactivo'}">
                    ${c.activo == 1 ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="abrirModalEditarCarrera('${c.id_carrera}','${c.nombre.replace(/'/g, "\\'")}',${c.activo})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-danger btn-sm" style="margin-left:4px"
                    onclick="eliminarCarrera('${c.id_carrera}','${c.nombre.replace(/'/g, "\\'")}',${c.activo})">
                    <i class="fa-solid fa-${c.activo == 1 ? 'ban' : 'circle-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (tablaCarreras) { tablaCarreras.destroy(); tablaCarreras = null; }

    document.getElementById('tbody-carreras').innerHTML = filas;

    tablaCarreras = $('#tabla-carreras').DataTable(dtOpciones({ columnDefs: [{ orderable: false, targets: 3 }] }));
}

// ------------------------------------------------------------
function abrirModalCrearCarrera() {
    document.getElementById('modal-carrera-titulo').textContent = 'Nueva Carrera';
    document.getElementById('carrera-modo').value = 'crear';
    document.getElementById('carrera-id').value = '';
    document.getElementById('carrera-id').disabled = false;
    document.getElementById('carrera-id-original').value = '';
    document.getElementById('carrera-nombre').value = '';
    document.getElementById('grupo-activo-carrera').style.display = 'none';
    document.getElementById('msg-carrera').className = 'form-msg';
    abrirModal('modal-carrera');
}

function abrirModalEditarCarrera(id, nombre, activo) {
    document.getElementById('modal-carrera-titulo').textContent = 'Editar Carrera';
    document.getElementById('carrera-modo').value = 'editar';
    document.getElementById('carrera-id').value = id;
    document.getElementById('carrera-id').disabled = true;
    document.getElementById('carrera-id-original').value = id;
    document.getElementById('carrera-nombre').value = nombre;
    document.getElementById('carrera-activo').value = activo;
    document.getElementById('grupo-activo-carrera').style.display = 'flex';
    document.getElementById('grupo-activo-carrera').style.flexDirection = 'column';
    document.getElementById('msg-carrera').className = 'form-msg';
    abrirModal('modal-carrera');
}

// ------------------------------------------------------------
async function guardarCarrera() {
    const modo = document.getElementById('carrera-modo').value;
    const id = document.getElementById('carrera-id').value.trim().toUpperCase();
    const nombre = document.getElementById('carrera-nombre').value.trim();
    const btn = document.getElementById('btn-guardar-carrera');

    if (!id || !nombre) {
        mostrarMensajeModal('msg-carrera', 'Completa todos los campos requeridos.', 'error');
        return;
    }

    btn.disabled = true;
    let result;

    if (modo === 'crear') {
        result = await apiFetch('/carreras/index.php', {
            method: 'POST',
            body: JSON.stringify({ id_carrera: id, nombre }),
        });
    } else {
        const idOriginal = document.getElementById('carrera-id-original').value;
        const activo = document.getElementById('carrera-activo').value;
        result = await apiFetch(`/carreras/index.php?id=${idOriginal}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre, activo: parseInt(activo) }),
        });
    }

    btn.disabled = false;

    if (!result?.ok) {
        mostrarMensajeModal('msg-carrera', result?.data?.message || 'Error al guardar.', 'error');
        return;
    }

    cerrarModal('modal-carrera');
    await cargarCarreras();
}

// ------------------------------------------------------------
async function eliminarCarrera(id, nombre, activo) {
    const nuevoEstado = activo == 1 ? 0 : 1;

    const msg = activo == 1
        ? `¿Desactivar la carrera "${nombre}" (${id})?\n\nPodrás reactivarla con el botón de estado o desde Editar.`
        : `¿Activar la carrera "${nombre}" (${id})?`;
    if (!confirm(msg)) return;

    const result = await apiFetch(`/carreras/index.php?id=${id}`, {
        method: activo == 1 ? 'DELETE' : 'PUT',
        body: JSON.stringify({ nombre, activo: nuevoEstado }),
    });

    if (!result?.ok) { alert(result?.data?.message || 'Error.'); return; }
    await cargarCarreras();
}