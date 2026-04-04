// ============================================================
// assets/js/admin/usuarios.js
// Módulo CRUD de Usuarios del Sistema
// ============================================================

function initUsuarios() {
    document.getElementById('content-area').innerHTML = `

        <div class="modal-overlay" id="modal-usuario">
            <div class="modal" style="max-width:540px">
                <div class="modal-header">
                    <h3 id="modal-usuario-titulo">Nuevo Usuario</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-usuario')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-usuario" novalidate>
                        <input type="hidden" id="usr-modo">
                        <input type="hidden" id="usr-id">

                        <div class="form-group">
                            <label for="usr-email">Email *</label>
                            <input id="usr-email" class="form-control" type="email"
                                   placeholder="usuario@itcelaya.edu.mx" maxlength="150">
                        </div>
                        <div class="form-group">
                            <label for="usr-password">
                                Contraseña <span id="lbl-password-hint" style="color:#718096;font-size:0.75rem"></span>
                            </label>
                            <input id="usr-password" class="form-control" type="password"
                                   placeholder="Mínimo 6 caracteres" maxlength="100" autocomplete="new-password">
                        </div>
                        <div class="form-group">
                            <label for="usr-rol">Rol *</label>
                            <select id="usr-rol" class="form-control" onchange="actualizarCamposRol()">
                                <option value="admin">Administrador</option>
                                <option value="coordinador">Coordinador</option>
                                <option value="alumno">Alumno</option>
                            </select>
                        </div>

                        <!-- Campo extra para coordinador: carrera asignada -->
                        <div class="form-group" id="grupo-carrera-usr" style="display:none">
                            <label for="usr-carrera">Carrera asignada *</label>
                            <select id="usr-carrera" class="form-control"></select>
                        </div>

                        <!-- Campo extra para alumno: vincular con estudiante -->
                        <div class="form-group" id="grupo-estudiante-usr" style="display:none">
                            <label for="usr-estudiante">Estudiante vinculado</label>
                            <select id="usr-estudiante" class="form-control">
                                <option value="">— sin vincular —</option>
                            </select>
                            <small style="color:#718096;font-size:0.75rem">
                                Vincula el usuario con un registro de estudiante existente.
                            </small>
                        </div>

                        <div class="form-group" id="grupo-activo-usr" style="display:none">
                            <label for="usr-activo">Estado</label>
                            <select id="usr-activo" class="form-control">
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </div>
                        <div id="msg-usuario" class="form-msg"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-usuario')">Cancelar</button>
                    <button class="btn btn-primary" id="btn-guardar-usr" onclick="guardarUsuario()">
                        <i class="fa-solid fa-floppy-disk"></i> Guardar
                    </button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-user-gear" style="color:var(--verde-itc);margin-right:8px"></i>Usuarios del Sistema</h2>
                <div style="display:flex;gap:10px;align-items:center">
                    <select id="filtro-rol-usr" class="form-control" style="width:180px" onchange="filtrarUsuarios()">
                        <option value="">Todos los roles</option>
                        <option value="admin">Administrador</option>
                        <option value="coordinador">Coordinador</option>
                        <option value="alumno">Alumno</option>
                    </select>
                    <button class="btn btn-primary" onclick="abrirModalCrearUsuario()">
                        <i class="fa-solid fa-plus"></i> Nuevo usuario
                    </button>
                </div>
            </div>
            <div class="card-body">
                <table id="tabla-usuarios" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Vinculado a</th>
                            <th>Último acceso</th>
                            <th>Estado</th>
                            <th style="width:100px">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-usuarios"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarDatosSelectoresUsr();
    cargarUsuarios();
}

// ------------------------------------------------------------
let tablaUsuarios  = null;
let datosUsrCache  = {};
let carrerasCacheUsr   = [];
let estudiantesCacheUsr = [];

const ROL_BADGE = {
    admin:        { label: 'Admin',        color: '#6b46c1' },
    coordinador:  { label: 'Coordinador',  color: '#2b6cb0' },
    alumno:       { label: 'Alumno',       color: '#276749' },
};

async function cargarDatosSelectoresUsr() {
    const [resCarreras, resEst] = await Promise.all([
        apiFetch('/carreras/index.php'),
        apiFetch('/estudiantes/index.php'),
    ]);

    if (resCarreras?.ok) {
        carrerasCacheUsr = resCarreras.data.data.filter(c => c.activo == 1);
        const selCar = document.getElementById('usr-carrera');
        if (selCar) {
            carrerasCacheUsr.forEach(c => {
                selCar.innerHTML += `<option value="${c.id_carrera}">${c.id_carrera} — ${c.nombre}</option>`;
            });
        }
    }

    if (resEst?.ok) {
        estudiantesCacheUsr = resEst.data.data.filter(e => e.activo == 1);
        const selEst = document.getElementById('usr-estudiante');
        if (selEst) {
            estudiantesCacheUsr.forEach(e => {
                const nombre = [e.apellido_paterno, e.apellido_materno, e.nombre].filter(Boolean).join(' ');
                selEst.innerHTML += `<option value="${e.id_estudiante}">${e.matricula} — ${nombre}</option>`;
            });
        }
    }
}

function actualizarCamposRol() {
    const rol = document.getElementById('usr-rol')?.value;
    document.getElementById('grupo-carrera-usr').style.display    = rol === 'coordinador' ? 'flex' : 'none';
    document.getElementById('grupo-carrera-usr').style.flexDirection = 'column';
    document.getElementById('grupo-estudiante-usr').style.display = rol === 'alumno'       ? 'flex' : 'none';
    document.getElementById('grupo-estudiante-usr').style.flexDirection = 'column';
}

async function filtrarUsuarios() {
    const rol = document.getElementById('filtro-rol-usr')?.value || '';
    await cargarUsuarios(rol);
}

async function cargarUsuarios(rol = '') {
    const url    = rol ? `/usuarios/index.php?rol=${rol}` : '/usuarios/index.php';
    const result = await apiFetch(url);
    if (!result?.ok) return;

    datosUsrCache = {};
    result.data.data.forEach(u => { datosUsrCache[u.id_usuario] = u; });

    const filas = result.data.data.map(u => {
        const badge  = ROL_BADGE[u.rol] || { label: u.rol, color: '#718096' };
        let vinculo  = '—';
        if (u.rol === 'alumno' && u.matricula) {
            const nombre = [u.apellido_paterno, u.apellido_materno, u.est_nombre].filter(Boolean).join(' ');
            vinculo = `${u.matricula} — ${nombre}`;
        } else if (u.rol === 'coordinador' && u.id_carrera) {
            vinculo = `${u.id_carrera} — ${u.carrera_nombre || ''}`;
        }

        const ultimoAcceso = u.ultimo_acceso
            ? new Date(u.ultimo_acceso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
            : '—';

        return `
        <tr>
            <td>${u.email}</td>
            <td>
                <span style="
                    display:inline-block;padding:2px 10px;border-radius:20px;
                    font-weight:600;font-size:0.78rem;
                    background:${badge.color}18;color:${badge.color};
                    border:1.5px solid ${badge.color}40">
                    ${badge.label}
                </span>
            </td>
            <td><small>${vinculo}</small></td>
            <td><small>${ultimoAcceso}</small></td>
            <td>
                <span class="badge badge-${u.activo == 1 ? 'activo' : 'inactivo'}">
                    ${u.activo == 1 ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="abrirModalEditarUsuario(${u.id_usuario})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-danger btn-sm" style="margin-left:4px"
                    onclick="toggleUsuario(${u.id_usuario},${u.activo})">
                    <i class="fa-solid fa-${u.activo == 1 ? 'ban' : 'circle-check'}"></i>
                </button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="6" style="text-align:center;color:#a0aec0">Sin usuarios registrados</td></tr>';

    if (tablaUsuarios) { tablaUsuarios.destroy(); tablaUsuarios = null; }

    document.getElementById('tbody-usuarios').innerHTML = filas;

    tablaUsuarios = $('#tabla-usuarios').DataTable(dtOpciones({
        pageLength: 15,
        columnDefs: [{ orderable: false, targets: 5 }],
    }));
}

// ------------------------------------------------------------
function abrirModalCrearUsuario() {
    document.getElementById('modal-usuario-titulo').textContent     = 'Nuevo Usuario';
    document.getElementById('usr-modo').value                       = 'crear';
    document.getElementById('usr-id').value                         = '';
    document.getElementById('usr-email').value                      = '';
    document.getElementById('usr-email').disabled                   = false;
    document.getElementById('usr-password').value                   = '';
    document.getElementById('usr-password').placeholder             = 'Mínimo 6 caracteres';
    document.getElementById('lbl-password-hint').textContent        = '* requerida';
    document.getElementById('usr-rol').value                        = 'alumno';
    document.getElementById('usr-carrera').selectedIndex            = 0;
    document.getElementById('usr-estudiante').value                 = '';
    document.getElementById('grupo-activo-usr').style.display       = 'none';
    document.getElementById('msg-usuario').className                = 'form-msg';
    actualizarCamposRol();
    abrirModal('modal-usuario');
}

function abrirModalEditarUsuario(id) {
    const u = datosUsrCache[id];
    if (!u) return;

    document.getElementById('modal-usuario-titulo').textContent     = 'Editar Usuario';
    document.getElementById('usr-modo').value                       = 'editar';
    document.getElementById('usr-id').value                         = u.id_usuario;
    document.getElementById('usr-email').value                      = u.email;
    document.getElementById('usr-email').disabled                   = false;
    document.getElementById('usr-password').value                   = '';
    document.getElementById('usr-password').placeholder             = 'Dejar vacío para no cambiar';
    document.getElementById('lbl-password-hint').textContent        = '(dejar vacío para no cambiar)';
    document.getElementById('usr-rol').value                        = u.rol;
    document.getElementById('usr-carrera').value                    = u.id_carrera || '';
    document.getElementById('usr-estudiante').value                 = u.id_estudiante || '';
    document.getElementById('usr-activo').value                     = u.activo;
    document.getElementById('grupo-activo-usr').style.display       = 'flex';
    document.getElementById('grupo-activo-usr').style.flexDirection = 'column';
    document.getElementById('msg-usuario').className                = 'form-msg';
    actualizarCamposRol();
    abrirModal('modal-usuario');
}

// ------------------------------------------------------------
async function guardarUsuario() {
    const modo    = document.getElementById('usr-modo').value;
    const id      = document.getElementById('usr-id').value;
    const email   = document.getElementById('usr-email').value.trim();
    const password = document.getElementById('usr-password').value;
    const rol     = document.getElementById('usr-rol').value;
    const btn     = document.getElementById('btn-guardar-usr');

    if (!email) {
        mostrarMensajeModal('msg-usuario', 'El email es requerido.', 'error');
        return;
    }
    if (modo === 'crear' && !password) {
        mostrarMensajeModal('msg-usuario', 'La contraseña es requerida al crear un usuario.', 'error');
        return;
    }

    const body = { email, rol };
    if (password) body.password = password;

    if (rol === 'coordinador') {
        body.id_carrera   = document.getElementById('usr-carrera').value || null;
        body.id_estudiante = null;
    } else if (rol === 'alumno') {
        body.id_estudiante = document.getElementById('usr-estudiante').value || null;
        body.id_carrera    = null;
    } else {
        body.id_carrera    = null;
        body.id_estudiante = null;
    }

    if (modo === 'editar') {
        body.activo = parseInt(document.getElementById('usr-activo').value);
    }

    btn.disabled = true;

    const result = modo === 'crear'
        ? await apiFetch('/usuarios/index.php', { method: 'POST', body: JSON.stringify(body) })
        : await apiFetch(`/usuarios/index.php?id=${id}`, { method: 'PUT', body: JSON.stringify(body) });

    btn.disabled = false;

    if (!result?.ok) {
        mostrarMensajeModal('msg-usuario', result?.data?.message || 'Error al guardar.', 'error');
        return;
    }

    cerrarModal('modal-usuario');
    await cargarUsuarios(document.getElementById('filtro-rol-usr')?.value || '');
}

// ------------------------------------------------------------
async function toggleUsuario(id, activo) {
    const u = datosUsrCache[id];
    if (!u) return;

    const msg = activo == 1
        ? `¿Desactivar al usuario "${u.email}"?\n\nNo podrá iniciar sesión hasta ser reactivado.`
        : `¿Activar al usuario "${u.email}"?`;
    if (!confirm(msg)) return;

    const nuevoEstado = activo == 1 ? 0 : 1;
    const result = activo == 1
        ? await apiFetch(`/usuarios/index.php?id=${id}`, { method: 'DELETE' })
        : await apiFetch(`/usuarios/index.php?id=${id}`, {
              method: 'PUT',
              body: JSON.stringify({ activo: nuevoEstado }),
          });

    if (!result?.ok) { alert(result?.data?.message || 'Error.'); return; }
    await cargarUsuarios(document.getElementById('filtro-rol-usr')?.value || '');
}
