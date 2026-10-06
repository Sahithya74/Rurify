const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class OrderStatusHistory extends Model {}

OrderStatusHistory.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false },
    changedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, modelName: 'OrderStatusHistory', tableName: 'order_status_history', timestamps: true }
);

module.exports = OrderStatusHistory;
