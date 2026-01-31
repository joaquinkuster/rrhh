require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const seedData = require('./scripts/seed_data');

const PORT = process.env.PORT || 3000;

// Sincronizar base de datos y iniciar servidor
const startServer = async () => {
    try {
        // Sincronizar base de datos
        await sequelize.sync();
        console.log('✅ Base de datos sincronizada');

        // Ejecutar seed de datos (si es necesario)
        await seedData(false);

        app.listen(PORT, () => {
            console.log(`🚀 Servidor CataratasRH corriendo en http://localhost:${PORT}`);
            console.log(`📋 API Empleados: http://localhost:${PORT}/api/empleados`);
            console.log(`🌍 API Nacionalidades: http://localhost:${PORT}/api/nacionalidades`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();