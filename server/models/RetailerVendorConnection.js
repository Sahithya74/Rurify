const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class RetailerVendorConnection extends Model {}

RetailerVendorConnection.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    retailerId: { type: DataTypes.INTEGER, allowNull: false },
    vendorId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    modelName: 'RetailerVendorConnection',
    tableName: 'retailer_vendor_connections',
    timestamps: true,
    indexes: [{ unique: true, fields: ['retailerId', 'vendorId'] }],
  }
);

module.exports = RetailerVendorConnection;
