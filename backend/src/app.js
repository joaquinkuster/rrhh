const express = require('express');
const cors = require('cors');
const empleadoRoutes = require('./routes/empleadoRoutes');
const nacionalidadRoutes = require('./routes/nacionalidadRoutes');
const empresaRoutes = require('./routes/empresaRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/empleados', empleadoRoutes);
app.use('/api/nacionalidades', nacionalidadRoutes);
app.use('/api/empresas', empresaRoutes);

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
