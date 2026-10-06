const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class InventoryUpdateLog extends Model {}

InventoryUpdateLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    inventoryId: { type: DataTypes.INTEGER, allowNull: false },
    field: { type: DataTypes.STRING, allowNull: false },
    oldValue: { type: DataTypes.STRING, allowNull: true },
    newValue: { type: DataTypes.STRING, allowNull: true },
    changeType: {
      type: DataTypes.ENUM('CREATED', 'UPDATED', 'DEACTIVATED'),
      allowNull: false,
      defaultValue: 'UPDATED',
    },
  },
  { sequelize, modelName: 'InventoryUpdateLog', tableName: 'inventory_update_logs', timestamps: true }
);

module.exports = InventoryUpdateLog;
