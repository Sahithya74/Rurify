const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class AuditLog extends Model {}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false },
    entityType: { type: DataTypes.STRING, allowNull: true },
    entityId: { type: DataTypes.INTEGER, allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'AuditLog', tableName: 'audit_logs', timestamps: true }
);

module.exports = AuditLog;
