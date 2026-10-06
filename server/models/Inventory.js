const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Inventory extends Model {}

Inventory.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    vendorId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    price: { type: DataTypes.FLOAT, allowNull: false },
    moq: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1 },
    freshness: {
      type: DataTypes.ENUM('FRESH', 'GOOD', 'AVERAGE'),
      allowNull: false,
      defaultValue: 'FRESH',
    },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
    deliveryAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'Inventory',
    tableName: 'inventory',
    timestamps: true,
    indexes: [{ unique: true, fields: ['productId', 'vendorId'] }],
  }
);

module.exports = Inventory;
