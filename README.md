# Atributos de Egreso — ITC Celaya

Plataforma web para la evaluación de atributos de egreso (competencias) del TecNM Instituto Tecnológico de Celaya. Permite a los alumnos autoevaluar sus materias mediante una escala Likert y a los coordinadores consultar los resultados consolidados por carrera, período y atributo de egreso.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript vanilla (SPA pattern) |
| Backend | PHP 8+ (PDO, bcrypt) |
| Base de datos | MySQL 8+ (XAMPP) |
| Autenticación | JWT (`firebase/php-jwt`) |
| Exportación | jsPDF 2.5.1 + jspdf-autotable 3.5.28 (carga lazy) |
| Tablas interactivas | DataTables (jQuery) |

---

## Estructura del proyecto

```
atributos-egreso/
├── api/                         # Endpoints REST en PHP
│   ├── auth/                    # Login, logout, cambio de contraseña
│   ├── atributos/               # CRUD atributos de egreso
│   ├── carreras/                # CRUD carreras
│   ├── criterios/               # CRUD criterios por AE
│   ├── dashboard/               # Resumen, por carrera, por atributo
│   ├── estudiantes/             # CRUD + importación CSV
│   ├── evaluaciones/            # Crear, consultar, pendientes por alumno
│   ├── inscripciones/           # Asignación alumno-materia-período
│   ├── materias/                # CRUD materias
│   ├── materias_ae/             # Asociación materia ↔ AE
│   ├── periodos/                # CRUD períodos semestrales
│   ├── reportes/                # Reporte por estudiante y por materia
│   ├── usuarios/                # Gestión de cuentas
│   └── config/                  # DB, JWT, CORS
├── database/
│   ├── schema.sql               # Estructura completa de la base de datos
│   └── seed.sql                 # Datos iniciales (carrera, admin, período de prueba)
├── public/
│   ├── index.html               # Landing / selector de rol
│   ├── admin/                   # Panel administrador
│   ├── coordinador/             # Panel coordinador
│   ├── alumno/                  # Portal alumno
│   └── assets/
│       ├── css/                 # Estilos globales y por módulo
│       └── js/
│           ├── utils.js         # apiFetch, Auth, loadScript, modal contraseña
│           ├── admin/           # Módulos JS del panel admin
│           ├── coordinador/     # Módulos JS del panel coordinador
│           └── alumno/          # Módulos JS del portal alumno
├── vendor/                      # Dependencias Composer
└── composer.json
```

---

## Modelo de datos

```
carreras ──< atributos_egreso ──< criterios
    │
    └──< materias_carreras >── materias ──< materias_ae >── atributos_egreso
    │
    └──< estudiantes ──< inscripciones >── materias
            │                 └── periodos
            └──< usuarios (rol=alumno)
                     │
                     └──< evaluaciones ──< evaluaciones_detalle >── criterios
                                └── periodos

usuarios (rol=coordinador) ── id_carrera → carreras
usuarios (rol=admin)       ── sin relación directa con carrera
```

Tablas principales:

| Tabla | Descripción |
|-------|-------------|
| `carreras` | Carreras activas (ej. IDS, IEC, IME) |
| `periodos` | Semestres (ej. ENE-JUN 2026); uno puede estar activo |
| `materias` | Catálogo de materias |
| `atributos_egreso` | Competencias del perfil de egreso por carrera |
| `criterios` | Ítems evaluables dentro de cada AE (escala 1–4) |
| `materias_ae` | Nivel de aportación de cada AE en una materia (I/M/A) |
| `estudiantes` | Padrón de alumnos |
| `usuarios` | Cuentas de acceso (admin / coordinador / alumno) |
| `inscripciones` | Alumno inscrito a materia en período |
| `evaluaciones` | Cabecera de evaluación (única por alumno-materia-período) |
| `evaluaciones_detalle` | Valor Likert por criterio |
| `auditoria` | Log de cambios (INSERT / UPDATE / DELETE) |

---

## Roles y accesos

### Administrador
Accede en `/admin/login.html`

Panel de control con CRUD completo para:
- Carreras
- Períodos semestrales
- Materias
- Atributos de egreso (AE) y sus criterios
- Asociación materia ↔ AE (nivel de aportación)
- Estudiantes
- Usuarios (coordinadores, admins)

### Coordinador
Accede en `/coordinador/login.html`

- **Inicio** — KPIs del período activo (alumnos, evaluaciones, promedio general, tasa de participación) + tabla de promedios por AE con barras de color + distribución Likert. Exportable a PDF.
- **Evaluaciones** — Tabla de todas las evaluaciones filtrada por período (activo por defecto) y materia. Exportable a CSV y a PDF con resumen estadístico.
- **Estudiantes** — Lista de alumnos de su carrera con alta individual o importación masiva desde CSV.
- **Inscripciones** — Asignación de materias por alumno y período. Las materias asignadas se muestran como chips con ID + nombre.
- **Materias** — Vista de materias vinculadas a su carrera.

### Alumno
Accede en `/alumno/login.html`

- **Inicio** — Resumen de evaluaciones completadas y pendientes.
- **Evaluar** — Lista de materias inscritas en el período activo. Al seleccionar una, se muestran los criterios Likert correspondientes para ser respondidos. Una materia evaluada no puede volver a evaluarse en el mismo período.
- **Historial** — Evaluaciones anteriores con sus calificaciones.

---

## Flujo de uso completo

### 1. Configuración inicial (Admin)

1. El administrador inicia sesión.
2. Crea un **período** nuevo (ej. "ENE-JUN 2026") y lo marca como activo.
3. Verifica o da de alta **materias** del semestre.
4. Verifica o crea los **atributos de egreso** de la carrera.
5. Agrega los **criterios** de evaluación por AE.
6. Asocia materias con AE indicando el nivel de aportación (I = Introductorio, M = Medio, A = Avanzado).
7. Registra **coordinadores** si es necesario.

### 2. Alta de alumnos (Coordinador)

**Opción A — Importación masiva por CSV**

1. Coordinador va a **Estudiantes → Importar CSV**.
2. Descarga la plantilla con el formato:
   ```
   matricula,nombre,apellido_paterno,apellido_materno,semestre
   22031101,Juan,García,López,5
   ```
3. Sube el archivo con la lista del grupo.
4. El sistema:
   - Inserta los registros en `estudiantes`.
   - Crea la cuenta en `usuarios`: email = `{matricula}@itcelaya.edu.mx`, contraseña temporal = matrícula, `primera_vez = 1`.
   - Reporta: insertados / duplicados / errores.

**Opción B — Alta individual**

El coordinador registra al alumno desde el formulario en el módulo Estudiantes.

### 3. Inscripción a materias (Coordinador)

1. Coordinador va a **Inscripciones**.
2. Selecciona el período activo.
3. Para cada alumno asigna las materias del semestre (los chips muestran ID + nombre de materia).

### 4. Primer acceso del alumno

1. El alumno entra con `{matricula}@itcelaya.edu.mx` / `{matricula}`.
2. El sistema detecta `primera_vez = 1`.
3. Aparece un **modal bloqueante** que obliga al cambio de contraseña (no puede cerrarse ni omitirse).
4. El alumno establece una nueva contraseña que cumpla:
   - Mínimo 8 caracteres
   - Al menos una letra mayúscula
   - Al menos una letra minúscula
   - Al menos un dígito
   - Al menos un carácter especial (`#?!@$%^&*-_.`)
5. El sistema actualiza la contraseña y marca `primera_vez = 0`.
6. El alumno accede normalmente a su dashboard.

### 5. Evaluación (Alumno)

1. El alumno va a **Evaluar**.
2. Ve sus materias inscritas en el período activo con su estado (pendiente / completada).
3. Selecciona una materia → aparecen los criterios Likert de los AE asociados.
4. Responde todos los criterios (1 No suficiente / 2 Suficiente / 3 Bueno / 4 Muy Bueno).
5. Envía la evaluación. La materia queda marcada como completada y no puede reevaluarse en el mismo período.

> Si una materia no tiene AE configurados, el alumno ve un aviso informativo y puede continuar con las demás.

### 6. Consulta de resultados (Coordinador)

**Inicio / Resumen**
- KPIs: alumnos activos, evaluaciones completadas, promedio general, tasa de participación.
- Tabla de promedios por AE con barras de color (verde ≥ 3.5 / azul 2.5–3.49 / amarillo 1.5–2.49 / rojo < 1.5).
- Distribución Likert global.
- **Exportar PDF**: encabezado institucional, KPIs, tabla de AE con barras visuales, distribución Likert, pie de página con número de página.

**Evaluaciones**
- Filtros: período (activo por defecto) + materia.
- Tabla: matrícula, nombre, materia, período, criterios evaluados, promedio, nivel.
- **Exportar CSV**: archivo con BOM UTF-8 (compatible con Excel), columnas completas, nombre de archivo con carrera y período.
- **Exportar PDF** (landscape): tabla completa con celdas coloreadas por nivel + resumen estadístico (total, promedio general, distribución porcentual por nivel Likert).

### 7. Cambio de contraseña (todos los roles)

Cualquier usuario (alumno, coordinador, admin) puede cambiar su contraseña en cualquier momento desde el botón **Cambiar contraseña** en el sidebar, proporcionando su contraseña actual y la nueva.

---

## Instalación local (XAMPP)

### Requisitos

- XAMPP con PHP 8.0+ y MySQL 8.0+
- Composer
- El proyecto ubicado en `htdocs/atributos-egreso/`

### Pasos

```bash
# 1. Instalar dependencias PHP
composer install

# 2. Crear la base de datos
# Abrir MySQL (phpMyAdmin o CLI) y ejecutar:
# database/schema.sql   → crea la estructura
# database/seed.sql     → inserta datos iniciales (admin, carrera de prueba, período)

# 3. Configurar conexión a DB
# Editar api/config/db.php con el host, usuario y contraseña de MySQL

# 4. Configurar clave JWT
# Editar api/config/session.php y cambiar JWT_SECRET por una cadena segura

# 5. Acceder al sistema
# http://localhost/atributos-egreso/public/index.html
```

### Credenciales iniciales (seed)

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | `admin@itcelaya.edu.mx` | `admin123` |

> Se recomienda cambiar la contraseña del administrador antes de cualquier uso en producción.

---

## Seguridad

- Contraseñas almacenadas con `password_hash()` (bcrypt, PHP).
- Autenticación mediante JWT con expiración configurable.
- El flag `primera_vez` fuerza el cambio de contraseña en el primer acceso de alumnos importados por CSV.
- Redirección a login solo cuando el token expira (status 401 con token presente); errores de credenciales incorrectas se muestran en pantalla sin redirigir.
- CORS configurado en `api/config/cors.php`.

---

## Exportaciones disponibles

| Módulo | Formato | Contenido |
|--------|---------|-----------|
| Coordinador → Inicio | PDF | Encabezado institucional, KPIs, promedios por AE con barras de color, distribución Likert, pie con páginas |
| Coordinador → Evaluaciones | CSV | Matrícula, nombre, materia, período, criterios, promedio — con BOM UTF-8 |
| Coordinador → Evaluaciones | PDF (landscape) | Tabla completa con colores por nivel + resumen estadístico al pie |

Las librerías de PDF (jsPDF + jspdf-autotable) se cargan de forma lazy desde CDN solo cuando el usuario las requiere.

---

## Niveles Likert

| Valor | Etiqueta | Color en reportes |
|-------|----------|------------------|
| 4 | Muy Bueno (≥ 3.5) | Verde |
| 3 | Bueno (2.5 – 3.49) | Azul |
| 2 | Suficiente (1.5 – 2.49) | Amarillo |
| 1 | No suficiente (< 1.5) | Rojo |
