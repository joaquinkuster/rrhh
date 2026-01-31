const { Sequelize, DataTypes } = require('sequelize');

// Config based on .env
const sequelize = new Sequelize('cataratasrh', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

const ConceptoSalarial = sequelize.define('ConceptoSalarial', {
    nombre: { type: DataTypes.STRING, allowNull: false },
    tipo: { type: DataTypes.STRING, allowNull: false },
    valor: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    esPorcentaje: { type: DataTypes.BOOLEAN, defaultValue: false },
    formula: { type: DataTypes.STRING, allowNull: true },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    tableName: 'conceptos_salariales',
    timestamps: true
});

async function cleanup() {
    try {
        console.log('Connecting to database cataratasrh...');
        await sequelize.authenticate();
        console.log('Connected.');

        const duplicateName = 'Ley 19032';

        // Check if it exists
        const toDelete = await ConceptoSalarial.findAll({
            where: { nombre: duplicateName }
        });

        if (toDelete.length > 0) {
            console.log(`Found ${toDelete.length} concept(s) named '${duplicateName}'. Deleting...`);
            const deleted = await ConceptoSalarial.destroy({
                where: { nombre: duplicateName }
            });
            console.log(`Successfully deleted ${deleted} record(s).`);
        } else {
            console.log(`No concepts named '${duplicateName}' found.`);
        }

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await sequelize.close();
    }
}

cleanup();
