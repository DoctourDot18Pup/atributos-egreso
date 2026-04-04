// ============================================================
// assets/js/admin/criterios.js
// Módulo CRUD de Criterios de Evaluación
// ============================================================

function initCriterios() {
    document.getElementById('content-area').innerHTML = `

        <div class="modal-overlay" id="modal-criterio">
            <div class="modal" style="max-width:620px">
                <div class="modal-header">
                    <h3 id="modal-criterio-titulo">Nuevo Criterio</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-criterio')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-criterio" novalidate>
                        <input type="hidden" id="criterio-modo">
                        <input type="hidden" id="criterio-id">

                        <div class="form-row">
                            <div class="form-group">
                                <label for="criterio-carrera">Carrera *</label>
                                <select id="criterio-carrera" class="form-control" onchange="cargarAEPorCarrera()"></select>
                            </div>
                            <div class="form-group">
                                <label for="criterio-ae">Atributo de Egreso *</label>
                                <select id="criterio-ae" class="form-control">
                                    <option value="">— selecciona carrera —</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group" style="flex:0 0 120px">
                                <label for="criterio-codigo">Código *</label>
                                <input id="criterio-codigo" class="form-control" type="text"
                                       placeholder="01" maxlength="2">
                                <small style="color:#718096;font-size:0.75rem">2 dígitos</small>
                            </div>
                            <div class="form-group">
                                <label for="criterio-descripcion">Descripción *</label>
                                <input id="criterio-descripcion" class="form-control" type="text"
                                       placeholder="Ej: Organiza la información" maxlength="300">
                            </div>
                        </div>
                        <div style="background:#f7fafc;border:1.5px solid #d1d9d1;border-radius:8px;padding:14px;margin-bottom:12px">
                            <div style="font-size:0.78rem;font-weight:600;color:#4a5568;margin-bottom:10px;text-transform:uppercase;letter-spacing:.04em">
                                Etiquetas de niveles de desempeño
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="criterio-n1">N1 — No suficiente</label>
                                    <input id="criterio-n1" class="form-control" type="text"
                                           placeholder="No suficiente" maxlength="100">
                                </div>
                                <div class="form-group">
                                    <label for="criterio-n2">N2 — Suficiente</label>
                                    <input id="criterio-n2" class="form-control" type="text"
                                           placeholder="Suficiente" maxlength="100">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="criterio-n3">N3 — Bueno</label>
                                    <input id="criterio-n3" class="form-control" type="text"
                                           placeholder="Bueno" maxlength="100">
                                </div>
                                <div class="form-group">
                                    <label for="criterio-n4">N4 — Muy Bueno</label>
                                    <input id="criterio-n4" class="form-control" type="text"
                                           placeholder="Muy Bueno" maxlength="100">
                                </div>
                            </div>
                        </div>
                        <div class="form-group" id="grupo-activo-criterio" style="display:none">
                            <label for="criterio-activo">Estado</label>
                            <select id="criterio-activo" class="form-control">
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </div>
                        <div id="msg-criterio" class="form-msg"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-criterio')">Cancelar</button>
                    <button class="btn btn-primary" id="btn-guardar-criterio" onclick="guardarCriterio()">
                        <i class="fa-solid fa-floppy-disk"></i> Guardar
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-sliders" style="color:var(--verde-itc);margin-right:8px"></i>Criterios de Evaluación</h2>
                <div style="display:flex;gap:10px;align-items:center">
                    <select id="filtro-carrera-cr" class="form-control" style="width:180px" onchange="filtrarCriterios()">
                        <option value="">Todas las carreras</option>
                    </select>
                    <select id="filtro-ae-cr" class="form-control" style="width:200px" onchange="filtrarCriterios()">
                        <option value="">Todos los AE</option>
                    </select>
                    <button class="btn btn-primary" onclick="abrirModalCrearCriterio()">
                        <i class="fa-solid fa-plus"></i> Nuevo criterio
                    </button>
                </div>
            </div>
            <div class="card-body">
                <table id="tabla-criterios" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Carrera</th>
                            <th>AE</th>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Estado</th>
                            <th style="width:100px">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-criterios"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarCarrerasCriterios();
    cargarCriterios();
}

// ------------------------------------------------------------
let tablaCriterios = null;
let carrerasCacheCr = [];
let aeCacheCr = [];
let datosCriterioCache = {};   // id_criterio → objeto completo

async function cargarCarrerasCriterios() {
    const result = await apiFetch('/carreras/index.php');
    if (!result?.ok) return;

    carrerasCacheCr = result.data.data.filter(c => c.activo == 1);

    const selectFiltro = document.getElementById('filtro-carrera-cr');
    const selectForm   = document.getElementById('criterio-carrera');

    carrerasCacheCr.forEach(c => {
        const opt = `<option value="${c.id_carrera}">${c.id_carrera} — ${c.nombre}</option>`;
        if (selectFiltro) selectFiltro.innerHTML += opt;
        if (selectForm)   selectForm.innerHTML   += opt;
    });
}

async function cargarAEPorCarrera(carreraOverride = null) {
    const carrera = carreraOverride ?? document.getElementById('criterio-carrera')?.value ?? '';

    const selectAE = document.getElementById('criterio-ae');
    if (!selectAE) return;

    if (!carrera) {
        selectAE.innerHTML = '<option value="">— selecciona carrera —</option>';
        return;
    }

    const result = await apiFetch(`/atributos/index.php?carrera=${carrera}`);
    if (!result?.ok) return;

    aeCacheCr = result.data.data.filter(ae => ae.activo == 1);
    selectAE.innerHTML = '<option value="">— selecciona AE —</option>';
    aeCacheCr.forEach(ae => {
        selectAE.innerHTML += `<option value="${ae.id_ae}">${ae.codigo_ae} — ${ae.nombre_corto || ae.nombre.substring(0,40)}</option>`;
    });
}

async function filtrarCriterios() {
    const carrera = document.getElementById('filtro-carrera-cr')?.value || '';
    const ae      = document.getElementById('filtro-ae-cr')?.value     || '';

    // Actualizar opciones del filtro de AE según carrera seleccionada
    const selectFiltroAE = document.getElementById('filtro-ae-cr');
    if (carrera) {
        const result = await apiFetch(`/atributos/index.php?carrera=${carrera}`);
        if (result?.ok) {
            selectFiltroAE.innerHTML = '<option value="">Todos los AE</option>';
            result.data.data.forEach(a => {
                selectFiltroAE.innerHTML += `<option value="${a.id_ae}">${a.codigo_ae} — ${a.nombre_corto || a.nombre.substring(0,30)}</option>`;
            });
        }
    } else {
        selectFiltroAE.innerHTML = '<option value="">Todos los AE</option>';
    }

    await cargarCriterios(carrera, ae);
}

async function cargarCriterios(carrera = '', ae = '') {
    let url = '/criterios/index.php';
    const params = [];
    if (ae)      params.push(`ae=${ae}`);
    else if (carrera) params.push(`carrera=${carrera}`);
    if (params.length) url += '?' + params.join('&');

    const result = await apiFetch(url);
    if (!result?.ok) return;

    datosCriterioCache = {};
    result.data.data.forEach(cr => { datosCriterioCache[cr.id_criterio] = cr; });

    const filas = result.data.data.map(cr => `
        <tr>
            <td><strong>${cr.id_carrera}</strong></td>
            <td><span style="font-family:monospace">${cr.codigo_ae}</span> <small style="color:#718096">${cr.ae_nombre_corto || ''}</small></td>
            <td><span style="font-family:monospace">${cr.codigo_criterio}</span></td>
            <td>${cr.descripcion}</td>
            <td>
                <span class="badge badge-${cr.activo == 1 ? 'activo' : 'inactivo'}">
                    ${cr.activo == 1 ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="abrirModalEditarCriterio(${cr.id_criterio})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-danger btn-sm" style="margin-left:4px"
                    onclick="toggleCriterio(${cr.id_criterio},'${cr.codigo_criterio}',${cr.activo})">
                    <i class="fa-solid fa-${cr.activo == 1 ? 'ban' : 'circle-check'}"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;color:#a0aec0">Sin criterios registrados</td></tr>';

    if (tablaCriterios) { tablaCriterios.destroy(); tablaCriterios = null; }

    document.getElementById('tbody-criterios').innerHTML = filas;

    tablaCriterios = $('#tabla-criterios').DataTable(dtOpciones({
        pageLength: 15,
        columnDefs: [{ orderable: false, targets: 5 }],
    }));
}

// ------------------------------------------------------------
function resetCamposNiveles() {
    document.getElementById('criterio-n1').value = '';
    document.getElementById('criterio-n2').value = '';
    document.getElementById('criterio-n3').value = '';
    document.getElementById('criterio-n4').value = '';
}

function abrirModalCrearCriterio() {
    document.getElementById('modal-criterio-titulo').textContent         = 'Nuevo Criterio';
    document.getElementById('criterio-modo').value                       = 'crear';
    document.getElementById('criterio-id').value                         = '';
    document.getElementById('criterio-carrera').disabled                 = false;
    document.getElementById('criterio-ae').innerHTML                     = '<option value="">— selecciona carrera —</option>';
    document.getElementById('criterio-ae').disabled                      = false;
    document.getElementById('criterio-codigo').value                     = '';
    document.getElementById('criterio-codigo').disabled                  = false;
    document.getElementById('criterio-descripcion').value                = '';
    document.getElementById('grupo-activo-criterio').style.display       = 'none';
    document.getElementById('msg-criterio').className                    = 'form-msg';
    resetCamposNiveles();
    abrirModal('modal-criterio');
}

async function abrirModalEditarCriterio(id) {
    const cr = datosCriterioCache[id];
    if (!cr) return;

    document.getElementById('modal-criterio-titulo').textContent         = 'Editar Criterio';
    document.getElementById('criterio-modo').value                       = 'editar';
    document.getElementById('criterio-id').value                         = cr.id_criterio;
    document.getElementById('criterio-carrera').value                    = cr.id_carrera;
    document.getElementById('criterio-carrera').disabled                 = true;
    document.getElementById('criterio-codigo').value                     = cr.codigo_criterio;
    document.getElementById('criterio-codigo').disabled                  = true;
    document.getElementById('criterio-descripcion').value                = cr.descripcion;
    document.getElementById('criterio-n1').value                         = cr.desc_n1;
    document.getElementById('criterio-n2').value                         = cr.desc_n2;
    document.getElementById('criterio-n3').value                         = cr.desc_n3;
    document.getElementById('criterio-n4').value                         = cr.desc_n4;
    document.getElementById('criterio-activo').value                     = cr.activo;
    document.getElementById('grupo-activo-criterio').style.display       = 'flex';
    document.getElementById('grupo-activo-criterio').style.flexDirection = 'column';
    document.getElementById('msg-criterio').className                    = 'form-msg';

    await cargarAEPorCarrera(cr.id_carrera);
    document.getElementById('criterio-ae').value    = cr.id_ae;
    document.getElementById('criterio-ae').disabled = true;

    abrirModal('modal-criterio');
}

// ------------------------------------------------------------
async function guardarCriterio() {
    const modo   = document.getElementById('criterio-modo').value;
    const id     = document.getElementById('criterio-id').value;
    const idAE   = document.getElementById('criterio-ae').value;
    const codigo = document.getElementById('criterio-codigo').value.trim().padStart(2, '0');
    const desc   = document.getElementById('criterio-descripcion').value.trim();
    const n1     = document.getElementById('criterio-n1').value.trim() || 'No suficiente';
    const n2     = document.getElementById('criterio-n2').value.trim() || 'Suficiente';
    const n3     = document.getElementById('criterio-n3').value.trim() || 'Bueno';
    const n4     = document.getElementById('criterio-n4').value.trim() || 'Muy Bueno';
    const btn    = document.getElementById('btn-guardar-criterio');

    if (!idAE || !codigo || !desc) {
        mostrarMensajeModal('msg-criterio', 'AE, código y descripción son requeridos.', 'error');
        return;
    }

    btn.disabled = true;
    let result;

    if (modo === 'crear') {
        result = await apiFetch('/criterios/index.php', {
            method: 'POST',
            body: JSON.stringify({ id_ae: parseInt(idAE), codigo_criterio: codigo, descripcion: desc, desc_n1: n1, desc_n2: n2, desc_n3: n3, desc_n4: n4 }),
        });
    } else {
        const activo = parseInt(document.getElementById('criterio-activo').value);
        result = await apiFetch(`/criterios/index.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify({ descripcion: desc, desc_n1: n1, desc_n2: n2, desc_n3: n3, desc_n4: n4, activo }),
        });
    }

    btn.disabled = false;

    if (!result?.ok) {
        mostrarMensajeModal('msg-criterio', result?.data?.message || 'Error al guardar.', 'error');
        return;
    }

    cerrarModal('modal-criterio');
    await cargarCriterios(
        document.getElementById('filtro-carrera-cr')?.value || '',
        document.getElementById('filtro-ae-cr')?.value     || ''
    );
}

// ------------------------------------------------------------
async function toggleCriterio(id, codigo, activo) {
    const msg = activo == 1
        ? `¿Desactivar el criterio ${codigo}?\n\nPodrás reactivarlo desde Editar.`
        : `¿Activar el criterio ${codigo}?`;
    if (!confirm(msg)) return;

    const nuevoEstado = activo == 1 ? 0 : 1;

    const result = activo == 1
        ? await apiFetch(`/criterios/index.php?id=${id}`, { method: 'DELETE' })
        : await apiFetch(`/criterios/index.php?id=${id}`, {
              method: 'PUT',
              body: JSON.stringify({ activo: nuevoEstado }),
          });

    if (!result?.ok) { alert(result?.data?.message || 'Error.'); return; }
    await cargarCriterios(
        document.getElementById('filtro-carrera-cr')?.value || '',
        document.getElementById('filtro-ae-cr')?.value     || ''
    );
}
