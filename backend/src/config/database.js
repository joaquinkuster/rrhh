const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false,
});

// Habilitar foreign keys en SQLite
sequelize.query('PRAGMA foreign_keys = ON;');

module.exports = sequelize;
