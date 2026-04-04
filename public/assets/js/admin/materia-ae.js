// ============================================================
// assets/js/admin/materia-ae.js
// Módulo de Relación Materia ↔ Atributo de Egreso (nivel I/M/A)
// ============================================================

function initMateriaAE() {
    document.getElementById('content-area').innerHTML = `

        <div class="modal-overlay" id="modal-mae">
            <div class="modal" style="max-width:520px">
                <div class="modal-header">
                    <h3 id="modal-mae-titulo">Asignar AE a Materia</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-mae')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-mae" novalidate>
                        <input type="hidden" id="mae-modo">
                        <input type="hidden" id="mae-id">

                        <div class="form-group" id="grupo-mae-materia">
                            <label for="mae-materia">Materia *</label>
                            <select id="mae-materia" class="form-control" onchange="cargarAEParaMateria()">
                                <option value="">— selecciona materia —</option>
                            </select>
                        </div>
                        <div class="form-group" id="grupo-mae-ae">
                            <label for="mae-ae">Atributo de Egreso *</label>
                            <select id="mae-ae" class="form-control">
                                <option value="">— selecciona materia primero —</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="mae-nivel">Nivel de aportación *</label>
                            <select id="mae-nivel" class="form-control">
                                <option value="">— selecciona —</option>
                                <option value="I">I — Introductorio</option>
                                <option value="M">M — Medio</option>
                                <option value="A">A — Avanzado</option>
                            </select>
                        </div>
                        <div id="msg-mae" class="form-msg"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-mae')">Cancelar</button>
                    <button class="btn btn-primary" id="btn-guardar-mae" onclick="guardarMAE()">
                        <i class="fa-solid fa-floppy-disk"></i> Guardar
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-link" style="color:var(--verde-itc);margin-right:8px"></i>Relación Materia — AE</h2>
                <div style="display:flex;gap:10px;align-items:center">
                    <select id="filtro-carrera-mae" class="form-control" style="width:180px" onchange="filtrarMAE()">
                        <option value="">Todas las carreras</option>
                    </select>
                    <select id="filtro-materia-mae" class="form-control" style="width:220px" onchange="filtrarMAE()">
                        <option value="">Todas las materias</option>
                    </select>
                    <button class="btn btn-primary" onclick="abrirModalCrearMAE()">
                        <i class="fa-solid fa-plus"></i> Asignar AE
                    </button>
                </div>
            </div>
            <div class="card-body">
                <table id="tabla-mae" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Materia</th>
                            <th>Nombre materia</th>
                            <th>Carrera</th>
                            <th>AE</th>
                            <th>Nombre AE</th>
                            <th>Nivel</th>
                            <th style="width:100px">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-mae"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarCarrerasMAE();
    cargarMAE();
}

// ------------------------------------------------------------
let tablaMAE = null;
let datosMAECache = {};        // id_materia_ae → objeto
let materiasListMAE  = [];     // para el selector del modal

const NIVEL_LABEL = { I: 'Introductorio', M: 'Medio', A: 'Avanzado' };
const NIVEL_COLOR = { I: '#3182ce', M: '#d69e2e', A: '#38a169' };

async function cargarCarrerasMAE() {
    const result = await apiFetch('/carreras/index.php');
    if (!result?.ok) return;

    const carreras = result.data.data.filter(c => c.activo == 1);
    const filtro   = document.getElementById('filtro-carrera-mae');

    carreras.forEach(c => {
        if (filtro) filtro.innerHTML += `<option value="${c.id_carrera}">${c.id_carrera} — ${c.nombre}</option>`;
    });

    // Cargar también todas las materias activas para el selector del modal
    const resMat = await apiFetch('/materias/index.php');
    if (resMat?.ok) {
        materiasListMAE = resMat.data.data.filter(m => m.activo == 1);
        poblarSelectorMaterias(materiasListMAE);
    }
}

function poblarSelectorMaterias(lista) {
    const sel = document.getElementById('mae-materia');
    if (!sel) return;
    sel.innerHTML = '<option value="">— selecciona materia —</option>';
    lista.forEach(m => {
        sel.innerHTML += `<option value="${m.id_materia}">${m.id_materia} — ${m.nombre}</option>`;
    });
}

async function filtrarMAE() {
    const carrera = document.getElementById('filtro-carrera-mae')?.value || '';
    const materia = document.getElementById('filtro-materia-mae')?.value || '';

    // Actualizar selector de materias del filtro según carrera
    const filtroMat = document.getElementById('filtro-materia-mae');
    if (carrera) {
        const res = await apiFetch(`/materias/index.php?carrera=${carrera}`);
        if (res?.ok) {
            filtroMat.innerHTML = '<option value="">Todas las materias</option>';
            res.data.data.forEach(m => {
                filtroMat.innerHTML += `<option value="${m.id_materia}">${m.id_materia} — ${m.nombre}</option>`;
            });
        }
    } else {
        filtroMat.innerHTML = '<option value="">Todas las materias</option>';
    }

    await cargarMAE(carrera, materia);
}

async function cargarMAE(carrera = '', materia = '') {
    let url = '/materias_ae/index.php';
    const params = [];
    if (materia) params.push(`materia=${encodeURIComponent(materia)}`);
    else if (carrera) params.push(`carrera=${carrera}`);
    if (params.length) url += '?' + params.join('&');

    const result = await apiFetch(url);
    if (!result?.ok) return;

    datosMAECache = {};
    result.data.data.forEach(r => { datosMAECache[r.id_materia_ae] = r; });

    const filas = result.data.data.map(r => `
        <tr>
            <td><strong>${r.id_materia}</strong></td>
            <td>${r.materia_nombre}</td>
            <td><strong>${r.id_carrera}</strong></td>
            <td><span style="font-family:monospace">${r.codigo_ae}</span></td>
            <td>${r.ae_nombre_corto || r.ae_nombre}</td>
            <td>
                <span style="
                    display:inline-block;padding:2px 10px;border-radius:20px;
                    font-weight:700;font-size:0.8rem;letter-spacing:.05em;
                    background:${NIVEL_COLOR[r.nivel_ae]}20;
                    color:${NIVEL_COLOR[r.nivel_ae]};
                    border:1.5px solid ${NIVEL_COLOR[r.nivel_ae]}50">
                    ${r.nivel_ae} — ${NIVEL_LABEL[r.nivel_ae]}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="abrirModalEditarMAE(${r.id_materia_ae})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-danger btn-sm" style="margin-left:4px"
                    onclick="eliminarMAE(${r.id_materia_ae})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center;color:#a0aec0">Sin relaciones registradas</td></tr>';

    if (tablaMAE) { tablaMAE.destroy(); tablaMAE = null; }

    document.getElementById('tbody-mae').innerHTML = filas;

    tablaMAE = $('#tabla-mae').DataTable(dtOpciones({
        pageLength: 15,
        columnDefs: [{ orderable: false, targets: 6 }],
    }));
}

// ------------------------------------------------------------
async function cargarAEParaMateria() {
    const idMateria = document.getElementById('mae-materia')?.value || '';
    const selectAE  = document.getElementById('mae-ae');

    if (!idMateria) {
        selectAE.innerHTML = '<option value="">— selecciona materia primero —</option>';
        return;
    }

    // Obtener las carreras de esa materia (vienen del campo "carreras" de la materia)
    const resMat = await apiFetch(`/materias/index.php?id=${encodeURIComponent(idMateria)}`);
    // Si el endpoint de item no existe, usamos el listado completo ya cacheado
    const materia = materiasListMAE.find(m => m.id_materia === idMateria);
    if (!materia) { selectAE.innerHTML = '<option value="">Sin carreras asociadas</option>'; return; }

    const carrerasIds = materia.carreras
        ? materia.carreras.split(', ').map(s => s.trim())
        : [];

    if (carrerasIds.length === 0) {
        selectAE.innerHTML = '<option value="">La materia no tiene carreras asignadas</option>';
        return;
    }

    // Cargar AE de todas las carreras de la materia
    const aePromises = carrerasIds.map(c => apiFetch(`/atributos/index.php?carrera=${c}`));
    const resultados = await Promise.all(aePromises);

    selectAE.innerHTML = '<option value="">— selecciona AE —</option>';
    resultados.forEach(res => {
        if (!res?.ok) return;
        res.data.data.filter(ae => ae.activo == 1).forEach(ae => {
            selectAE.innerHTML += `<option value="${ae.id_ae}">[${ae.id_carrera}] ${ae.codigo_ae} — ${ae.nombre_corto || ae.nombre.substring(0, 40)}</option>`;
        });
    });
}

// ------------------------------------------------------------
function abrirModalCrearMAE() {
    document.getElementById('modal-mae-titulo').textContent     = 'Asignar AE a Materia';
    document.getElementById('mae-modo').value                   = 'crear';
    document.getElementById('mae-id').value                     = '';
    document.getElementById('grupo-mae-materia').style.display  = 'flex';
    document.getElementById('grupo-mae-materia').style.flexDirection = 'column';
    document.getElementById('grupo-mae-ae').style.display       = 'flex';
    document.getElementById('grupo-mae-ae').style.flexDirection = 'column';
    document.getElementById('mae-materia').disabled             = false;
    document.getElementById('mae-ae').disabled                  = false;
    document.getElementById('mae-materia').value                = '';
    document.getElementById('mae-ae').innerHTML                 = '<option value="">— selecciona materia primero —</option>';
    document.getElementById('mae-nivel').value                  = '';
    document.getElementById('msg-mae').className                = 'form-msg';
    abrirModal('modal-mae');
}

function abrirModalEditarMAE(id) {
    const r = datosMAECache[id];
    if (!r) return;

    document.getElementById('modal-mae-titulo').textContent     = 'Editar nivel de aportación';
    document.getElementById('mae-modo').value                   = 'editar';
    document.getElementById('mae-id').value                     = r.id_materia_ae;
    document.getElementById('mae-nivel').value                  = r.nivel_ae;
    document.getElementById('msg-mae').className                = 'form-msg';

    // En edición solo se cambia el nivel — ocultar los selectores de materia/AE
    document.getElementById('grupo-mae-materia').style.display  = 'none';
    document.getElementById('grupo-mae-ae').style.display       = 'none';

    // Mostrar info como referencia en el título
    document.getElementById('modal-mae-titulo').textContent =
        `Editar nivel: ${r.id_materia} ↔ AE-${r.codigo_ae}`;

    abrirModal('modal-mae');
}

// ------------------------------------------------------------
async function guardarMAE() {
    const modo  = document.getElementById('mae-modo').value;
    const id    = document.getElementById('mae-id').value;
    const nivel = document.getElementById('mae-nivel').value;
    const btn   = document.getElementById('btn-guardar-mae');

    if (!nivel) {
        mostrarMensajeModal('msg-mae', 'Selecciona un nivel de aportación.', 'error');
        return;
    }

    btn.disabled = true;
    let result;

    if (modo === 'crear') {
        const materia = document.getElementById('mae-materia').value;
        const ae      = document.getElementById('mae-ae').value;

        if (!materia || !ae) {
            mostrarMensajeModal('msg-mae', 'Selecciona materia y AE.', 'error');
            btn.disabled = false;
            return;
        }

        result = await apiFetch('/materias_ae/index.php', {
            method: 'POST',
            body: JSON.stringify({ id_materia: materia, id_ae: parseInt(ae), nivel_ae: nivel }),
        });
    } else {
        result = await apiFetch(`/materias_ae/index.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nivel_ae: nivel }),
        });
    }

    btn.disabled = false;

    if (!result?.ok) {
        mostrarMensajeModal('msg-mae', result?.data?.message || 'Error al guardar.', 'error');
        return;
    }

    cerrarModal('modal-mae');
    await cargarMAE(
        document.getElementById('filtro-carrera-mae')?.value  || '',
        document.getElementById('filtro-materia-mae')?.value  || ''
    );
}

// ------------------------------------------------------------
async function eliminarMAE(id) {
    const r = datosMAECache[id];
    if (!r) return;

    if (!confirm(`¿Eliminar la relación entre "${r.id_materia}" y AE-${r.codigo_ae}?\n\nEsta acción no se puede deshacer.`)) return;

    const result = await apiFetch(`/materias_ae/index.php?id=${id}`, { method: 'DELETE' });

    if (!result?.ok) { alert(result?.data?.message || 'Error.'); return; }
    await cargarMAE(
        document.getElementById('filtro-carrera-mae')?.value || '',
        document.getElementById('filtro-materia-mae')?.value || ''
    );
}
