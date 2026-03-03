/**
 * @fileoverview Configuración de Sequelize para la conexión con la base de datos MySQL.
 * Define la instancia principal de la base de datos y su pool de conexiones.
 * @module config/database
 */

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  (process.env.DB_NAME || 'cataratasrh').trim(),
  (process.env.DB_USER || 'root').trim(),
  (process.env.DB_PASSWORD || '').trim(),
  {
    host: (process.env.DB_HOST || 'localhost').trim(),
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    pool: {
      max: 20,
      min: 2,
      acquire: 60000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
