// ============================================================
// assets/js/admin/periodos.js
// Módulo CRUD de Períodos Académicos
// ============================================================

function initPeriodos() {
    document.getElementById('content-area').innerHTML = `

        <div class="modal-overlay" id="modal-periodo">
            <div class="modal">
                <div class="modal-header">
                    <h3 id="modal-periodo-titulo">Nuevo Período</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-periodo')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-periodo" novalidate>
                        <input type="hidden" id="periodo-modo">
                        <input type="hidden" id="periodo-id">

                        <div class="form-group">
                            <label for="periodo-nombre">Nombre del período *</label>
                            <input id="periodo-nombre" class="form-control" type="text"
                                   placeholder="Ej: ENE-JUN 2026" maxlength="50">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="periodo-inicio">Fecha de inicio *</label>
                                <input id="periodo-inicio" class="form-control" type="date">
                            </div>
                            <div class="form-group">
                                <label for="periodo-fin">Fecha de fin *</label>
                                <input id="periodo-fin" class="form-control" type="date">
                            </div>
                        </div>
                        <div class="form-group" id="grupo-activo-periodo" style="display:none">
                            <label for="periodo-activo">Estado</label>
                            <select id="periodo-activo" class="form-control">
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </div>
                        <div id="msg-periodo" class="form-msg"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-periodo')">Cancelar</button>
                    <button class="btn btn-primary" id="btn-guardar-periodo" onclick="guardarPeriodo()">
                        <i class="fa-solid fa-floppy-disk"></i> Guardar
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-calendar-days" style="color:var(--verde-itc);margin-right:8px"></i>Períodos Académicos</h2>
                <button class="btn btn-primary" onclick="abrirModalCrearPeriodo()">
                    <i class="fa-solid fa-plus"></i> Nuevo período
                </button>
            </div>
            <div class="card-body">
                <table id="tabla-periodos" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Fecha inicio</th>
                            <th>Fecha fin</th>
                            <th>Estado</th>
                            <th style="width:120px">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-periodos"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarPeriodos();
}

// ------------------------------------------------------------
let tablaPeriodos = null;

async function cargarPeriodos() {
    const result = await apiFetch('/periodos/index.php');
    if (!result?.ok) return;

    const filas = result.data.data.map(p => `
        <tr>
            <td><strong>${p.nombre}</strong></td>
            <td>${formatearFechaPeriodo(p.fecha_inicio)}</td>
            <td>${formatearFechaPeriodo(p.fecha_fin)}</td>
            <td>
                <span class="badge badge-${p.activo == 1 ? 'activo' : 'inactivo'}">
                    ${p.activo == 1 ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="abrirModalEditarPeriodo(${p.id_periodo},'${p.nombre.replace(/'/g,"\\'")}','${p.fecha_inicio}','${p.fecha_fin}',${p.activo})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-danger btn-sm" style="margin-left:4px"
                    onclick="togglePeriodo(${p.id_periodo},'${p.nombre.replace(/'/g,"\\'")}','${p.fecha_inicio}','${p.fecha_fin}',${p.activo})">
                    <i class="fa-solid fa-${p.activo == 1 ? 'ban' : 'circle-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (tablaPeriodos) { tablaPeriodos.destroy(); tablaPeriodos = null; }

    document.getElementById('tbody-periodos').innerHTML = filas;

    tablaPeriodos = $('#tabla-periodos').DataTable(dtOpciones({
        columnDefs: [{ orderable: false, targets: 4 }]
    }));
}

function formatearFechaPeriodo(fecha) {
    if (!fecha) return '—';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
}

// ------------------------------------------------------------
function abrirModalCrearPeriodo() {
    document.getElementById('modal-periodo-titulo').textContent    = 'Nuevo Período';
    document.getElementById('periodo-modo').value                  = 'crear';
    document.getElementById('periodo-id').value                    = '';
    document.getElementById('periodo-nombre').value                = '';
    document.getElementById('periodo-inicio').value                = '';
    document.getElementById('periodo-fin').value                   = '';
    document.getElementById('grupo-activo-periodo').style.display  = 'none';
    document.getElementById('msg-periodo').className               = 'form-msg';
    abrirModal('modal-periodo');
}

function abrirModalEditarPeriodo(id, nombre, inicio, fin, activo) {
    document.getElementById('modal-periodo-titulo').textContent    = 'Editar Período';
    document.getElementById('periodo-modo').value                  = 'editar';
    document.getElementById('periodo-id').value                    = id;
    document.getElementById('periodo-nombre').value                = nombre;
    document.getElementById('periodo-inicio').value                = inicio;
    document.getElementById('periodo-fin').value                   = fin;
    document.getElementById('periodo-activo').value                = activo;
    document.getElementById('grupo-activo-periodo').style.display  = 'flex';
    document.getElementById('grupo-activo-periodo').style.flexDirection = 'column';
    document.getElementById('msg-periodo').className               = 'form-msg';
    abrirModal('modal-periodo');
}

// ------------------------------------------------------------
async function guardarPeriodo() {
    const modo   = document.getElementById('periodo-modo').value;
    const id     = document.getElementById('periodo-id').value;
    const nombre = document.getElementById('periodo-nombre').value.trim();
    const inicio = document.getElementById('periodo-inicio').value;
    const fin    = document.getElementById('periodo-fin').value;
    const btn    = document.getElementById('btn-guardar-periodo');

    if (!nombre || !inicio || !fin) {
        mostrarMensajeModal('msg-periodo', 'Completa todos los campos.', 'error');
        return;
    }

    btn.disabled = true;

    const activo = modo === 'editar' ? parseInt(document.getElementById('periodo-activo').value) : undefined;
    const body   = JSON.stringify({ nombre, fecha_inicio: inicio, fecha_fin: fin, ...(activo !== undefined && { activo }) });

    const result = modo === 'crear'
        ? await apiFetch('/periodos/index.php', { method: 'POST', body })
        : await apiFetch(`/periodos/index.php?id=${id}`, { method: 'PUT', body });

    btn.disabled = false;

    if (!result?.ok) {
        mostrarMensajeModal('msg-periodo', result?.data?.message || 'Error al guardar.', 'error');
        return;
    }

    cerrarModal('modal-periodo');
    await cargarPeriodos();
}

// ------------------------------------------------------------
async function togglePeriodo(id, nombre, inicio, fin, activo) {
    const accion = activo == 1 ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} el período "${nombre}"?`)) return;

    const nuevoEstado = activo == 1 ? 0 : 1;
    const result = await apiFetch(`/periodos/index.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre, fecha_inicio: inicio, fecha_fin: fin, activo: nuevoEstado }),
    });

    if (!result?.ok) { alert(result?.data?.message || 'Error.'); return; }
    await cargarPeriodos();
}