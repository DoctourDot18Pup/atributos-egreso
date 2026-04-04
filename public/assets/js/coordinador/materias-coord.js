// ============================================================
// assets/js/coordinador/materias-coord.js
// Vista de materias del coordinador (solo lectura)
// ============================================================

function initMateriasCoord() {
    document.getElementById('content-area').innerHTML = `

        <!-- Modal AE asignados a una materia -->
        <div class="modal-overlay" id="modal-mat-ae">
            <div class="modal" style="max-width:620px;max-height:85vh;overflow-y:auto">
                <div class="modal-header">
                    <h3 id="modal-mat-ae-titulo">AE asignados</h3>
                    <button class="modal-close" onclick="cerrarModal('modal-mat-ae')">&times;</button>
                </div>
                <div class="modal-body" id="modal-mat-ae-body">
                    <div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModal('modal-mat-ae')">Cerrar</button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2><i class="fa-solid fa-book" style="color:var(--verde-itc);margin-right:8px"></i>Materias</h2>
            </div>
            <div class="card-body">
                <table id="tabla-mat-coord" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Vigencia</th>
                            <th style="width:100px">AE asignados</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-mat-coord"></tbody>
                </table>
            </div>
        </div>
    `;

    cargarMateriasCoord();
}

// ------------------------------------------------------------
let tablaMatCoord = null;

async function cargarMateriasCoord() {
    const [resMat, resMAE] = await Promise.all([
        apiFetch(`/materias/index.php?carrera=${usuarioCoord.id_carrera}`),
        apiFetch(`/materias_ae/index.php?carrera=${usuarioCoord.id_carrera}`),
    ]);

    if (!resMat?.ok) return;

    // Construir mapa materia → lista de AE
    const maePorMateria = {};
    if (resMAE?.ok) {
        resMAE.data.data.forEach(rel => {
            if (!maePorMateria[rel.id_materia]) maePorMateria[rel.id_materia] = [];
            maePorMateria[rel.id_materia].push(rel);
        });
    }

    const NIVEL_COLOR = { I: '#3182ce', M: '#d69e2e', A: '#38a169' };
    const NIVEL_LABEL = { I: 'Introductorio', M: 'En Desarrollo', A: 'Avanzado' };

    const filas = resMat.data.data.map(m => {
        const aes    = maePorMateria[m.id_materia] || [];
        const badges = aes.map(r => {
            const col = NIVEL_COLOR[r.nivel_ae] || '#718096';
            return `<span style="display:inline-block;padding:2px 7px;border-radius:12px;
                        font-size:0.7rem;font-weight:700;background:${col}20;
                        color:${col};border:1px solid ${col}40;margin:1px">
                        AE-${r.codigo_ae} <span style="font-size:0.65rem">${r.nivel_ae}</span>
                    </span>`;
        }).join('') || '<span style="color:#a0aec0;font-size:0.78rem">Sin asignar</span>';

        const vigencia = m.fecha_inicio
            ? `${formatFecha(m.fecha_inicio)} – ${formatFecha(m.fecha_fin) || 'vigente'}`
            : '—';

        return `
        <tr>
            <td><strong>${m.id_materia}</strong></td>
            <td>${m.nombre}</td>
            <td style="font-size:0.82rem;color:#718096">${vigencia}</td>
            <td>
                <button class="btn btn-secondary btn-sm"
                    onclick="verAEMateria('${m.id_materia}')">
                    <i class="fa-solid fa-link"></i>
                    ${aes.length}
                </button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="4" style="text-align:center;color:#a0aec0">Sin materias registradas</td></tr>';

    // Cache para el modal de detalle
    window._maePorMateriaCoord   = maePorMateria;
    window._materiasCoordNombres = {};
    resMat.data.data.forEach(m => { window._materiasCoordNombres[m.id_materia] = m.nombre; });

    if (tablaMatCoord) { tablaMatCoord.destroy(); tablaMatCoord = null; }
    document.getElementById('tbody-mat-coord').innerHTML = filas;
    tablaMatCoord = $('#tabla-mat-coord').DataTable(dtOpciones({
        pageLength: 15,
        columnDefs: [{ orderable: false, targets: 3 }],
    }));
}

// ------------------------------------------------------------
function verAEMateria(idMateria) {
    const nombre = window._materiasCoordNombres?.[idMateria] || idMateria;
    document.getElementById('modal-mat-ae-titulo').textContent = `${idMateria} — ${nombre}`;

    const NIVEL_COLOR = { I: '#3182ce', M: '#d69e2e', A: '#38a169' };
    const NIVEL_LABEL = { I: 'Introductorio', M: 'En Desarrollo', A: 'Avanzado' };

    const aes = window._maePorMateriaCoord?.[idMateria] || [];

    if (aes.length === 0) {
        document.getElementById('modal-mat-ae-body').innerHTML =
            '<p style="text-align:center;color:#a0aec0">Esta materia no tiene AE asignados.</p>';
    } else {
        const filas = aes.map(r => {
            const col   = NIVEL_COLOR[r.nivel_ae] || '#718096';
            const label = NIVEL_LABEL[r.nivel_ae] || r.nivel_ae;
            return `
            <tr>
                <td style="padding:10px 12px;font-size:0.82rem;font-weight:700;color:#1a202c">AE-${r.codigo_ae}</td>
                <td style="padding:10px 12px;font-size:0.82rem;color:#4a5568">${r.ae_nombre || r.ae_nombre_corto || ''}</td>
                <td style="padding:10px 12px;text-align:center">
                    <span style="padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:700;
                                 background:${col}20;color:${col};border:1px solid ${col}40">
                        ${r.nivel_ae} — ${label}
                    </span>
                </td>
            </tr>`;
        }).join('');

        document.getElementById('modal-mat-ae-body').innerHTML = `
            <table style="width:100%;border-collapse:collapse">
                <thead>
                    <tr style="background:#f7fafc">
                        <th style="padding:8px 12px;font-size:0.72rem;color:#718096;text-align:left;width:60px">AE</th>
                        <th style="padding:8px 12px;font-size:0.72rem;color:#718096;text-align:left">Nombre</th>
                        <th style="padding:8px 12px;font-size:0.72rem;color:#718096;text-align:center;width:160px">Nivel</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>`;
    }

    abrirModal('modal-mat-ae');
}
