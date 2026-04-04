// ============================================================
// assets/js/admin/atributos.js
// Módulo CRUD de Atributos de Egreso
// ============================================================

function initAtributos() {
    document.getElementById('content-area').innerHTML = `

        <div class="modal-overlay" id="modal-ae">
            <div class="modal" style="max-width:580px">
                <div class="modal-header">
                    <h3 id="modal-ae-titulo">Nuevo Atributo de Egreso</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-ae')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-ae" novalidate>
                        <input type="hidden" id="ae-modo">
                        <input type="hidden" id="ae-id">

                        <div class="form-row">
                            <div class="form-group">
                                <label for="ae-carrera">Carrera *</label>
                                <select id="ae-carrera" class="form-control"></select>
                            </div>
                            <div class="form-group">
                                <label for="ae-codigo">Código AE *</label>
                                <input id="ae-codigo" class="form-control" type="text"
                                       placeholder="Ej: 01, 08" maxlength="2"
                                       style="text-transform:none">
                                <small style="color:#718096;font-size:0.75rem">Dos dígitos: 01–12</small>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="ae-nombre">Nombre completo *</label>
                            <textarea id="ae-nombre" class="form-control" rows="3"
                                      placeholder="Ej: Comunicarse de manera efectiva en foros y con audiencias multidisciplinarias."
                                      maxlength="500" style="resize:vertical"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="ae-nombre-corto">Nombre corto</label>
                            <input id="ae-nombre-corto" class="form-control" type="text"
                                   placeholder="Ej: Comunicación Efectiva" maxlength="100">
                        </div>
                        <div class="form-group" id="grupo-activo-ae" style="display:none">
                            <label for="ae-activo">Estado</label>
                            <select id="ae-activo" class="form-control">
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </div>
                        <div id="msg-ae" class="form-msg"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-ae')">Cancelar</button>
                    <button class="btn btn-primary" id="btn-guardar-ae" onclick="guardarAE()">
                        <i class="fa-solid fa-floppy-disk"></i> Guardar
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-list-check" style="color:var(--verde-itc);margin-right:8px"></i>Atributos de Egreso</h2>
                <div style="display:flex;gap:10px;align-items:center">
                    <select id="filtro-carrera-ae" class="form-control" style="width:220px" onchange="filtrarAE()">
                        <option value="">Todas las carreras</option>
                    </select>
                    <button class="btn btn-primary" onclick="abrirModalCrearAE()">
                        <i class="fa-solid fa-plus"></i> Nuevo AE
                    </button>
                </div>
            </div>
            <div class="card-body">
                <table id="tabla-ae" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Carrera</th>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Nombre corto</th>
                            <th>Estado</th>
                            <th style="width:100px">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-ae"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarCarrerasAE();
    cargarAE();
}

// ------------------------------------------------------------
let tablaAE = null;
let carrerasCacheAE = [];

async function cargarCarrerasAE() {
    const result = await apiFetch('/carreras/index.php');
    if (!result?.ok) return;

    carrerasCacheAE = result.data.data;

    const select    = document.getElementById('filtro-carrera-ae');
    const selectForm = document.getElementById('ae-carrera');

    carrerasCacheAE.filter(c => c.activo == 1).forEach(c => {
        const opt = `<option value="${c.id_carrera}">${c.id_carrera} — ${c.nombre}</option>`;
        if (select)    select.innerHTML    += opt;
        if (selectForm) selectForm.innerHTML += opt;
    });
}

async function cargarAE(carrera = '') {
    const url    = carrera ? `/atributos/index.php?carrera=${carrera}` : '/atributos/index.php';
    const result = await apiFetch(url);
    if (!result?.ok) return;

    const filas = result.data.data.map(ae => `
        <tr>
            <td><strong>${ae.id_carrera}</strong></td>
            <td><span style="font-family:monospace;font-size:0.9em">${ae.codigo_ae}</span></td>
            <td style="max-width:300px;white-space:normal">${ae.nombre}</td>
            <td>${ae.nombre_corto || '—'}</td>
            <td>
                <span class="badge badge-${ae.activo == 1 ? 'activo' : 'inactivo'}">
                    ${ae.activo == 1 ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="abrirModalEditarAE(${ae.id_ae},'${ae.id_carrera}','${ae.codigo_ae}',${JSON.stringify(ae.nombre).replace(/'/g,"\\'")},'${(ae.nombre_corto||'').replace(/'/g,"\\'")}',${ae.activo})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-danger btn-sm" style="margin-left:4px"
                    onclick="toggleAE(${ae.id_ae},'${ae.codigo_ae}',${ae.activo})">
                    <i class="fa-solid fa-${ae.activo == 1 ? 'ban' : 'circle-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;color:#a0aec0">Sin atributos registrados</td></tr>';

    if (tablaAE) { tablaAE.destroy(); tablaAE = null; }

    document.getElementById('tbody-ae').innerHTML = filas;

    tablaAE = $('#tabla-ae').DataTable(dtOpciones({
        pageLength: 15,
        columnDefs: [{ orderable: false, targets: 5 }],
    }));
}

function filtrarAE() {
    const carrera = document.getElementById('filtro-carrera-ae')?.value || '';
    cargarAE(carrera);
}

// ------------------------------------------------------------
function abrirModalCrearAE() {
    document.getElementById('modal-ae-titulo').textContent        = 'Nuevo Atributo de Egreso';
    document.getElementById('ae-modo').value                      = 'crear';
    document.getElementById('ae-id').value                        = '';
    document.getElementById('ae-carrera').disabled                = false;
    document.getElementById('ae-codigo').value                    = '';
    document.getElementById('ae-codigo').disabled                 = false;
    document.getElementById('ae-nombre').value                    = '';
    document.getElementById('ae-nombre-corto').value              = '';
    document.getElementById('grupo-activo-ae').style.display      = 'none';
    document.getElementById('msg-ae').className                   = 'form-msg';
    abrirModal('modal-ae');
}

function abrirModalEditarAE(id, carrera, codigo, nombre, nombreCorto, activo) {
    document.getElementById('modal-ae-titulo').textContent        = 'Editar Atributo de Egreso';
    document.getElementById('ae-modo').value                      = 'editar';
    document.getElementById('ae-id').value                        = id;
    document.getElementById('ae-carrera').value                   = carrera;
    document.getElementById('ae-carrera').disabled                = true;
    document.getElementById('ae-codigo').value                    = codigo;
    document.getElementById('ae-codigo').disabled                 = true;
    document.getElementById('ae-nombre').value                    = nombre;
    document.getElementById('ae-nombre-corto').value              = nombreCorto;
    document.getElementById('ae-activo').value                    = activo;
    document.getElementById('grupo-activo-ae').style.display      = 'flex';
    document.getElementById('grupo-activo-ae').style.flexDirection = 'column';
    document.getElementById('msg-ae').className                   = 'form-msg';
    abrirModal('modal-ae');
}

// ------------------------------------------------------------
async function guardarAE() {
    const modo        = document.getElementById('ae-modo').value;
    const id          = document.getElementById('ae-id').value;
    const carrera     = document.getElementById('ae-carrera').value;
    const codigo      = document.getElementById('ae-codigo').value.trim().padStart(2, '0');
    const nombre      = document.getElementById('ae-nombre').value.trim();
    const nombreCorto = document.getElementById('ae-nombre-corto').value.trim();
    const btn         = document.getElementById('btn-guardar-ae');

    if (!carrera || !codigo || !nombre) {
        mostrarMensajeModal('msg-ae', 'Carrera, código y nombre son requeridos.', 'error');
        return;
    }

    btn.disabled = true;
    let result;

    if (modo === 'crear') {
        result = await apiFetch('/atributos/index.php', {
            method: 'POST',
            body: JSON.stringify({ id_carrera: carrera, codigo_ae: codigo, nombre, nombre_corto: nombreCorto }),
        });
    } else {
        const activo = parseInt(document.getElementById('ae-activo').value);
        result = await apiFetch(`/atributos/index.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre, nombre_corto: nombreCorto, activo }),
        });
    }

    btn.disabled = false;

    if (!result?.ok) {
        mostrarMensajeModal('msg-ae', result?.data?.message || 'Error al guardar.', 'error');
        return;
    }

    cerrarModal('modal-ae');
    await cargarAE(document.getElementById('filtro-carrera-ae')?.value || '');
}

// ------------------------------------------------------------
async function toggleAE(id, codigo, activo) {
    const msg = activo == 1
        ? `¿Desactivar el AE-${codigo}?\n\nPodrás reactivarlo con el botón de estado o desde Editar.`
        : `¿Activar el AE-${codigo}?`;
    if (!confirm(msg)) return;

    const nuevoEstado = activo == 1 ? 0 : 1;
    const method      = activo == 1 ? 'DELETE' : 'PUT';

    const result = activo == 1
        ? await apiFetch(`/atributos/index.php?id=${id}`, { method: 'DELETE' })
        : await apiFetch(`/atributos/index.php?id=${id}`, {
              method: 'PUT',
              body: JSON.stringify({ activo: nuevoEstado }),
          });

    if (!result?.ok) { alert(result?.data?.message || 'Error.'); return; }
    await cargarAE(document.getElementById('filtro-carrera-ae')?.value || '');
}
