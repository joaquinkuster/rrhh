# Sistema de Gestión de Recursos Humanos (RRHH)

Este proyecto es una aplicación web completa para la gestión integral de recursos humanos, desarrollada con una arquitectura moderna de cliente-servidor.

## 1. Estructura del Sistema

### Tecnologías Utilizadas

**Frontend:**
*   **React + Vite**: Framework principal para la interfaz de usuario.
*   **React Router**: Manejo de navegación y rutas.
*   **Context API**: Gestión del estado global (Auth, Theme).
*   **CSS Modules / Variables**: Estilizado con diseño responsivo y modo oscuro.

**Backend:**
*   **Node.js + Express**: Servidor API RESTful.
*   **Sequelize ORM**: Manejo de base de datos relacional.
*   **MySQL / MariaDB**: Base de datos principal.
*   **JWT**: Autenticación segura.

### Organización de Carpetas

*   **backend/src/**
    *   `models/`: Definiciones de tablas y relaciones (Sequelize).
    *   `controllers/`: Lógica de negocio y manejo de peticiones.
    *   `routes/`: Endpoints de la API.
    *   `middleware/`: Autenticación y validaciones.
*   **frontend/src/**
    *   `components/`: Componentes reutilizables y "Wizards" de formularios.
    *   `pages/`: Vistas principales (Dashboard, ABMs).
    *   `context/`: Estados globales (AuthContext, ThemeContext).
    *   `services/`: Funciones para comunicación con la API (Axios).

---

## 2. ABMs del Sistema (Atributos, Validaciones y Reglas de Negocio)

El sistema utiliza "Wizards" (formularios por pasos) para la creación y edición de las entidades principales, asegurando la integridad de los datos.

### Empresas
Gestión de la estructura organizacional.
*   **Atributos**: Nombre, Razon Social, CUIT, Email, Teléfono, Dirección, Rubro.
*   **Estructura Jerárquica**:
    *   **Áreas**: Divisiones macro de la empresa.
    *   **Departamentos**: Subdivisiones dentro de cada área.
    *   **Puestos**: Roles específicos dentro de cada departamento.
*   **Reglas**:
    *   Un puesto debe pertenecer a un departamento, y este a un área.
    *   Validación de formato de Email y longitud de campos.

### Empleados
Información personal y legajo de los colaboradores.
*   **Atributos**: Nombre, Apellido, DNI, CUIL, Fecha Nacimiento, Género, Estado Civil, Nacionalidad, Email, Teléfonos, Dirección.
*   **Validaciones**:
    *   DNI y CUIL deben ser únicos en el sistema.
    *   Mayoría de edad (18 años) calculada desde Fecha de Nacimiento.
    *   Formatos válidos para Emails y Teléfonos.
*   **Reglas**:
    *   Un empleado se crea primero, para luego asignarle un Contrato.

### Contactos
Contactos de emergencia o familiares del empleado.
*   **Atributos**: Vinculación a Empleado, Es Familiar, Es Contacto Emergencia, Nombre, DNI, Parentesco, Teléfonos, Dirección.
*   **Validaciones**:
    *   Atributos booleanos para `esFamiliar` y `esContactoEmergencia`. Debe seleccionarse al menos uno.
    *   Si es contacto de emergencia, validación de mayoría de edad (18+).

### Contratos
Vinculación formal entre un Empleado y un Puesto de una Empresa.
*   **Atributos**: Empleado, Puesto (seleccionado jerárquicamente), Tipo de Contrato, Fechas (Inicio/Fin), Salario, Carga Horaria.
*   **Tipos de Contrato**:
    *   *Laborales*: Tiempo Indeterminado, Plazo Fijo, Período de Prueba, Eventual, Teletrabajo.
    *   *No Laborales*: Locación de Servicios, Pasantía, etc.
*   **Reglas de Negocio**:
    *   Un empleado no puede tener dos contratos activos solapados para el mismo puesto.
    *   Vinculación estricta: Empleado -> Contrato -> Puesto -> Departamento -> Área -> Empresa.

### Solicitudes
Gestión de novedades y pedidos de los empleados.
*   **Tipos**:
    *   **Vacaciones**: Días hábiles, control de saldo disponible.
    *   **Licencias**: Enfermedad, Estudio, Maternidad, etc. Requiere adjuntar comprobantes.
    *   **Horas Extras**: Registro de horas trabajadas fuera de horario.
    *   **Renuncia**: Formalización de baja, con fecha de último día y motivo.
*   **Flujo**: Estado inicial `Pendiente` -> Aprobación/Rechazo por RRHH o Admin.
*   **Reglas**:
    *   No se pueden solapar solicitudes en las mismas fechas.
    *   Validación de días hábiles vs corridos según el tipo.
    *   Regla "Anti-stress" (opcional): sugerencia de días mínimos.

### Evaluaciones
Gestión del desempeño.
*   **Atributos**: Contrato (Evaluado), Evaluador, Tipo, Período, Fecha, Puntaje, Comentarios.
*   **Tipos**: Autoevaluación, 90° (Descendente), 180° (Pares), 270° (Ascendente), 360° (Integral).
*   **Períodos**: Anual, Semestral, Trimestral (Q1-Q4), Fin de Proyecto, etc.
*   **Reglas**:
    *   Cálculo de puntaje final basado en competencias/objetivos definidos.

### Liquidaciones
Cálculo de haberes mensuales.
*   **Atributos**: Contrato, Período (Mes/Año), Items Remunerativos (Básico, Antigüedad, Presentismo, Extras, etc.), Deducciones.
*   **Cálculos Automáticos**:
    *   **Bruto**: Suma de conceptos remunerativos.
    *   **Neto**: Bruto menos retenciones y deducciones.
*   **Reglas**:
    *   Integración con novedades (inasistencias, horas extras) para el cálculo.

### Registros de Salud
Legajo médico y exámenes ocupacionales.
*   **Atributos**: Empleado, Tipo Examen (Pre-ocupacional, Periódico, etc.), Resultado (Apto, No Apto), Fechas (Realización, Vencimiento).
*   **Archivos**: Soporte para carga de múltiples comprobantes (PDF, Imágenes).
*   **Reglas**:
    *   Alertas de vencimiento para renovación de exámenes.

---

## 3. Flujo del Sistema

### Autenticación y Seguridad
*   **Login**: Acceso mediate DNI y Contraseña.
*   **Registro**: Alta de usuarios con validación de código de invitación o flujo público controlado.
*   **Roles**: Diferenciación entre Administrador (acceso total) y Usuario/Empleado (acceso a sus propios datos).
*   **Protección**: Rutas privadas (`ProtectedRoute`) que redirigen al login si no hay sesión activa.

### Navegación Principal
El sistema cuenta con una **Barra Lateral (Sidebar)** colapsable y una **Barra Superior (Navbar)**:
*   **Sidebar**: Acceso rápido a los módulos principales (Empleados, Empresas, Contratos, etc.).
*   **Navbar**: Información del usuario logueado, avatar dinámico y menú de perfil/logout.

### Dashboard
Panel de control principal que ofrece una visión general del estado de la organización:
1.  **Solicitudes Pendientes**: Lista priorizada de solicitudes (vacaciones, licencias) que requieren atención.
    *   *Acciones rápidas*: Aprobar, Editar o Rechazar directamente desde el widget.
2.  **Próximos Eventos**: Visualización de feriados próximos para planificación.
3.  **Alertas**: Notificaciones de contratos por vencer o novedades salud (futuro).

### Reportes
Módulo de inteligencia de negocios para análisis de datos:
*   **Filtros**: Selección dinámica por Empresa para aislar los datos.
*   **Métricas Clave (KPIs)**:
    *   Total de Áreas, Departamentos y Puestos.
    *   **Headcount**: Cantidad de empleados activos.
*   **Visualizaciones**:
    *   **Estructura Organizacional**: Árbol interactivo que muestra la jerarquía y cantidad de personal por nodo.
    *   **Distribución por Contrato**: Gráfico de barras mostrando la proporción de tipos de contratación.
    *   **Historial de Altas**: Gráfico de línea temporal de nuevos ingresos.
    *   **Últimos Movimientos**: Tabla resumen de las contrataciones más recientes.

### Operatoria General (Wizards)
Para mantener la consistencia y facilitar la carga de datos complejos, el sistema utiliza "Wizards" paso a paso:
1.  **Inicio**: Se presentan los campos básicos obligatorios.
2.  **Detalle**: Carga de información complementaria o relaciones (ej. asignar Puesto en Contrato).
3.  **Confirmación/Documentación**: Carga de archivos adjuntos y revisión antes de guardar.
*   Este patrón se repite en: Alta de Empleado, Creación de Empresa, Nuevo Contrato, Solicitud de Licencia, etc.
