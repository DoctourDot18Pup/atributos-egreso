// ============================================================
// assets/js/alumno/inicio.js
// Vista de inicio del alumno — resumen de avance
// ============================================================

const LIKERT_LABEL_ALU = { 1: 'No suficiente', 2: 'Suficiente', 3: 'Bueno', 4: 'Muy Bueno' };
const LIKERT_COLOR_ALU = { 1: '#c53030', 2: '#d69e2e', 3: '#2b6cb0', 4: '#276749' };

async function initInicioAlumno() {
    const [resPend, resHist] = await Promise.all([
        apiFetch('/evaluaciones/pendientes.php'),
        apiFetch('/evaluaciones/index.php'),
    ]);

    if (!resPend?.ok) {
        document.getElementById('content-area').innerHTML =
            `<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i>
             <p>Error al cargar el resumen.</p></div>`;
        return;
    }

    const pendientes   = resPend.data.pendientes || [];
    const evaluadas    = resPend.data.evaluadas  || [];
    const periodo      = resPend.data.periodo;
    const historial    = resHist?.ok ? (resHist.data.data || []) : [];

    const periodoTexto = periodo
        ? `${periodo.nombre} (${formatFechaAlumno(periodo.fecha_inicio)} – ${formatFechaAlumno(periodo.fecha_fin)})`
        : 'Sin período activo';

    // Calcular promedio global de todas las evaluaciones
    const promedios = historial
        .map(e => e.promedio ? parseFloat(e.promedio) : null)
        .filter(p => p !== null);
    const promGlobal = promedios.length > 0
        ? (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2)
        : null;

    const colorProm = promGlobal
        ? (promGlobal >= 3.5 ? '#276749' : promGlobal >= 2.5 ? '#2b6cb0' : promGlobal >= 1.5 ? '#d69e2e' : '#c53030')
        : '#a0aec0';

    document.getElementById('content-area').innerHTML = `

        <!-- KPIs -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:28px">
            ${kpiAlumno('fa-clipboard-check', 'Evaluaciones completadas', historial.length, '#276749')}
            ${kpiAlumno('fa-clock', 'Pendientes en período actual', pendientes.length, pendientes.length > 0 ? '#d69e2e' : '#276749')}
            ${kpiAlumno('fa-calendar-check', 'Período activo', periodoTexto, '#6b46c1', true)}
        </div>

        ${promGlobal !== null ? `
        <!-- Promedio global -->
        <div class="card" style="margin-bottom:24px">
            <div class="card-body" style="display:flex;align-items:center;gap:24px;padding:24px">
                <div style="text-align:center;min-width:90px">
                    <div style="font-size:2.6rem;font-weight:700;color:${colorProm}">${promGlobal}</div>
                    <div style="font-size:0.72rem;color:#718096;font-weight:600">/ 4.00</div>
                </div>
                <div>
                    <div style="font-size:0.85rem;font-weight:700;color:#1a202c;margin-bottom:4px">Promedio general de tus evaluaciones</div>
                    <div style="font-size:0.78rem;color:#718096">Basado en ${historial.length} evaluación${historial.length !== 1 ? 'es' : ''} registrada${historial.length !== 1 ? 's' : ''}</div>
                </div>
            </div>
        </div>` : ''}

        ${pendientes.length > 0 ? `
        <!-- Pendientes del período actual -->
        <div class="card" style="margin-bottom:24px">
            <div class="card-header">
                <h2><i class="fa-solid fa-circle-exclamation" style="color:#d69e2e;margin-right:8px"></i>
                    Evaluaciones pendientes — ${periodo?.nombre || 'período actual'}
                </h2>
            </div>
            <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:10px">
                    ${pendientes.map(m => `
                    <div style="display:flex;justify-content:space-between;align-items:center;
                                padding:14px 18px;background:#fffbeb;border:1px solid #f6e05e;
                                border-radius:8px">
                        <div>
                            <span style="font-size:0.78rem;font-weight:700;color:#d69e2e">${m.id_materia}</span>
                            <span style="font-size:0.85rem;color:#1a202c;margin-left:8px">${m.materia_nombre}</span>
                        </div>
                        <button class="btn btn-primary btn-sm"
                            onclick="cargarVistaAlumno('evaluar')">
                            <i class="fa-solid fa-pen"></i> Evaluar
                        </button>
                    </div>`).join('')}
                </div>
            </div>
        </div>` : `
        ${periodo ? `
        <div class="card" style="margin-bottom:24px">
            <div class="card-body" style="text-align:center;padding:32px;color:#718096">
                <i class="fa-solid fa-circle-check" style="font-size:2rem;color:#276749;margin-bottom:12px;display:block"></i>
                <strong style="color:#276749">¡Al día!</strong> No tienes evaluaciones pendientes en el período actual.
            </div>
        </div>` : ''}`}

        ${historial.length > 0 ? `
        <!-- Últimas evaluaciones -->
        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-clock-rotate-left" style="color:var(--verde-itc);margin-right:8px"></i>
                    Últimas evaluaciones
                </h2>
            </div>
            <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:8px">
                    ${historial.slice(0, 5).map(ev => {
                        const prom  = ev.promedio ? parseFloat(ev.promedio) : null;
                        const color = prom ? (prom >= 3.5 ? '#276749' : prom >= 2.5 ? '#2b6cb0' : prom >= 1.5 ? '#d69e2e' : '#c53030') : '#a0aec0';
                        return `
                        <div style="display:flex;justify-content:space-between;align-items:center;
                                    padding:12px 16px;background:#f7fafc;border-radius:8px">
                            <div>
                                <span style="font-size:0.78rem;font-weight:700;color:#4a5568">${ev.id_materia}</span>
                                <span style="font-size:0.82rem;color:#1a202c;margin-left:8px">${ev.materia_nombre}</span>
                                <div style="font-size:0.72rem;color:#a0aec0;margin-top:2px">${ev.periodo_nombre}</div>
                            </div>
                            ${prom !== null
                                ? `<strong style="font-size:1.1rem;color:${color}">${prom.toFixed(2)}</strong>`
                                : '<span style="color:#a0aec0">—</span>'}
                        </div>`;
                    }).join('')}
                    ${historial.length > 5 ? `
                    <button class="btn btn-secondary btn-sm" style="align-self:flex-end;margin-top:4px"
                        onclick="cargarVistaAlumno('historial')">
                        Ver todas <i class="fa-solid fa-arrow-right"></i>
                    </button>` : ''}
                </div>
            </div>
        </div>` : ''}
    `;
}

function kpiAlumno(icon, label, valor, color, textoGrande = false) {
    return `
    <div style="background:#fff;border-radius:10px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,0.07);
                border-left:4px solid ${color}">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <i class="fa-solid ${icon}" style="color:${color};font-size:1.1rem"></i>
            <span style="font-size:0.75rem;font-weight:600;color:#718096;text-transform:uppercase;letter-spacing:.04em">${label}</span>
        </div>
        <div style="font-size:${textoGrande ? '0.95rem' : '1.9rem'};font-weight:700;color:#1a202c">${valor}</div>
    </div>`;
}

function formatFechaAlumno(fecha) {
    if (!fecha) return '—';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
}
