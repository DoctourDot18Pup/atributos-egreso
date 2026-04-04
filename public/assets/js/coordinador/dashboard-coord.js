// ============================================================
// assets/js/coordinador/dashboard-coord.js
// Navegación SPA y utilidades del panel de coordinador
// ============================================================

const usuarioCoord = requireAuth('coordinador');

if (usuarioCoord) {
    document.getElementById('user-email').textContent   = usuarioCoord.email;
    document.getElementById('user-carrera').textContent = usuarioCoord.id_carrera
        ? `Carrera: ${usuarioCoord.id_carrera}` : 'Coordinador';
    document.getElementById('user-avatar').textContent  = usuarioCoord.email[0].toUpperCase();
}

// ------------------------------------------------------------
window.dtLang = {
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

function dtOpciones(extra = {}) {
    return { language: window.dtLang, pageLength: 10, ...extra };
}

// ------------------------------------------------------------
const vistaTitulos = {
    'inicio':             ['Inicio',        `Resumen de la carrera ${usuarioCoord?.id_carrera || ''}`],
    'evaluaciones':       ['Evaluaciones',  'Historial de evaluaciones registradas'],
    'materias-coord':     ['Materias',      'Materias y sus AE asignados'],
    'estudiantes-coord':  ['Estudiantes',   'Alumnos de la carrera'],
};

let vistaActualCoord = null;

function cargarVistaCoord(vista) {
    if (vistaActualCoord === vista) return;
    vistaActualCoord = vista;

    const [titulo, subtitulo] = vistaTitulos[vista] || ['', ''];
    document.getElementById('topbar-title').textContent    = titulo;
    document.getElementById('topbar-subtitle').textContent = subtitulo;

    document.querySelectorAll('.nav-link').forEach(a => {
        a.classList.toggle('active', a.dataset.view === vista);
    });

    document.getElementById('content-area').innerHTML =
        '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';

    const modulos = {
        'inicio':            () => typeof initInicio           === 'function' && initInicio(),
        'evaluaciones':      () => typeof initEvaluaciones     === 'function' && initEvaluaciones(),
        'materias-coord':    () => typeof initMateriasCoord    === 'function' && initMateriasCoord(),
        'estudiantes-coord': () => typeof initEstudiantesCoord === 'function' && initEstudiantesCoord(),
    };

    modulos[vista]?.();
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        cargarVistaCoord(link.dataset.view);
    });
});

// ------------------------------------------------------------
function abrirModal(id)  { document.getElementById(id).classList.add('open'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

function mostrarMensajeModal(elementId, mensaje, tipo = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = mensaje;
    el.className   = `form-msg ${tipo} show`;
    setTimeout(() => el.classList.remove('show'), 4000);
}

async function logout() {
    try { await apiFetch('/auth/logout.php', { method: 'POST' }); } catch (_) {}
    Auth.clear();
    window.location.href = '/atributos-egreso/public/index.html';
}
