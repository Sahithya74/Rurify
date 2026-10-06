const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class StockingRecommendation extends Model {}

StockingRecommendation.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    vendorId: { type: DataTypes.INTEGER, allowNull: true },
    priority: {
      type: DataTypes.ENUM('HIGH_PRIORITY', 'CONSIDER_INCREASING', 'NONE'),
      allowNull: false,
    },
    demandScore: { type: DataTypes.FLOAT, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    computedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: 'StockingRecommendation', tableName: 'stocking_recommendations', timestamps: true }
);

module.exports = StockingRecommendation;
