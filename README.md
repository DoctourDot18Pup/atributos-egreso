# Atributos de Egreso — ITC Celaya

Plataforma web para la evaluación de competencias de egreso del TecNM Instituto Tecnológico de Celaya.

## Stack
- Frontend: HTML + CSS + JavaScript vanilla
- Backend: PHP 8+
- Base de datos: MySQL (XAMPP)

## Estructura
- `public/` — Interfaz de usuario (HTML, CSS, JS)
- `api/` — Endpoints REST en PHP
- `database/` — Esquema SQL y datos semilla

## Roles
- **Alumno** — Captura evaluaciones Likert por materia
- **Coordinador** — Consulta reportes y dashboards por carrera
- **Administrador** — CRUD completo de catálogos y usuarios

## Fases de desarrollo
1. Base de datos (schema + seed)
2. Autenticación PHP
3. Login frontend por rol
4. Módulo Admin — catálogos
5. Módulo Alumno — evaluación Forma 4.2.1
6. Módulo Coordinador — reportes
7. Exportación PDF/Excel
8. Auditoría y pruebas finales
