const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Retailer extends Model {}

Retailer.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    shopName: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    lat: { type: DataTypes.FLOAT, allowNull: false },
    lng: { type: DataTypes.FLOAT, allowNull: false },
    regionId: { type: DataTypes.INTEGER, allowNull: false },
    verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: 'Retailer', tableName: 'retailers', timestamps: true }
);

module.exports = Retailer;
