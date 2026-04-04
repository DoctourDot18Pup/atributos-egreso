// ============================================================
// assets/js/utils.js
// Utilidades compartidas para todos los módulos
// ============================================================

const API_BASE = '/atributos-egreso/api';

// ------------------------------------------------------------
// Token JWT — localStorage
// ------------------------------------------------------------
const Auth = {
    getToken() {
        return localStorage.getItem('ae_token');
    },

    setToken(token) {
        localStorage.setItem('ae_token', token);
    },

    getUsuario() {
        const raw = localStorage.getItem('ae_usuario');
        return raw ? JSON.parse(raw) : null;
    },

    setUsuario(usuario) {
        localStorage.setItem('ae_usuario', JSON.stringify(usuario));
    },

    clear() {
        localStorage.removeItem('ae_token');
        localStorage.removeItem('ae_usuario');
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    getRol() {
        const u = this.getUsuario();
        return u ? u.rol : null;
    }
};

// ------------------------------------------------------------
// HTTP helpers
// ------------------------------------------------------------
async function apiFetch(endpoint, options = {}) {
    const token = Auth.getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    // Redirigir al index solo si había sesión activa (token expirado/inválido).
    // Si no hay token, el 401 viene de credenciales incorrectas en login.php —
    // dejamos que el llamador maneje el error.
    if (response.status === 401 && Auth.getToken()) {
        Auth.clear();
        window.location.href = '/atributos-egreso/public/index.html';
        return;
    }

    return { ok: response.ok, status: response.status, data };
}

// ------------------------------------------------------------
// Redirección por rol
// ------------------------------------------------------------
function redirigirPorRol(rol) {
    const rutas = {
        admin:        '/atributos-egreso/public/admin/dashboard.html',
        coordinador:  '/atributos-egreso/public/coordinador/dashboard.html',
        alumno:       '/atributos-egreso/public/alumno/dashboard.html',
    };

    const destino = rutas[rol];
    if (destino) {
        window.location.href = destino;
    }
}

// ------------------------------------------------------------
// Protección de rutas — llamar al inicio de cada dashboard
// requireAuth('admin') o requireAuth('admin', 'coordinador')
// ------------------------------------------------------------
function requireAuth(...rolesPermitidos) {
    if (!Auth.isLoggedIn()) {
        window.location.href = '/atributos-egreso/public/index.html';
        return null;
    }

    const rol = Auth.getRol();

    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(rol)) {
        window.location.href = '/atributos-egreso/public/index.html';
        return null;
    }

    return Auth.getUsuario();
}

// ------------------------------------------------------------
// UI helpers
// ------------------------------------------------------------
function mostrarMensaje(elementId, mensaje, tipo = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = mensaje;
    el.className = `form-msg form-msg--${tipo}`;
}

function setLoading(boton, loading = true) {
    boton.disabled = loading;
    boton.dataset.originalText = boton.dataset.originalText || boton.textContent;
    boton.textContent = loading ? 'Cargando...' : boton.dataset.originalText;
}

// ------------------------------------------------------------
// Carga dinámica de scripts externos (lazy loading)
// ------------------------------------------------------------
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s    = document.createElement('script');
        s.src      = src;
        s.onload   = resolve;
        s.onerror  = reject;
        document.head.appendChild(s);
    });
}

// ------------------------------------------------------------
// Modal compartido — Cambiar contraseña
// ------------------------------------------------------------
function abrirModalCambiarPassword() {
    if (!document.getElementById('modal-cambiar-pass')) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="modal-overlay" id="modal-cambiar-pass">
                <div class="modal" style="max-width:440px">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-key" style="margin-right:8px"></i>Cambiar contraseña</h3>
                        <button class="modal-close" onclick="cerrarModalCambiarPassword()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="background:#fffbeb;border:1px solid #f6e05e;border-radius:8px;
                                    padding:10px 14px;font-size:0.78rem;color:#744210;margin-bottom:18px">
                            <i class="fa-solid fa-circle-info" style="margin-right:6px"></i>
                            Mínimo <strong>8 caracteres</strong>: mayúscula, minúscula, número
                            y un carácter especial (<code>#?!@$%^&*-_.</code>).
                        </div>

                        <div style="margin-bottom:14px">
                            <label style="font-size:0.82rem;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">
                                Contraseña actual <span style="color:#c53030">*</span>
                            </label>
                            <div style="position:relative">
                                <input type="password" id="cp-actual" class="form-control"
                                       placeholder="Tu contraseña actual">
                                <button type="button" onclick="_cpToggle('cp-actual',this)"
                                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);
                                               background:none;border:none;cursor:pointer;color:#a0aec0">
                                    <i class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div style="margin-bottom:14px">
                            <label style="font-size:0.82rem;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">
                                Nueva contraseña <span style="color:#c53030">*</span>
                            </label>
                            <div style="position:relative">
                                <input type="password" id="cp-nueva" class="form-control"
                                       placeholder="Mínimo 8 caracteres"
                                       oninput="_cpValidar()">
                                <button type="button" onclick="_cpToggle('cp-nueva',this)"
                                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);
                                               background:none;border:none;cursor:pointer;color:#a0aec0">
                                    <i class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div style="margin-bottom:6px">
                            <label style="font-size:0.82rem;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">
                                Confirmar nueva contraseña <span style="color:#c53030">*</span>
                            </label>
                            <div style="position:relative">
                                <input type="password" id="cp-confirmar" class="form-control"
                                       placeholder="Repite la nueva contraseña"
                                       oninput="_cpValidar()">
                                <button type="button" onclick="_cpToggle('cp-confirmar',this)"
                                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);
                                               background:none;border:none;cursor:pointer;color:#a0aec0">
                                    <i class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div id="msg-cp" class="form-msg" style="margin-top:10px"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="cerrarModalCambiarPassword()">Cancelar</button>
                        <button id="btn-cp-guardar" class="btn btn-primary" disabled
                                onclick="_cpGuardar()">
                            <i class="fa-solid fa-floppy-disk"></i> Guardar
                        </button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(div.firstElementChild);
    }

    // Limpiar campos
    ['cp-actual','cp-nueva','cp-confirmar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const msg = document.getElementById('msg-cp');
    if (msg) { msg.textContent = ''; msg.className = 'form-msg'; }
    const btn = document.getElementById('btn-cp-guardar');
    if (btn) btn.disabled = true;

    document.getElementById('modal-cambiar-pass').classList.add('open');
}

function cerrarModalCambiarPassword() {
    document.getElementById('modal-cambiar-pass')?.classList.remove('open');
}

const _CP_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#?!@$%^&*\-_.]).{8,}$/;

function _cpToggle(inputId, btn) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    const oculto = inp.type === 'password';
    inp.type = oculto ? 'text' : 'password';
    btn.querySelector('i').className = oculto ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
}

function _cpValidar() {
    const nueva     = document.getElementById('cp-nueva')?.value     || '';
    const confirmar = document.getElementById('cp-confirmar')?.value || '';
    const btn       = document.getElementById('btn-cp-guardar');
    const msg       = document.getElementById('msg-cp');

    if (!_CP_REGEX.test(nueva)) {
        msg.textContent = nueva.length > 0 ? 'La contraseña no cumple los requisitos de seguridad.' : '';
        msg.className   = 'form-msg error' + (nueva.length > 0 ? ' show' : '');
        btn.disabled    = true;
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

async function _cpGuardar() {
    const actual    = document.getElementById('cp-actual')?.value    || '';
    const passNuevo = document.getElementById('cp-nueva')?.value     || '';
    const btn       = document.getElementById('btn-cp-guardar');
    const msg       = document.getElementById('msg-cp');

    if (!actual) {
        msg.textContent = 'Ingresa tu contraseña actual.';
        msg.className   = 'form-msg error show';
        return;
    }

    btn.disabled  = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    const result = await apiFetch('/auth/cambiar-password.php', {
        method: 'POST',
        body: JSON.stringify({ password_actual: actual, password_nuevo: passNuevo }),
    });

    if (result?.ok) {
        msg.textContent = '¡Contraseña actualizada correctamente!';
        msg.className   = 'form-msg success show';
        setTimeout(() => cerrarModalCambiarPassword(), 1500);
    } else {
        msg.textContent = result?.data?.message || 'Error al cambiar la contraseña.';
        msg.className   = 'form-msg error show';
    }

    btn.disabled  = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
}