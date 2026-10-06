const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class VendorResponse extends Model {}

VendorResponse.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    demandRequestId: { type: DataTypes.INTEGER, allowNull: false },
    vendorId: { type: DataTypes.INTEGER, allowNull: false },
    response: {
      type: DataTypes.ENUM('AVAILABLE', 'CAN_STOCK', 'NOT_AVAILABLE'),
      allowNull: false,
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'VendorResponse',
    tableName: 'vendor_responses',
    timestamps: true,
    indexes: [{ unique: true, fields: ['demandRequestId', 'vendorId'] }],
  }
);

module.exports = VendorResponse;
