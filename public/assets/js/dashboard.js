// ============================================================
// assets/js/dashboard.js
// Navegación SPA y utilidades compartidas del dashboard
// ============================================================

// Proteger ruta — solo admin
const usuarioActual = requireAuth('admin');

// Poblar datos del usuario en el sidebar
if (usuarioActual) {
    document.getElementById('user-email').textContent  = usuarioActual.email;
    document.getElementById('user-rol').textContent    = usuarioActual.rol;
    document.getElementById('user-avatar').textContent = usuarioActual.email[0].toUpperCase();
}

// ------------------------------------------------------------
// Idioma español para DataTables (inline, sin CDN)
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
    oPaginate: {
        sFirst:    'Primero',
        sLast:     'Último',
        sNext:     'Siguiente',
        sPrevious: 'Anterior',
    },
};

// ------------------------------------------------------------
// Navegación entre vistas
// ------------------------------------------------------------
const vistaTitulos = {
    'carreras':    ['Carreras',             'Gestión de carreras del sistema'],
    'periodos':    ['Períodos Académicos',  'Administración de períodos'],
    'materias':    ['Materias',             'Catálogo de materias'],
    'atributos':   ['Atributos de Egreso',  'Gestión de AE por carrera'],
    'criterios':   ['Criterios',            'Criterios de evaluación por AE'],
    'materia-ae':  ['Relación Materia-AE',  'Asignación de niveles I/M/A'],
    'estudiantes': ['Estudiantes',          'Registro de alumnos'],
    'usuarios':    ['Usuarios del Sistema', 'Gestión de accesos'],
};

let vistaActual = null;

function cargarVista(vista) {
    if (vistaActual === vista) return;
    vistaActual = vista;

    const [titulo, subtitulo] = vistaTitulos[vista] || ['', ''];
    document.getElementById('topbar-title').textContent    = titulo;
    document.getElementById('topbar-subtitle').textContent = subtitulo;

    document.querySelectorAll('.nav-link').forEach(a => {
        a.classList.toggle('active', a.dataset.view === vista);
    });

    document.getElementById('content-area').innerHTML =
        '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';

    const modulos = {
        'carreras':    () => typeof initCarreras    === 'function' && initCarreras(),
        'periodos':    () => typeof initPeriodos    === 'function' && initPeriodos(),
        'materias':    () => typeof initMaterias    === 'function' && initMaterias(),
        'atributos':   () => typeof initAtributos   === 'function' && initAtributos(),
        'criterios':   () => typeof initCriterios   === 'function' && initCriterios(),
        'materia-ae':  () => typeof initMateriaAE   === 'function' && initMateriaAE(),
        'estudiantes': () => typeof initEstudiantes === 'function' && initEstudiantes(),
        'usuarios':    () => typeof initUsuarios    === 'function' && initUsuarios(),
    };

    if (modulos[vista]) {
        modulos[vista]();
    } else {
        document.getElementById('content-area').innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-wrench"></i>
                <p>Módulo <strong>${titulo}</strong> en construcción.</p>
            </div>`;
    }
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        cargarVista(link.dataset.view);
    });
});

// ------------------------------------------------------------
// Logout
// ------------------------------------------------------------
async function logout() {
    try { await apiFetch('/auth/logout.php', { method: 'POST' }); } catch (_) {}
    Auth.clear();
    window.location.href = '/atributos-egreso/public/index.html';
}

// ------------------------------------------------------------
// Helpers globales reutilizables por todos los módulos
// ------------------------------------------------------------
function abrirModal(id)  { document.getElementById(id).classList.add('open'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
    }
});

function mostrarMensajeModal(elementId, mensaje, tipo = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = mensaje;
    el.className   = `form-msg ${tipo} show`;
    setTimeout(() => { el.classList.remove('show'); }, 4000);
}

// Helper DataTables — siempre usa el idioma precargado
function dtOpciones(extra = {}) {
    return {
        language: window.dtLang || {},
        pageLength: 10,
        ...extra,
    };
}

// La vista inicial se lanza desde dashboard.html, después de cargar todos los módulos