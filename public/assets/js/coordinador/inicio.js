// ============================================================
// assets/js/coordinador/inicio.js
// Vista de resumen / KPIs del coordinador
// ============================================================

const LIKERT_LABEL = { 1: 'No suficiente', 2: 'Suficiente', 3: 'Bueno', 4: 'Muy Bueno' };
const LIKERT_COLOR = { 1: '#c53030', 2: '#d69e2e', 3: '#2b6cb0', 4: '#276749' };

let _dashData = null;   // caché para exportación

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
    _dashData = d;   // guardar para exportar

    const periodoTexto = d.periodo_activo
        ? `${d.periodo_activo.nombre} (${formatFecha(d.periodo_activo.fecha_inicio)} – ${formatFecha(d.periodo_activo.fecha_fin)})`
        : 'Sin período activo';

    const totalLikert = Object.values(d.distribucion_likert).reduce((a, b) => a + b, 0);

    document.getElementById('content-area').innerHTML = `

        <!-- Barra de acciones -->
        <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
            <button class="btn btn-secondary btn-sm" onclick="exportarResumenPDF()"
                    style="display:flex;align-items:center;gap:6px">
                <i class="fa-solid fa-file-pdf" style="color:#c53030"></i>
                Exportar PDF
            </button>
        </div>

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

// ============================================================
// Exportación PDF
// ============================================================

async function exportarResumenPDF() {
    if (!_dashData) return;

    const btn = document.querySelector('[onclick="exportarResumenPDF()"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...'; }

    try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js');
    } catch {
        alert('No se pudo cargar la librería de PDF. Verifica tu conexión a internet.');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-file-pdf" style="color:#c53030"></i> Exportar PDF'; }
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const d    = _dashData;

    const VERDE  = [39, 103, 73];
    const GRIS   = [113, 128, 150];
    const hoy    = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const scoreRGB = s =>
        s >= 3.5 ? [39, 103, 73] :
        s >= 2.5 ? [43, 108, 176] :
        s >= 1.5 ? [214, 158, 46] :
                   [197, 48, 48];

    const scoreLabel = s =>
        s >= 3.5 ? 'Muy Bueno' :
        s >= 2.5 ? 'Bueno' :
        s >= 1.5 ? 'Suficiente' :
                   'No suficiente';

    // ── ENCABEZADO ───────────────────────────────────────────────
    doc.setFillColor(...VERDE);
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('INSTITUTO TECNOLÓGICO DE CELAYA', 15, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Reporte de Atributos de Egreso', 15, 20);

    doc.setFontSize(9);
    const nombreCarrera = usuarioCoord?.nombre_carrera || d.carrera;
    doc.text(`Carrera: ${nombreCarrera} (${d.carrera})`, 15, 28);

    const periodoTexto = d.periodo_activo
        ? `${d.periodo_activo.nombre}  (${formatFecha(d.periodo_activo.fecha_inicio)} – ${formatFecha(d.periodo_activo.fecha_fin)})`
        : 'Sin período activo';
    doc.text(`Período: ${periodoTexto}`, 15, 34);
    doc.text(`Generado: ${hoy}`, 175, 34, { align: 'right' });

    let y = 48;

    // ── RESUMEN EJECUTIVO ────────────────────────────────────────
    doc.setTextColor(...VERDE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('RESUMEN EJECUTIVO', 15, y);
    y += 4;

    doc.autoTable({
        startY: y,
        head: [['Indicador', 'Valor']],
        body: [
            ['Estudiantes activos en la carrera', d.total_estudiantes],
            ['Evaluaciones registradas (todos los períodos)', d.total_evaluaciones],
            ['Período activo', d.periodo_activo?.nombre || '—'],
        ],
        theme: 'striped',
        headStyles: { fillColor: VERDE, textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 140 },
            1: { halign: 'center', cellWidth: 40 },
        },
        margin: { left: 15, right: 15 },
    });

    y = doc.lastAutoTable.finalY + 12;

    // ── PROMEDIOS POR AE ─────────────────────────────────────────
    if (d.promedios_por_ae.length > 0) {
        doc.setTextColor(...VERDE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('PROMEDIOS POR ATRIBUTO DE EGRESO', 15, y);
        y += 4;

        const aeBody = d.promedios_por_ae.map(ae => [
            `AE-${ae.codigo_ae}`,
            ae.nombre_corto || ae.nombre.substring(0, 60),
            parseFloat(ae.promedio).toFixed(2),
            scoreLabel(parseFloat(ae.promedio)),
            ae.total_respuestas,
            '',   // barra visual
        ]);

        doc.autoTable({
            startY: y,
            head: [['Cód.', 'Atributo de Egreso', 'Prom.', 'Nivel', 'Resp.', 'Gráfica']],
            body: aeBody,
            theme: 'grid',
            headStyles: { fillColor: VERDE, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
            bodyStyles: { fontSize: 7.5, minCellHeight: 8 },
            columnStyles: {
                0: { cellWidth: 14, halign: 'center' },
                1: { cellWidth: 72 },
                2: { cellWidth: 14, halign: 'center' },
                3: { cellWidth: 24, halign: 'center' },
                4: { cellWidth: 12, halign: 'center' },
                5: { cellWidth: 44 },
            },
            margin: { left: 15, right: 15 },
            didParseCell: (data) => {
                // Colorear celda de Nivel según puntaje
                if (data.column.index === 3 && data.row.section === 'body') {
                    const ae = d.promedios_por_ae[data.row.index];
                    const [r, g, b] = scoreRGB(parseFloat(ae.promedio));
                    data.cell.styles.textColor = [r, g, b];
                    data.cell.styles.fontStyle = 'bold';
                }
            },
            didDrawCell: (data) => {
                // Dibujar barra de progreso en la última columna
                if (data.column.index === 5 && data.row.section === 'body') {
                    const ae    = d.promedios_por_ae[data.row.index];
                    const score = parseFloat(ae.promedio);
                    const maxW  = data.cell.width - 6;
                    const fillW = (score / 4) * maxW;
                    const bX    = data.cell.x + 3;
                    const bH    = 3.5;
                    const bY    = data.cell.y + (data.cell.height - bH) / 2;

                    // Fondo gris
                    doc.setFillColor(226, 232, 240);
                    doc.roundedRect(bX, bY, maxW, bH, 1, 1, 'F');

                    // Relleno de color
                    const [r, g, b] = scoreRGB(score);
                    doc.setFillColor(r, g, b);
                    if (fillW > 0) doc.roundedRect(bX, bY, fillW, bH, 1, 1, 'F');

                    // Texto del valor
                    doc.setTextColor(r, g, b);
                    doc.setFontSize(6);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${score.toFixed(2)}/4`, bX + maxW + 1, bY + bH);
                }
            },
        });

        y = doc.lastAutoTable.finalY + 12;
    }

    // ── DISTRIBUCIÓN LIKERT ──────────────────────────────────────
    const totalLikert = Object.values(d.distribucion_likert).reduce((a, b) => a + b, 0);

    if (totalLikert > 0) {
        if (y > 220) { doc.addPage(); y = 20; }

        doc.setTextColor(...VERDE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('DISTRIBUCIÓN DE NIVELES DE DESEMPEÑO', 15, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...GRIS);
        doc.text(`Total de respuestas evaluadas: ${totalLikert}`, 15, y + 5);
        y += 8;

        const NIVEL_LABELS = { 1: 'No suficiente', 2: 'Suficiente', 3: 'Bueno', 4: 'Muy Bueno' };

        const likertBody = [4, 3, 2, 1].map(n => {
            const total = d.distribucion_likert[`N${n}`] || 0;
            const pct   = ((total / totalLikert) * 100).toFixed(1);
            return [`N${n}`, NIVEL_LABELS[n], total, `${pct}%`, ''];
        });

        doc.autoTable({
            startY: y,
            head: [['Nivel', 'Descripción', 'Respuestas', 'Porcentaje', 'Proporción']],
            body: likertBody,
            theme: 'striped',
            headStyles: { fillColor: VERDE, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
            bodyStyles: { fontSize: 7.5, minCellHeight: 8 },
            columnStyles: {
                0: { cellWidth: 16, halign: 'center' },
                1: { cellWidth: 62 },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 52 },
            },
            margin: { left: 15, right: 15 },
            didParseCell: (data) => {
                if (data.row.section === 'body' && data.column.index <= 3) {
                    const n = [4, 3, 2, 1][data.row.index];
                    const [r, g, b] = scoreRGB(n);
                    if (data.column.index === 0) {
                        data.cell.styles.textColor = [r, g, b];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            },
            didDrawCell: (data) => {
                if (data.column.index === 4 && data.row.section === 'body') {
                    const n     = [4, 3, 2, 1][data.row.index];
                    const total = d.distribucion_likert[`N${n}`] || 0;
                    const pct   = total / totalLikert;
                    const [r, g, b] = scoreRGB(n);
                    const maxW  = data.cell.width - 6;
                    const fillW = pct * maxW;
                    const bX    = data.cell.x + 3;
                    const bH    = 3.5;
                    const bY    = data.cell.y + (data.cell.height - bH) / 2;

                    doc.setFillColor(226, 232, 240);
                    doc.roundedRect(bX, bY, maxW, bH, 1, 1, 'F');

                    doc.setFillColor(r, g, b);
                    if (fillW > 0) doc.roundedRect(bX, bY, fillW, bH, 1, 1, 'F');
                }
            },
        });
    }

    // ── PIE DE PÁGINA ────────────────────────────────────────────
    const totalPags = doc.getNumberOfPages();
    for (let i = 1; i <= totalPags; i++) {
        doc.setPage(i);
        doc.setFillColor(240, 255, 244);
        doc.rect(0, 285, 210, 12, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...GRIS);
        doc.text('Sistema de Atributos de Egreso — Instituto Tecnológico de Celaya', 15, 292);
        doc.text(`Página ${i} de ${totalPags}`, 195, 292, { align: 'right' });
    }

    // ── GUARDAR ──────────────────────────────────────────────────
    const filename = `reporte_ae_${d.carrera}_${(d.periodo_activo?.nombre || 'general').replace(/[\s/]/g, '_')}.pdf`;
    doc.save(filename);

    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-file-pdf" style="color:#c53030"></i> Exportar PDF'; }
}
