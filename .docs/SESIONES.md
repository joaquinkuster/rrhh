# Sistema de Autenticación y Sesiones - CataratasRH

## Resumen
El sistema utiliza **sesiones basadas en cookies** para la autenticación. No se almacenan contraseñas en el navegador, solo un identificador de sesión seguro.

## Cómo Funciona

### 1. Login
Cuando un usuario inicia sesión:
- El servidor verifica las credenciales (email y contraseña hasheada)
- Si son válidas, crea una sesión en la base de datos
- Envía una **cookie httpOnly** al navegador con el ID de sesión
- La cookie incluye:
  - `httpOnly: true` - No accesible desde JavaScript (seguridad)
  - `sameSite: 'lax'` - Protección contra CSRF
  - `secure: false` - Solo en desarrollo (debe ser `true` en producción con HTTPS)

### 2. Opción "Recordarme"
- **Si está marcado**: La cookie dura **30 días**
- **Si NO está marcado**: La cookie dura **24 horas**

### 3. Persistencia de Sesión
Con la configuración actual:
- ✅ Las sesiones persisten al **refrescar la página**
- ✅ Las sesiones persisten al **cerrar y reabrir el navegador** (si "Recordarme" está marcado)
- ✅ La cookie se **renueva automáticamente** en cada request (`rolling: true`)
- ✅ Las sesiones se guardan en la **base de datos** (tabla `sessions`)

### 4. Verificación de Sesión
En cada carga de la aplicación:
1. El `AuthContext` llama a `checkAuth()`
2. Se hace una petición a `/api/auth/me`
3. El navegador **envía automáticamente** la cookie de sesión
4. El servidor verifica si la sesión es válida
5. Si es válida, devuelve los datos del usuario
6. Si no es válida, el usuario debe iniciar sesión

## Flujo Técnico

```
┌─────────────┐         Login         ┌─────────────┐
│  Frontend   │ ───────────────────▶  │   Backend   │
│  (React)    │                        │  (Express)  │
└─────────────┘                        └─────────────┘
      │                                       │
      │                                   Verifica
      │                                   Credenciales
      │                                       │
      │                                   Crea Sesión
      │                                   en DB
      │                                       │
      │   ◀─── Set-Cookie: connect.sid ───────┤
      │        (httpOnly, sameSite)           │
      │                                       │
      │                                       │
┌─────▼───────────────────────────────────────▼─────┐
│  Navegador guarda cookie automáticamente          │
│  - No accesible desde JavaScript                  │
│  - Se envía en cada request al backend            │
│  - Duración según "Recordarme"                    │
└───────────────────────────────────────────────────┘
      │                                       │
      │   Refresh / Nueva request             │
      │  (Cookie enviada automáticamente)     │
      │ ──────────────────────────────────▶   │
      │                                       │
      │                                  Verifica
      │                                  Sesión en DB
      │                                       │
      │   ◀───── Datos del Usuario ───────────┤
      │        (si sesión válida)             │
```

## Seguridad

### ✅ Implementado
1. **Contraseñas hasheadas** con bcrypt
2. **Cookies httpOnly** - No accesibles desde JavaScript
3. **SameSite: lax** - Protección contra CSRF
4. **Sesiones en base de datos** - Pueden invalidarse centralmente
5. **Credenciales incluidas** - `credentials: 'include'` en fetch

### ⚠️ Para Producción
1. Cambiar `secure: true` en cookies (requiere HTTPS)
2. Usar variable de entorno `SESSION_SECRET` segura
3. Configurar CORS con dominio específico (no localhost)
4. Considerar añadir rate limiting en login

## Configuración Actual

### Backend (`app.js`)
```javascript
app.use(session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore, // Base de datos
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
        secure: false, // true en producción
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24h por defecto
        sameSite: 'lax',
    },
    rolling: true, // Renueva cookie en cada request
}));
```

### Login Controller (`authController.js`)
```javascript
// Si "recordarme" está activo
if (recordarme) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
}
```

### Frontend (`api.js`)
```javascript
const fetchWithCredentials = (url, options = {}) => {
    return fetch(url, {
        ...options,
        credentials: 'include', // Envía cookies
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
};
```

## Resolución de Problemas

### Problema: Sesión se pierde al refrescar
**Causa**: Cookie no se está enviando correctamente

**Solución**:
1. Verificar que `credentials: 'include'` esté en todas las peticiones fetch
2. Verificar que CORS incluya `credentials: true`
3. Verificar que frontend y backend estén en el mismo dominio/puerto (o configurado correctamente)

### Problema: Sesión se cierra al cerrar navegador
**Cuando es esperado**: Si NO se marcó "Recordarme"

**Cuando es un error**: Si SÍ se marcó "Recordarme"
- Verificar que `req.session.cookie.maxAge` se establezca correctamente
- Verificar que `req.session.save()` se llame después de modificar la sesión

### Problema: Usuario debe login cada vez
**Verificar**:
1. Que la tabla `sessions` existe en la base de datos
2. Que `AuthContext.checkAuth()` se llame al cargar la app
3. Que `/api/auth/me` devuelva datos correctamente
4. Revisar console del navegador para errores CORS

## Testing

### Verificar que funciona:
1. **Login sin "Recordarme"**:
   - Iniciar sesión sin marcar
   - Refrescar página ✅ Debe mantener sesión
   - Cerrar navegador y reabrir ❌ Debe pedir login nuevamente

2. **Login con "Recordarme"**:
   - Iniciar sesión marcando
   - Refrescar página ✅ Debe mantener sesión
   - Cerrar navegador y reabrir ✅ Debe mantener sesión
   - Después de 30 días ❌ Debe pedir login

3. **Verificar cookie**:
   - Abrir DevTools → Application → Cookies
   - Buscar `connect.sid`
   - Verificar:
     - HttpOnly: ✓
     - SameSite: Lax
     - Expiration: (según "Recordarme")

## Tabla de Sesiones

Las sesiones se almacenan en la tabla `sessions`:
- `sid` - ID único de sesión
- `expires` - Fecha de expiración
- `data` - Datos de sesión (empleadoId, esAdministrador)
- `createdAt`, `updatedAt` - Timestamps

El cron job limpia sesiones expiradas cada 15 minutos.
