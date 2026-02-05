const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const contratoRoutes = require('./routes/contratoRoutes');
const registroSaludRoutes = require('./routes/registroSaludRoutes');
const evaluacionRoutes = require('./routes/evaluacionRoutes');
const contactoRoutes = require('./routes/contactoRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const liquidacionRoutes = require('./routes/liquidacionRoutes');
const conceptoSalarialRoutes = require('./routes/conceptoSalarialRoutes');
const parametroLaboralRoutes = require('./routes/parametroLaboralRoutes');
const prueba_liqRoutes = require('./routes/prueba_liq');

// Iniciar cron jobs
require('./jobs/contrato.cron');
require('./jobs/registroSalud.cron');
require('./jobs/liquidacion.cron');


const app = express();

// Middlewares
app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    credentials: true, // Permitir envío de cookies
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configurar session store con Sequelize
const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'sessions', // Nombre de tabla en minúsculas
    checkExpirationInterval: 15 * 60 * 1000, // Limpiar sesiones expiradas cada 15 minutos
    expiration: 24 * 60 * 60 * 1000, // Sesiones expiran en 24 horas
});

// Configurar express-session
app.use(session({
    secret: process.env.SESSION_SECRET || 'cataratas-rh-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Cambiar a true en producción con HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        sameSite: 'lax',
    },
}));

// Exportar sessionStore para sincronizar en index.js
module.exports.sessionStore = sessionStore;

// Rutas de autenticación (públicas)
app.use('/api/auth', authRoutes);

// Rutas protegidas
app.use('/api/empleados', empleadoRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/registros-salud', registroSaludRoutes);
app.use('/api/evaluaciones', evaluacionRoutes);
app.use('/api/contactos', contactoRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/liquidaciones', liquidacionRoutes);
app.use('/api/conceptos-salariales', conceptoSalarialRoutes);
app.use('/api/parametros-laborales', parametroLaboralRoutes);


// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CataratasRH API funcionando' });
});

// Rutas de pruebas de liquidaciones
app.use('/api/liquidaciones', prueba_liqRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal!' });
});

module.exports = app;

