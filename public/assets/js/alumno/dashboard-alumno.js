// ============================================================
// assets/js/alumno/dashboard-alumno.js
// Navegación SPA y utilidades del panel de alumno
// ============================================================

const usuarioAlumno = requireAuth('alumno');

if (usuarioAlumno) {
    const nombre = [usuarioAlumno.apellido_paterno, usuarioAlumno.nombre]
        .filter(Boolean).join(', ');
    document.getElementById('user-nombre').textContent   = nombre || usuarioAlumno.email;
    document.getElementById('user-matricula').textContent = usuarioAlumno.matricula
        ? `Matrícula: ${usuarioAlumno.matricula}` : 'Alumno';
    document.getElementById('user-avatar').textContent   =
        (usuarioAlumno.nombre || usuarioAlumno.email)[0].toUpperCase();

    // Si es primer ingreso, forzar cambio de contraseña antes de continuar
    if (usuarioAlumno.primera_vez == 1) {
        _mostrarModalPrimeraVez();
    }
}

// ------------------------------------------------------------
window.dtLangAlumno = {
    sEmptyTable:     'No hay datos disponibles en la tabla',
    sInfo:           'Mostrando _START_ a _END_ de _TOTAL_ registros',
    sInfoEmpty:      'Mostrando 0 a 0 de 0 registros',
    sInfoFiltered:   '(filtrado de _MAX_ registros totales)',
    sLengthMenu:     'Mostrar _MENU_ registros',
    sLoadingRecords: 'Cargando...',
    sProcessing:     'Procesando...',
    sSearch:         'Buscar:',
    sZeroRecords:    'No se encontraron resultados',
    oPaginate: { sFirst: 'Primero', sLast: 'Último', sNext: 'Siguiente', sPrevious: 'Anterior' },
};

function dtOpcionesAlumno(extra = {}) {
    return { language: window.dtLangAlumno, pageLength: 10, ...extra };
}

// ------------------------------------------------------------
const vistaTitulos = {
    'inicio':    ['Inicio',    'Resumen de tu avance en Atributos de Egreso'],
    'evaluar':   ['Evaluar',   'Formulario de autoevaluación por materia'],
    'historial': ['Historial', 'Tus evaluaciones registradas'],
};

let vistaActualAlumno = null;

function cargarVistaAlumno(vista) {
    if (vistaActualAlumno === vista) return;
    vistaActualAlumno = vista;

    const [titulo, subtitulo] = vistaTitulos[vista] || ['', ''];
    document.getElementById('topbar-title').textContent    = titulo;
    document.getElementById('topbar-subtitle').textContent = subtitulo;

    document.querySelectorAll('.nav-link').forEach(a => {
        a.classList.toggle('active', a.dataset.view === vista);
    });

    document.getElementById('content-area').innerHTML =
        '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';

    const modulos = {
        'inicio':    () => typeof initInicioAlumno    === 'function' && initInicioAlumno(),
        'evaluar':   () => typeof initEvaluar          === 'function' && initEvaluar(),
        'historial': () => typeof initHistorialAlumno  === 'function' && initHistorialAlumno(),
    };

    modulos[vista]?.();
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        cargarVistaAlumno(link.dataset.view);
    });
});

// ------------------------------------------------------------
function abrirModal(id)  { document.getElementById(id).classList.add('open'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('click', e => {
    // El modal de primera vez no se puede cerrar haciendo clic fuera
    if (e.target.classList.contains('modal-overlay') && e.target.id !== 'modal-primera-vez') {
        e.target.classList.remove('open');
    }
});

async function logout() {
    try { await apiFetch('/auth/logout.php', { method: 'POST' }); } catch (_) {}
    Auth.clear();
    window.location.href = '/atributos-egreso/public/index.html';
}

// ------------------------------------------------------------
// Modal de cambio de contraseña — primer ingreso
// No se puede cerrar hasta completar el cambio
// ------------------------------------------------------------
function _mostrarModalPrimeraVez() {
    // Inyectar modal en el body si no existe
    if (!document.getElementById('modal-primera-vez')) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="modal-overlay open" id="modal-primera-vez"
                 style="z-index:9999;backdrop-filter:blur(4px)">
                <div class="modal" style="max-width:460px">
                    <div class="modal-header" style="background:var(--verde-itc);color:#fff;border-radius:12px 12px 0 0">
                        <h3 style="color:#fff">
                            <i class="fa-solid fa-lock" style="margin-right:8px"></i>
                            Establece tu contraseña
                        </h3>
                    </div>
                    <div class="modal-body">
                        <p style="font-size:0.85rem;color:#4a5568;margin-bottom:16px">
                            Es tu primer ingreso al sistema. Debes establecer una contraseña
                            personalizada antes de continuar. Tu contraseña temporal fue tu número de control.
                        </p>

                        <div style="background:#fffbeb;border:1px solid #f6e05e;border-radius:8px;
                                    padding:10px 14px;font-size:0.78rem;color:#744210;margin-bottom:20px">
                            <i class="fa-solid fa-circle-info" style="margin-right:6px"></i>
                            La contraseña debe tener al menos <strong>8 caracteres</strong>, incluir
                            mayúsculas, minúsculas, un número y un carácter especial
                            (<code>#?!@$%^&*-_.</code>).
                        </div>

                        <div style="margin-bottom:14px">
                            <label style="font-size:0.82rem;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">
                                Nueva contraseña <span style="color:#c53030">*</span>
                            </label>
                            <div style="position:relative">
                                <input type="password" id="pv-nueva" class="form-control"
                                       placeholder="Mínimo 8 caracteres"
                                       oninput="_validarPvForm()">
                                <button type="button" onclick="_togglePvVer('pv-nueva', this)"
                                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);
                                               background:none;border:none;cursor:pointer;color:#a0aec0">
                                    <i class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div style="margin-bottom:6px">
                            <label style="font-size:0.82rem;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">
                                Confirmar contraseña <span style="color:#c53030">*</span>
                            </label>
                            <div style="position:relative">
                                <input type="password" id="pv-confirmar" class="form-control"
                                       placeholder="Repite la contraseña"
                                       oninput="_validarPvForm()">
                                <button type="button" onclick="_togglePvVer('pv-confirmar', this)"
                                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);
                                               background:none;border:none;cursor:pointer;color:#a0aec0">
                                    <i class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div id="msg-pv" class="form-msg" style="margin-top:10px"></div>
                    </div>
                    <div class="modal-footer">
                        <button id="btn-pv-guardar" class="btn btn-primary" disabled
                                onclick="_guardarPrimeraVez()">
                            <i class="fa-solid fa-floppy-disk"></i> Guardar contraseña
                        </button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(div.firstElementChild);
    } else {
        document.getElementById('modal-primera-vez').classList.add('open');
    }
}

const _PV_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#?!@$%^&*\-_.]).{8,}$/;

function _validarPvForm() {
    const nueva     = document.getElementById('pv-nueva')?.value    || '';
    const confirmar = document.getElementById('pv-confirmar')?.value || '';
    const btn       = document.getElementById('btn-pv-guardar');
    const msg       = document.getElementById('msg-pv');

    if (!_PV_REGEX.test(nueva)) {
        msg.textContent  = nueva.length > 0
            ? 'La contraseña no cumple los requisitos de seguridad.'
            : '';
        msg.className    = 'form-msg error' + (nueva.length > 0 ? ' show' : '');
        btn.disabled     = true;
        return;
    }

    if (nueva !== confirmar) {
        msg.textContent = confirmar.length > 0 ? 'Las contraseñas no coinciden.' : '';
        msg.className   = 'form-msg error' + (confirmar.length > 0 ? ' show' : '');
        btn.disabled    = true;
        return;
    }

    msg.className   = 'form-msg';
    msg.textContent = '';
    btn.disabled    = false;
}

function _togglePvVer(inputId, btn) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    const oculto = inp.type === 'password';
    inp.type     = oculto ? 'text' : 'password';
    btn.querySelector('i').className = oculto ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
}

async function _guardarPrimeraVez() {
    const passNuevo = document.getElementById('pv-nueva')?.value || '';
    const btn       = document.getElementById('btn-pv-guardar');
    const msg       = document.getElementById('msg-pv');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    const result = await apiFetch('/auth/cambiar-password.php', {
        method: 'POST',
        body: JSON.stringify({ password_nuevo: passNuevo }),
    });

    if (result?.ok) {
        // Actualizar primera_vez en localStorage para que no vuelva a aparecer
        const usr = Auth.getUsuario();
        if (usr) { usr.primera_vez = 0; Auth.setUsuario(usr); }

        // Cerrar modal con animación suave
        const overlay = document.getElementById('modal-primera-vez');
        if (overlay) {
            overlay.style.transition = 'opacity .3s';
            overlay.style.opacity    = '0';
            setTimeout(() => overlay.remove(), 300);
        }
    } else {
        msg.textContent = result?.data?.message || 'Error al guardar la contraseña.';
        msg.className   = 'form-msg error show';
        btn.disabled    = false;
        btn.innerHTML   = '<i class="fa-solid fa-floppy-disk"></i> Guardar contraseña';
    }
}
