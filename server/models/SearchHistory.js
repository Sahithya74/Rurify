const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class SearchHistory extends Model {}

SearchHistory.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    retailerId: { type: DataTypes.INTEGER, allowNull: false },
    query: { type: DataTypes.STRING, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: true },
    resultsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'SearchHistory',
    tableName: 'search_history',
    timestamps: true,
    indexes: [{ fields: ['createdAt'] }, { fields: ['productId'] }],
  }
);

module.exports = SearchHistory;
