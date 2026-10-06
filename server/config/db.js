const { Sequelize } = require('sequelize');
const path = require('path');
const env = require('./env');

let sequelize;

if (env.db.dialect === 'mysql') {
  sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
    host: env.db.host,
    port: env.db.port,
    dialect: 'mysql',
    logging: false,
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '..', env.db.storage.replace('./', '')),
    logging: false,
  });
}

module.exports = sequelize;
