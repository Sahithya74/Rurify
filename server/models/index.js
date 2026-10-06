const sequelize = require('../config/db');
const User = require('./User');
const Region = require('./Region');
const Retailer = require('./Retailer');
const Vendor = require('./Vendor');
const Category = require('./Category');
const Product = require('./Product');
const Inventory = require('./Inventory');
const InventoryUpdateLog = require('./InventoryUpdateLog');
const RetailerVendorConnection = require('./RetailerVendorConnection');
const SearchHistory = require('./SearchHistory');
const DemandRequest = require('./DemandRequest');
const VendorResponse = require('./VendorResponse');
const Order = require('./Order');
const OrderStatusHistory = require('./OrderStatusHistory');
const Notification = require('./Notification');
const StockingRecommendation = require('./StockingRecommendation');
const AuditLog = require('./AuditLog');

// User <-> Retailer / Vendor (1:1)
User.hasOne(Retailer, { foreignKey: 'userId', onDelete: 'CASCADE' });
Retailer.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Vendor, { foreignKey: 'userId', onDelete: 'CASCADE' });
Vendor.belongsTo(User, { foreignKey: 'userId' });

// Region
Region.hasMany(Retailer, { foreignKey: 'regionId' });
Retailer.belongsTo(Region, { foreignKey: 'regionId' });

Region.hasMany(Vendor, { foreignKey: 'regionId' });
Vendor.belongsTo(Region, { foreignKey: 'regionId' });

// Category <-> Product
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

// Inventory
Vendor.hasMany(Inventory, { foreignKey: 'vendorId', onDelete: 'CASCADE' });
Inventory.belongsTo(Vendor, { foreignKey: 'vendorId' });

Product.hasMany(Inventory, { foreignKey: 'productId', onDelete: 'CASCADE' });
Inventory.belongsTo(Product, { foreignKey: 'productId' });

Inventory.hasMany(InventoryUpdateLog, { foreignKey: 'inventoryId', onDelete: 'CASCADE' });
InventoryUpdateLog.belongsTo(Inventory, { foreignKey: 'inventoryId' });

// Retailer <-> Vendor connections
Retailer.belongsToMany(Vendor, {
  through: RetailerVendorConnection,
  foreignKey: 'retailerId',
  otherKey: 'vendorId',
});
Vendor.belongsToMany(Retailer, {
  through: RetailerVendorConnection,
  foreignKey: 'vendorId',
  otherKey: 'retailerId',
});
Retailer.hasMany(RetailerVendorConnection, { foreignKey: 'retailerId' });
Vendor.hasMany(RetailerVendorConnection, { foreignKey: 'vendorId' });
RetailerVendorConnection.belongsTo(Retailer, { foreignKey: 'retailerId' });
RetailerVendorConnection.belongsTo(Vendor, { foreignKey: 'vendorId' });

// Search history
Retailer.hasMany(SearchHistory, { foreignKey: 'retailerId', onDelete: 'CASCADE' });
SearchHistory.belongsTo(Retailer, { foreignKey: 'retailerId' });
Product.hasMany(SearchHistory, { foreignKey: 'productId' });
SearchHistory.belongsTo(Product, { foreignKey: 'productId' });

// Demand requests
Retailer.hasMany(DemandRequest, { foreignKey: 'retailerId', onDelete: 'CASCADE' });
DemandRequest.belongsTo(Retailer, { foreignKey: 'retailerId' });
Product.hasMany(DemandRequest, { foreignKey: 'productId' });
DemandRequest.belongsTo(Product, { foreignKey: 'productId' });

DemandRequest.hasMany(VendorResponse, { foreignKey: 'demandRequestId', onDelete: 'CASCADE' });
VendorResponse.belongsTo(DemandRequest, { foreignKey: 'demandRequestId' });
Vendor.hasMany(VendorResponse, { foreignKey: 'vendorId' });
VendorResponse.belongsTo(Vendor, { foreignKey: 'vendorId' });

// Orders
Retailer.hasMany(Order, { foreignKey: 'retailerId' });
Order.belongsTo(Retailer, { foreignKey: 'retailerId' });
Vendor.hasMany(Order, { foreignKey: 'vendorId' });
Order.belongsTo(Vendor, { foreignKey: 'vendorId' });
Inventory.hasMany(Order, { foreignKey: 'inventoryId' });
Order.belongsTo(Inventory, { foreignKey: 'inventoryId' });
Product.hasMany(Order, { foreignKey: 'productId' });
Order.belongsTo(Product, { foreignKey: 'productId' });

Order.hasMany(OrderStatusHistory, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'orderId' });

// Notifications
User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Stocking recommendations
Product.hasMany(StockingRecommendation, { foreignKey: 'productId' });
StockingRecommendation.belongsTo(Product, { foreignKey: 'productId' });
Vendor.hasMany(StockingRecommendation, { foreignKey: 'vendorId' });
StockingRecommendation.belongsTo(Vendor, { foreignKey: 'vendorId' });

// Audit logs
User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Region,
  Retailer,
  Vendor,
  Category,
  Product,
  Inventory,
  InventoryUpdateLog,
  RetailerVendorConnection,
  SearchHistory,
  DemandRequest,
  VendorResponse,
  Order,
  OrderStatusHistory,
  Notification,
  StockingRecommendation,
  AuditLog,
};
