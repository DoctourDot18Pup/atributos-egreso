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
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

async function logout() {
    try { await apiFetch('/auth/logout.php', { method: 'POST' }); } catch (_) {}
    Auth.clear();
    window.location.href = '/atributos-egreso/public/index.html';
}
