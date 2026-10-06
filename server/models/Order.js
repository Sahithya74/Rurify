const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Order extends Model {}

Order.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    retailerId: { type: DataTypes.INTEGER, allowNull: false },
    vendorId: { type: DataTypes.INTEGER, allowNull: false },
    inventoryId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.FLOAT, allowNull: false },
    pricePerUnit: { type: DataTypes.FLOAT, allowNull: false },
    totalPrice: { type: DataTypes.FLOAT, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'PROCESSING',
        'READY',
        'OUT_FOR_DELIVERY',
        'COMPLETED',
        'CANCELLED'
      ),
      allowNull: false,
      defaultValue: 'PENDING',
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    indexes: [{ fields: ['status'] }, { fields: ['retailerId'] }, { fields: ['vendorId'] }],
  }
);

module.exports = Order;
