const express = require('express');
const cors = require('cors');
const empleadoRoutes = require('./routes/empleadoRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const contratoRoutes = require('./routes/contratoRoutes');
const registroSaludRoutes = require('./routes/registroSaludRoutes');
const evaluacionRoutes = require('./routes/evaluacionRoutes');
const contactoRoutes = require('./routes/contactoRoutes');
const liquidacionRoutes = require('./routes/liquidaciones');
const conceptoRoutes = require('./routes/conceptos');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rutas
app.use('/api/empleados', empleadoRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/liquidaciones', liquidacionRoutes);
app.use('/api/conceptos', conceptoRoutes);
app.use('/api/registros-salud', registroSaludRoutes);
app.use('/api/evaluaciones', evaluacionRoutes);
app.use('/api/contactos', contactoRoutes);
app.use('/api/novedades', require('./routes/novedades'));
app.use('/api/documentacion-pagos', require('./routes/documentacionPagos'));

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CataratasRH API funcionando' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal!' });
});

module.exports = app;

