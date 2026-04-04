// ============================================================
// assets/js/coordinador/inicio.js
// Vista de resumen / KPIs del coordinador
// ============================================================

const LIKERT_LABEL = { 1: 'No suficiente', 2: 'Suficiente', 3: 'Bueno', 4: 'Muy Bueno' };
const LIKERT_COLOR = { 1: '#c53030', 2: '#d69e2e', 3: '#2b6cb0', 4: '#276749' };

async function initInicio() {
    const carrera = usuarioCoord?.id_carrera;
    if (!carrera) {
        document.getElementById('content-area').innerHTML =
            `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>
             <p>Tu cuenta no tiene una carrera asignada. Contacta al administrador.</p></div>`;
        return;
    }

    const result = await apiFetch(`/dashboard/resumen.php?carrera=${carrera}`);
    if (!result?.ok) {
        document.getElementById('content-area').innerHTML =
            `<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i>
             <p>Error al cargar el resumen.</p></div>`;
        return;
    }

    const d = result.data;
    const periodoTexto = d.periodo_activo
        ? `${d.periodo_activo.nombre} (${formatFecha(d.periodo_activo.fecha_inicio)} – ${formatFecha(d.periodo_activo.fecha_fin)})`
        : 'Sin período activo';

    const totalLikert = Object.values(d.distribucion_likert).reduce((a, b) => a + b, 0);

    document.getElementById('content-area').innerHTML = `

        <!-- KPIs -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:28px">
            ${kpiCard('fa-users', 'Estudiantes activos', d.total_estudiantes, '#276749')}
            ${kpiCard('fa-clipboard-check', 'Evaluaciones registradas', d.total_evaluaciones, '#2b6cb0')}
            ${kpiCard('fa-calendar-check', 'Período activo', periodoTexto, '#6b46c1', true)}
        </div>

        <!-- Promedios por AE -->
        <div class="card" style="margin-bottom:24px">
            <div class="card-header">
                <h2><i class="fa-solid fa-chart-bar" style="color:var(--verde-itc);margin-right:8px"></i>
                    Promedio por Atributo de Egreso — ${carrera}
                </h2>
            </div>
            <div class="card-body">
                ${d.promedios_por_ae.length === 0
                    ? `<div class="empty-state" style="padding:24px">
                           <i class="fa-solid fa-inbox"></i>
                           <p>Aún no hay evaluaciones registradas para mostrar estadísticas.</p>
                       </div>`
                    : `<div style="display:flex;flex-direction:column;gap:14px">
                        ${d.promedios_por_ae.map(ae => barraAE(ae)).join('')}
                       </div>`
                }
            </div>
        </div>

        <!-- Distribución Likert -->
        ${totalLikert > 0 ? `
        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-chart-pie" style="color:var(--verde-itc);margin-right:8px"></i>
                    Distribución de niveles (total de respuestas: ${totalLikert})
                </h2>
            </div>
            <div class="card-body">
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
                    ${[1,2,3,4].map(n => {
                        const total = d.distribucion_likert[`N${n}`] || 0;
                        const pct   = totalLikert > 0 ? Math.round(total / totalLikert * 100) : 0;
                        return `
                        <div style="text-align:center;padding:20px 16px;border-radius:10px;
                                    background:${LIKERT_COLOR[n]}10;border:1.5px solid ${LIKERT_COLOR[n]}30">
                            <div style="font-size:1.8rem;font-weight:700;color:${LIKERT_COLOR[n]}">${pct}%</div>
                            <div style="font-size:0.75rem;font-weight:600;color:${LIKERT_COLOR[n]};margin:4px 0">N${n} — ${LIKERT_LABEL[n]}</div>
                            <div style="font-size:0.78rem;color:#718096">${total} respuestas</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>` : ''}
    `;
}

function kpiCard(icon, label, valor, color, textoGrande = false) {
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

function barraAE(ae) {
    const pct   = Math.round((ae.promedio / 4) * 100);
    const color = ae.promedio >= 3.5 ? '#276749' : ae.promedio >= 2.5 ? '#2b6cb0' : ae.promedio >= 1.5 ? '#d69e2e' : '#c53030';
    return `
    <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:0.82rem;font-weight:600;color:#1a202c">
                AE-${ae.codigo_ae} — ${ae.nombre_corto || ae.nombre}
            </span>
            <span style="font-size:0.85rem;font-weight:700;color:${color}">${ae.promedio} / 4</span>
        </div>
        <div style="height:10px;background:#e2e8f0;border-radius:20px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:20px;transition:width .4s"></div>
        </div>
        <div style="font-size:0.72rem;color:#a0aec0;margin-top:3px">${ae.total_respuestas} respuestas</div>
    </div>`;
}

function formatFecha(fecha) {
    if (!fecha) return '—';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
}
