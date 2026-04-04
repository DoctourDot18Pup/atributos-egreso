// ============================================================
// assets/js/coordinador/evaluaciones.js
// Vista de evaluaciones del coordinador
// ============================================================

function initEvaluaciones() {
    document.getElementById('content-area').innerHTML = `

        <!-- Modal detalle evaluación -->
        <div class="modal-overlay" id="modal-eval-detalle">
            <div class="modal" style="max-width:680px;max-height:85vh;overflow-y:auto">
                <div class="modal-header">
                    <h3 id="modal-eval-titulo">Detalle de evaluación</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-eval-detalle')">&times;</button>
                </div>
                <div class="modal-body" id="modal-eval-body">
                    <div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-eval-detalle')">Cerrar</button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-clipboard-list" style="color:var(--verde-itc);margin-right:8px"></i>Evaluaciones</h2>
                <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                    <select id="filtro-periodo-ev" class="form-control" style="width:190px" onchange="filtrarEvaluaciones()">
                        <option value="">Todos los períodos</option>
                    </select>
                    <select id="filtro-materia-ev" class="form-control" style="width:220px" onchange="filtrarEvaluaciones()">
                        <option value="">Todas las materias</option>
                    </select>
                    <button class="btn btn-secondary btn-sm" onclick="exportarEvaluacionesCSV()"
                            title="Exportar tabla actual a CSV">
                        <i class="fa-solid fa-file-csv"></i> Exportar CSV
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="exportarEvaluacionesPDF()"
                            title="Exportar resumen en PDF">
                        <i class="fa-solid fa-file-pdf"></i> Exportar PDF
                    </button>
                </div>
            </div>
            <div class="card-body">
                <table id="tabla-eval" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>Matrícula</th>
                            <th>Estudiante</th>
                            <th>Materia</th>
                            <th>Período</th>
                            <th>Criterios</th>
                            <th>Promedio</th>
                            <th style="width:80px">Detalle</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-eval"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarFiltrosEval(); // llama a cargarEvaluaciones internamente al terminar
}

// ------------------------------------------------------------
let tablaEval = null;
let _evalData  = [];        // caché de la última consulta (para exportar)
let _evalMeta  = { periodo: '', materia: '' }; // filtros activos

async function cargarFiltrosEval() {
    const [resPer, resMat] = await Promise.all([
        apiFetch('/periodos/index.php'),
        apiFetch(`/materias/index.php?carrera=${usuarioCoord.id_carrera}`),
    ]);

    const selPer = document.getElementById('filtro-periodo-ev');
    if (resPer?.ok) {
        resPer.data.data.forEach(p => {
            selPer.innerHTML += `<option value="${p.id_periodo}">${p.nombre}</option>`;
        });
        // Preseleccionar período activo
        const activo = resPer.data.data.find(p => p.activo == 1);
        if (activo) selPer.value = activo.id_periodo;
    }

    const selMat = document.getElementById('filtro-materia-ev');
    if (resMat?.ok) {
        resMat.data.data.forEach(m => {
            selMat.innerHTML += `<option value="${m.id_materia}">${m.id_materia} — ${m.nombre}</option>`;
        });
    }

    // Cargar tabla con los filtros ya establecidos
    await filtrarEvaluaciones();
}

async function filtrarEvaluaciones() {
    const periodo = document.getElementById('filtro-periodo-ev')?.value  || '';
    const materia = document.getElementById('filtro-materia-ev')?.value  || '';
    await cargarEvaluaciones(periodo, materia);
}

async function cargarEvaluaciones(periodo = '', materia = '') {
    let url = `/evaluaciones/index.php?carrera=${usuarioCoord.id_carrera}`;
    if (periodo) url += `&periodo=${periodo}`;
    if (materia) url += `&materia=${encodeURIComponent(materia)}`;

    const result = await apiFetch(url);
    if (!result?.ok) return;

    _evalData = result.data.data || [];
    _evalMeta = { periodo, materia };

    const PROM_COLOR = p => p >= 3.5 ? '#276749' : p >= 2.5 ? '#2b6cb0' : p >= 1.5 ? '#d69e2e' : '#c53030';

    const filas = result.data.data.map(ev => {
        const nombre = [ev.apellido_paterno, ev.apellido_materno, ev.est_nombre].filter(Boolean).join(' ');
        const prom   = ev.promedio ? parseFloat(ev.promedio) : null;
        return `
        <tr>
            <td><strong>${ev.matricula}</strong></td>
            <td>${nombre}</td>
            <td><small>${ev.id_materia}</small> ${ev.materia_nombre}</td>
            <td>${ev.periodo_nombre}</td>
            <td style="text-align:center">${ev.total_criterios}</td>
            <td style="text-align:center">
                ${prom !== null
                    ? `<strong style="color:${PROM_COLOR(prom)}">${prom.toFixed(2)}</strong>`
                    : '—'}
            </td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="verDetalleEval(${ev.id_evaluacion})">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center;color:#a0aec0">Sin evaluaciones registradas</td></tr>';

    if (tablaEval) { tablaEval.destroy(); tablaEval = null; }

    document.getElementById('tbody-eval').innerHTML = filas;

    tablaEval = $('#tabla-eval').DataTable(dtOpciones({
        pageLength: 15,
        columnDefs: [{ orderable: false, targets: 6 }],
    }));
}

// ------------------------------------------------------------
// Exportar CSV
// ------------------------------------------------------------
function exportarEvaluacionesCSV() {
    if (!_evalData.length) {
        alert('No hay evaluaciones para exportar.');
        return;
    }

    const encabezado = ['Matrícula','Nombre','ID Materia','Materia','Período','Criterios evaluados','Promedio'];

    const filas = _evalData.map(ev => {
        const nombre = [ev.apellido_paterno, ev.apellido_materno, ev.est_nombre].filter(Boolean).join(' ');
        const prom   = ev.promedio ? parseFloat(ev.promedio).toFixed(2) : '';
        return [
            ev.matricula,
            nombre,
            ev.id_materia,
            ev.materia_nombre,
            ev.periodo_nombre,
            ev.total_criterios,
            prom,
        ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
    });

    const csv  = '\uFEFF' + [encabezado.join(','), ...filas].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');

    const periodoLabel = document.getElementById('filtro-periodo-ev')?.selectedOptions[0]?.text || 'todos';
    const slug = periodoLabel.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
    a.href     = url;
    a.download = `evaluaciones-${usuarioCoord.id_carrera}-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ------------------------------------------------------------
// Exportar PDF
// ------------------------------------------------------------
async function exportarEvaluacionesPDF() {
    if (!_evalData.length) {
        alert('No hay evaluaciones para exportar.');
        return;
    }

    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

    const periodoLabel = document.getElementById('filtro-periodo-ev')?.selectedOptions[0]?.text || 'Todos los períodos';
    const materiaLabel = document.getElementById('filtro-materia-ev')?.selectedOptions[0]?.text || 'Todas las materias';
    const fecha        = new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' });

    // ── Encabezado
    doc.setFillColor(39, 103, 73);
    doc.rect(0, 0, doc.internal.pageSize.width, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Reporte de Evaluaciones — Atributos de Egreso', 14, 9);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Carrera: ${usuarioCoord.id_carrera}   |   Período: ${periodoLabel}   |   Materia: ${materiaLabel}   |   Generado: ${fecha}`, 14, 16);

    // ── Tabla principal
    const LIKERT_NIVEL = p => p >= 3.5 ? 'Muy Bueno' : p >= 2.5 ? 'Bueno' : p >= 1.5 ? 'Suficiente' : 'No suficiente';
    const NIVEL_COLOR  = p => p >= 3.5 ? [39,103,73] : p >= 2.5 ? [43,108,176] : p >= 1.5 ? [214,158,46] : [197,48,48];

    const rows = _evalData.map(ev => {
        const nombre = [ev.apellido_paterno, ev.apellido_materno, ev.est_nombre].filter(Boolean).join(' ');
        const prom   = ev.promedio ? parseFloat(ev.promedio) : null;
        return [
            ev.matricula,
            nombre,
            `${ev.id_materia}\n${ev.materia_nombre}`,
            ev.periodo_nombre,
            ev.total_criterios,
            prom !== null ? prom.toFixed(2) : '—',
            prom !== null ? LIKERT_NIVEL(prom) : '—',
        ];
    });

    doc.autoTable({
        startY: 26,
        head: [['Matrícula','Nombre','Materia','Período','Criterios','Promedio','Nivel']],
        body: rows,
        styles: { fontSize: 7.5, cellPadding: 3 },
        headStyles: { fillColor: [39,103,73], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 48 },
            2: { cellWidth: 54 },
            3: { cellWidth: 28 },
            4: { cellWidth: 18, halign: 'center' },
            5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
            6: { cellWidth: 26, halign: 'center' },
        },
        alternateRowStyles: { fillColor: [247,250,252] },
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 5) {
                const prom = parseFloat(data.cell.raw);
                if (!isNaN(prom)) {
                    const [r,g,b] = NIVEL_COLOR(prom);
                    data.cell.styles.textColor = [r,g,b];
                }
            }
            if (data.section === 'body' && data.column.index === 6) {
                const prom = parseFloat(_evalData[data.row.index]?.promedio);
                if (!isNaN(prom)) {
                    const [r,g,b] = NIVEL_COLOR(prom);
                    data.cell.styles.textColor = [r,g,b];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        },
        didDrawPage(data) {
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(7);
            doc.setTextColor(160,160,160);
            doc.text(
                `Página ${doc.internal.getCurrentPageInfo().pageNumber} de ${pageCount}`,
                doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 5,
                { align: 'center' }
            );
        },
    });

    // ── Resumen estadístico
    const totalEv = _evalData.length;
    const promedios = _evalData.map(ev => parseFloat(ev.promedio)).filter(p => !isNaN(p));
    if (promedios.length) {
        const avg  = promedios.reduce((a,b) => a+b, 0) / promedios.length;
        const dist = { 4: 0, 3: 0, 2: 0, 1: 0 };
        promedios.forEach(p => {
            if (p >= 3.5) dist[4]++; else if (p >= 2.5) dist[3]++;
            else if (p >= 1.5) dist[2]++; else dist[1]++;
        });

        const y = doc.lastAutoTable.finalY + 8;
        doc.setFontSize(9);
        doc.setFont('helvetica','bold');
        doc.setTextColor(39,103,73);
        doc.text('Resumen estadístico', 14, y);

        doc.autoTable({
            startY: y + 3,
            head: [['Total evaluaciones','Promedio general','Muy Bueno (≥3.5)','Bueno (2.5–3.49)','Suficiente (1.5–2.49)','No suficiente (<1.5)']],
            body: [[
                totalEv,
                avg.toFixed(2),
                `${dist[4]} (${((dist[4]/promedios.length)*100).toFixed(1)}%)`,
                `${dist[3]} (${((dist[3]/promedios.length)*100).toFixed(1)}%)`,
                `${dist[2]} (${((dist[2]/promedios.length)*100).toFixed(1)}%)`,
                `${dist[1]} (${((dist[1]/promedios.length)*100).toFixed(1)}%)`,
            ]],
            styles: { fontSize: 8, halign: 'center' },
            headStyles: { fillColor: [74,85,104], textColor: 255, fontStyle: 'bold' },
        });
    }

    const slug = periodoLabel.replace(/\s+/g,'-').replace(/[^a-zA-Z0-9\-]/g,'');
    doc.save(`evaluaciones-${usuarioCoord.id_carrera}-${slug}.pdf`);
}

// ------------------------------------------------------------
const LIKERT_LABEL_EV = { 1: 'No suficiente', 2: 'Suficiente', 3: 'Bueno', 4: 'Muy Bueno' };
const LIKERT_COLOR_EV = { 1: '#c53030', 2: '#d69e2e', 3: '#2b6cb0', 4: '#276749' };

async function verDetalleEval(id) {
    document.getElementById('modal-eval-titulo').textContent = 'Detalle de evaluación';
    document.getElementById('modal-eval-body').innerHTML =
        '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
    abrirModal('modal-eval-detalle');

    const result = await apiFetch(`/evaluaciones/item.php?id=${id}`);
    if (!result?.ok) {
        document.getElementById('modal-eval-body').innerHTML =
            '<p style="color:#c53030">Error al cargar el detalle.</p>';
        return;
    }

    const { cabecera, detalle } = result.data;
    const nombreEst = [cabecera.apellido_paterno, cabecera.apellido_materno, cabecera.est_nombre]
        .filter(Boolean).join(' ');

    document.getElementById('modal-eval-titulo').textContent =
        `${cabecera.matricula} — ${cabecera.id_materia}`;

    const seccionesAE = detalle.map(ae => {
        const criterioRows = ae.criterios.map(cr => {
            const color = LIKERT_COLOR_EV[cr.likert];
            const label = LIKERT_LABEL_EV[cr.likert];
            return `
            <tr>
                <td style="padding:8px 12px;font-size:0.82rem;color:#4a5568">${cr.codigo}</td>
                <td style="padding:8px 12px;font-size:0.82rem;color:#1a202c">${cr.descripcion}</td>
                <td style="padding:8px 12px;text-align:center">
                    <span style="font-weight:700;color:${color}">${cr.likert}</span>
                    <span style="font-size:0.72rem;color:${color};margin-left:4px">${label}</span>
                </td>
            </tr>`;
        }).join('');

        return `
        <div style="margin-bottom:20px">
            <div style="background:#f7fafc;border-left:4px solid var(--verde-itc);
                        padding:8px 14px;border-radius:0 6px 6px 0;margin-bottom:8px">
                <strong style="font-size:0.85rem;color:#1a202c">AE-${ae.codigo_ae} — ${ae.nombre || ''}</strong>
            </div>
            <table style="width:100%;border-collapse:collapse">
                <thead>
                    <tr style="background:#f7fafc">
                        <th style="padding:6px 12px;font-size:0.72rem;color:#718096;text-align:left;width:50px">Crit.</th>
                        <th style="padding:6px 12px;font-size:0.72rem;color:#718096;text-align:left">Descripción</th>
                        <th style="padding:6px 12px;font-size:0.72rem;color:#718096;text-align:center;width:140px">Calificación</th>
                    </tr>
                </thead>
                <tbody>${criterioRows}</tbody>
            </table>
        </div>`;
    }).join('');

    document.getElementById('modal-eval-body').innerHTML = `
        <div style="background:#f7fafc;border-radius:8px;padding:14px;margin-bottom:20px;
                    font-size:0.82rem;display:grid;grid-template-columns:1fr 1fr;gap:8px;color:#4a5568">
            <div><strong>Estudiante:</strong> ${nombreEst}</div>
            <div><strong>Matrícula:</strong> ${cabecera.matricula}</div>
            <div><strong>Materia:</strong> ${cabecera.id_materia} — ${cabecera.materia_nombre}</div>
            <div><strong>Período:</strong> ${cabecera.periodo_nombre}</div>
        </div>
        ${seccionesAE || '<p style="color:#a0aec0;text-align:center">Sin detalle registrado.</p>'}
    `;
}
