// ============================================================
// assets/js/login.js
// Lógica de autenticación compartida — los tres roles
// ============================================================

// Redirigir si ya hay sesión activa
if (Auth.isLoggedIn()) {
    redirigirPorRol(Auth.getRol());
}

// ------------------------------------------------------------
// Determinar el rol esperado según la URL actual
// ------------------------------------------------------------
function getRolDesdeURL() {
    const path = window.location.pathname;
    if (path.includes('/admin/'))       return 'admin';
    if (path.includes('/coordinador/')) return 'coordinador';
    if (path.includes('/alumno/'))      return 'alumno';
    return null;
}

// ------------------------------------------------------------
// Submit del formulario
// ------------------------------------------------------------
document.getElementById('form-login').addEventListener('submit', async function (e) {
    e.preventDefault();

    const identificador = document.getElementById('identificador').value.trim();
    const password      = document.getElementById('password').value.trim();
    const boton         = document.getElementById('btn-login');

    if (!identificador || !password) {
        mostrarMensaje('msg', 'Completa todos los campos.');
        return;
    }

    setLoading(boton, true);
    mostrarMensaje('msg', '');

    try {
        const result = await apiFetch('/auth/login.php', {
            method: 'POST',
            body: JSON.stringify({ identificador, password }),
        });

        if (!result.ok || !result.data.success) {
            mostrarMensaje('msg', result.data.message || 'Error al iniciar sesión.');
            return;
        }

        const { token, usuario } = result.data;

        // Validar que el rol coincida con el portal al que intenta entrar
        const rolEsperado = getRolDesdeURL();
        if (rolEsperado && usuario.rol !== rolEsperado) {
            mostrarMensaje('msg', `Este portal es exclusivo para ${rolEsperado}s.`);
            return;
        }

        Auth.setToken(token);
        Auth.setUsuario(usuario);
        redirigirPorRol(usuario.rol);

    } catch (err) {
        mostrarMensaje('msg', 'No se pudo conectar con el servidor.');
    } finally {
        setLoading(boton, false);
    }
});