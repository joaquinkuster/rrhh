# CataratasRH - Sistema de Gestión de Recursos Humanos (RRHH)

Este proyecto es una aplicación web completa para la gestión integral de recursos humanos, desarrollada con una arquitectura moderna de cliente-servidor (Monorepo).

**Despliegue en Producción:** [https://rrhh-production-210b.up.railway.app](https://rrhh-production-210b.up.railway.app)  
**Documentación Técnica (JSDoc):** [https://rrhh-production-210b.up.railway.app/documentacion](https://rrhh-production-210b.up.railway.app/documentacion)

---

## 1. Estructura del Sistema

El proyecto está organizado como un **Monorepo** con la siguiente estructura:
- `/backend`: Servidor Node.js + Express + Sequelize.
- `/frontend`: Aplicación SPA con React + Vite.
- `/docs`: Documentación generada automáticamente (JSDoc) para ambos módulos.

### Tecnologías Utilizadas

**Frontend:**
*   **React + Vite**: Framework principal para la interfaz de usuario.
*   **React Router**: Manejo de navegación y rutas.
*   **Context API**: Gestión del estado global (Auth, Theme).
*   **Vanilla CSS**: Diseño responsivo y moderno (Dark Mode incluido).

**Backend:**
*   **Node.js + Express**: Servidor API RESTful.
*   **Sequelize ORM**: Manejo de base de datos relacional (MySQL).
*   **JWT**: Autenticación segura y manejo de sesiones.
*   **Node-Cron**: Automatización de tareas (vencimientos de contratos, salud).

---

## 2. Instalación y Ejecución Local

Para ejecutar el proyecto localmente, sigue estos pasos:

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/joaquinkuster/rrhh.git
    cd rrhh
    ```

2.  **Instalar dependencias**: (Requiere Node.js instalado)
    ```bash
    npm run install:all
    ```

3.  **Configurar variables de entorno**:
    Crea un archivo `.env` en la carpeta `/backend` con las credenciales de tu base de datos y un `SESSION_SECRET`.

4.  **Iniciar el proyecto**:
    - **Backend**: `npm run dev --prefix backend`
    - **Frontend**: `npm run dev --prefix frontend`

El backend correrá en el puerto **3000** y el frontend en el **5173**.

---

## 3. ABMs y Reglas de Negocio

El sistema utiliza "Wizards" (formularios por pasos) para la creación y edición de las entidades principales:

### Empresas y Estructura Organizacional
- Gestión jerárquica: **Empresa -> Área -> Departamento -> Puesto**.
- Los puestos están vinculados a su estructura superior para reportes precisos.

### Empleados
- Legajo completo con validaciones estrictas de **DNI (8 dígitos)** y **CUIL (XX-XXXXXXXX-X)**.
- El sistema incluye un seeder avanzado que genera datos de prueba válidos y consistentes.

### Contratos
- Vinculación formal entre Empleado y Puesto.
- **Validación de fechas**: Permite fechas pasadas para retroactividad y previene errores de zona horaria al sincronizar con el servidor.

### Solicitudes y Novedades
- Gestión de **Vacaciones** (cálculo de días hábiles), **Licencias**, **Horas Extras** y **Renuncias**.
- Flujo de aprobación centralizado desde el Dashboard.

### Liquidaciones
- Generación de recibos de sueldo basados en conceptos remunerativos y deducciones.
- Cálculo automático de Bruto y Neto integrado con novedades.

---

## 4. Flujo del Sistema

### Autenticación y Seguridad
*   **Login**: Acceso mediante DNI y Contraseña.
*   **Registro**: Alta de usuarios con validación de código de invitación o flujo público controlado.
*   **Roles**: Diferenciación entre Administrador (acceso total) y Usuario/Empleado (acceso a sus propios datos).
*   **Protección**: Rutas privadas (`ProtectedRoute`) con redirección automática.

### Navegación y Layout
*   **Barra Lateral (Sidebar)**: Acceso rápido a todos los módulos del sistema.
*   **Barra Superior (Navbar)**: Información del usuario logueado, avatar dinámico y menú de perfil.
*   **Modo Oscuro**: Soporte nativo para cambio de tema (ThemeContext).

### Dashboard y Análisis de Datos
*   **Panel Central**: Visualización de solicitudes pendientes, próximos eventos y feriados.
*   **Módulo de Reportes**: Analíticas de headcount, estructura organizacional interactiva e historial de altas por empresa.

---

## 5. Despliegue (Railway)

El sistema está configurado para desplegarse automáticamente en **Railway** como un único servicio dinámico:
- El backend sirve los archivos estáticos del frontend compilado (`/frontend/dist`).
- La documentación técnica se sirve bajo la ruta `/docs`.
- Las sesiones se almacenan en la base de datos para persistencia entre reinicios.

---

Desarrollado para la optimización de procesos de RRHH modernos.

**Contribuidores:** Joaquín Küster, Marcos Natanael Da Silva y Lazaro Ezequiel Martinez.

© 2026 CataratasRH - Todos los derechos reservados.
