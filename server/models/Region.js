const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Region extends Model {}

Region.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    state: { type: DataTypes.STRING, allowNull: false },
    lat: { type: DataTypes.FLOAT, allowNull: false },
    lng: { type: DataTypes.FLOAT, allowNull: false },
  },
  { sequelize, modelName: 'Region', tableName: 'regions', timestamps: true }
);

module.exports = Region;
