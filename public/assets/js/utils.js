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

    if (response.status === 401) {
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