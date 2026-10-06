const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Vendor extends Model {}

Vendor.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    businessName: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    lat: { type: DataTypes.FLOAT, allowNull: false },
    lng: { type: DataTypes.FLOAT, allowNull: false },
    regionId: { type: DataTypes.INTEGER, allowNull: false },
    verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    reliabilityScore: { type: DataTypes.FLOAT, defaultValue: 75 },
  },
  { sequelize, modelName: 'Vendor', tableName: 'vendors', timestamps: true }
);

module.exports = Vendor;
