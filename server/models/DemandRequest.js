const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class DemandRequest extends Model {}

DemandRequest.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    retailerId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    requiredQty: { type: DataTypes.FLOAT, allowNull: false },
    requiredDate: { type: DataTypes.DATEONLY, allowNull: true },
    preferredPrice: { type: DataTypes.FLOAT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('PENDING', 'FULFILLED', 'CLOSED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
  },
  {
    sequelize,
    modelName: 'DemandRequest',
    tableName: 'demand_requests',
    timestamps: true,
    indexes: [{ fields: ['status'] }, { fields: ['productId'] }],
  }
);

module.exports = DemandRequest;
