const {
  User,
  Retailer,
  Vendor,
  Region,
  Category,
  Product,
  Inventory,
  Order,
  DemandRequest,
  SearchHistory,
  AuditLog,
} = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { logAction } = require('../services/auditService');
const { getTopProducts, WEIGHTS: DEMAND_WEIGHTS, RAW_SCORE_CAP } = require('../services/demandService');
const { WEIGHTS: MATCH_WEIGHTS } = require('../services/matchingService');
const env = require('../config/env');

// ---- Users ----
const listUsers = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.role) where.role = req.query.role;
  const users = await User.findAll({
    where,
    attributes: ['id', 'email', 'name', 'phone', 'role', 'isActive', 'createdAt'],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: users });
});

const setUserActive = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  await user.update({ isActive: req.body.isActive });
  await logAction(req.user.id, 'ADMIN_SET_USER_ACTIVE', 'User', user.id, { isActive: req.body.isActive });
  res.json({ success: true, data: { id: user.id, isActive: user.isActive } });
});

// ---- Vendors ----
const listVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.findAll({ include: [User, Region], order: [['createdAt', 'DESC']] });
  res.json({ success: true, data: vendors });
});

const verifyVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findByPk(req.params.id);
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  await vendor.update({ verified: req.body.verified !== false });
  await logAction(req.user.id, 'ADMIN_VERIFY_VENDOR', 'Vendor', vendor.id, { verified: vendor.verified });
  res.json({ success: true, data: vendor });
});

const vendorPerformance = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findByPk(req.params.id);
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  const [totalOrders, completedOrders, totalProducts, activeProducts] = await Promise.all([
    Order.count({ where: { vendorId: vendor.id } }),
    Order.count({ where: { vendorId: vendor.id, status: 'COMPLETED' } }),
    Inventory.count({ where: { vendorId: vendor.id } }),
    Inventory.count({ where: { vendorId: vendor.id, isActive: true } }),
  ]);

  res.json({
    success: true,
    data: {
      vendorId: vendor.id,
      businessName: vendor.businessName,
      reliabilityScore: vendor.reliabilityScore,
      totalOrders,
      completedOrders,
      fulfillmentRate: totalOrders ? Math.round((completedOrders / totalOrders) * 100) : 0,
      totalProducts,
      activeProducts,
    },
  });
});

const vendorProducts = asyncHandler(async (req, res) => {
  const inventory = await Inventory.findAll({ where: { vendorId: req.params.id }, include: [Product] });
  res.json({ success: true, data: inventory });
});

// ---- Retailers ----
const listRetailers = asyncHandler(async (req, res) => {
  const retailers = await Retailer.findAll({ include: [User, Region], order: [['createdAt', 'DESC']] });
  res.json({ success: true, data: retailers });
});

const verifyRetailer = asyncHandler(async (req, res) => {
  const retailer = await Retailer.findByPk(req.params.id);
  if (!retailer) throw new ApiError(404, 'Retailer not found');
  await retailer.update({ verified: req.body.verified !== false });
  await logAction(req.user.id, 'ADMIN_VERIFY_RETAILER', 'Retailer', retailer.id, { verified: retailer.verified });
  res.json({ success: true, data: retailer });
});

const retailerActivity = asyncHandler(async (req, res) => {
  const retailer = await Retailer.findByPk(req.params.id);
  if (!retailer) throw new ApiError(404, 'Retailer not found');

  const [searchCount, requirementCount, orderCount] = await Promise.all([
    SearchHistory.count({ where: { retailerId: retailer.id } }),
    DemandRequest.count({ where: { retailerId: retailer.id } }),
    Order.count({ where: { retailerId: retailer.id } }),
  ]);

  res.json({
    success: true,
    data: { retailerId: retailer.id, shopName: retailer.shopName, searchCount, requirementCount, orderCount },
  });
});

// ---- Products & Categories ----
const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  res.json({ success: true, data: categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const [category] = await Category.findOrCreate({ where: { name: req.body.name } });
  await logAction(req.user.id, 'ADMIN_CREATE_CATEGORY', 'Category', category.id);
  res.status(201).json({ success: true, data: category });
});

const listAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.findAll({ include: [Category], order: [['name', 'ASC']] });
  res.json({ success: true, data: products });
});

// ---- Orders ----
const listAllOrders = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const orders = await Order.findAll({
    where,
    include: [Product, Vendor, Retailer],
    order: [['createdAt', 'DESC']],
    limit: 200,
  });
  res.json({ success: true, data: orders });
});

// ---- Requirements ----
const listAllRequirements = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const requirements = await DemandRequest.findAll({
    where,
    include: [Product, Retailer],
    order: [['createdAt', 'DESC']],
    limit: 200,
  });
  res.json({ success: true, data: requirements });
});

// ---- Demand analytics ----
const demandAnalytics = asyncHandler(async (req, res) => {
  const top = await getTopProducts(15);
  res.json({
    success: true,
    data: {
      mostSearched: [...top].sort((a, b) => b.searches - a.searches).slice(0, 5),
      mostRequested: [...top].sort((a, b) => b.requirementRequests - a.requirementRequests).slice(0, 5),
      mostOrdered: [...top].sort((a, b) => b.completedOrders - a.completedOrders).slice(0, 5),
      mostUnavailable: top.filter((r) => r.nearbyStock === 0 && (r.searches > 0 || r.requirementRequests > 0)),
      supplyGaps: top.filter((r) => r.totalRequestedQty > r.nearbyStock),
    },
  });
});

// ---- Settings (read-only view of the live scoring configuration) ----
const platformSettings = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      matchScoreWeights: MATCH_WEIGHTS,
      demandScore: {
        weights: DEMAND_WEIGHTS,
        rawScoreCap: RAW_SCORE_CAP,
        availabilityGapBonus: { noNearbyStock: 20, stockBelowRequested: 10 },
        classification: { LOW: '0-30', MEDIUM: '31-60', HIGH: '61-80', VERY_HIGH: '81-100' },
      },
      inventorySync: { mechanism: 'polling', clientIntervalSeconds: 10 },
      demandAlerts: { channel: 'in-app', cooldownHours: 24 },
      database: env.db.dialect,
    },
  });
});

// ---- Audit logs ----
const listAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.findAll({
    include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }],
    order: [['createdAt', 'DESC']],
    limit: 200,
  });
  res.json({ success: true, data: logs });
});

module.exports = {
  listUsers,
  setUserActive,
  listVendors,
  verifyVendor,
  vendorPerformance,
  vendorProducts,
  listRetailers,
  verifyRetailer,
  retailerActivity,
  listCategories,
  createCategory,
  listAllProducts,
  listAllOrders,
  listAllRequirements,
  demandAnalytics,
  platformSettings,
  listAuditLogs,
};
