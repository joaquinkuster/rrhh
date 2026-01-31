const { Sequelize, DataTypes } = require('sequelize');

// Adjust config to match your project
const sequelize = new Sequelize('rrhh_db', 'rrhh_user', 'rrhh_pass', {
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
});

async function cleanup() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected.');

        // Delete "Ley 19032" (no dots)
        // Adjust the WHERE clause to be very specific to avoid accidental deletion
        const deleted = await ConceptoSalarial.destroy({
            where: {
                nombre: 'Ley 19032'
            }
        });

        console.log(`Deleted ${deleted} concepts named 'Ley 19032'.`);

        // Verify we have the other one
        const others = await ConceptoSalarial.findAll({
            where: {
                nombre: { [Sequelize.Op.like]: '%19.032%' }
            }
        });

        console.log('Remaining concepts matching 19.032:');
        others.forEach(c => console.log(`- ${c.id}: ${c.nombre} (${c.valor}%)`));

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await sequelize.close();
    }
}

cleanup();
