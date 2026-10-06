const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Product extends Model {}

Product.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    categoryId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    variety: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
    description: { type: DataTypes.TEXT, allowNull: true },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    unit: { type: DataTypes.STRING, allowNull: false, defaultValue: 'kg' },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    indexes: [{ fields: ['name'] }, { unique: true, fields: ['name', 'variety'] }],
  }
);

module.exports = Product;
