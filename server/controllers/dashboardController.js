const { Op } = require('sequelize');
const {
  Retailer,
  Vendor,
  RetailerVendorConnection,
  DemandRequest,
  Order,
  Inventory,
  InventoryUpdateLog,
  Product,
} = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getTopProducts } = require('../services/demandService');
const { getRecommendationsForVendor } = require('../services/recommendationService');

const ACTIVE_ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY'];

const retailerDashboard = asyncHandler(async (req, res) => {
  const retailer = await Retailer.findOne({ where: { userId: req.user.id } });
  if (!retailer) throw new ApiError(404, 'Retailer profile not found');

  const connections = await RetailerVendorConnection.findAll({ where: { retailerId: retailer.id } });
  const vendorIds = connections.map((c) => c.vendorId);

  const [totalConnectedSuppliers, pendingRequirements, activeOrders, recentSupplierUpdates] =
    await Promise.all([
      Promise.resolve(vendorIds.length),
      DemandRequest.count({ where: { retailerId: retailer.id, status: 'PENDING' } }),
      Order.count({ where: { retailerId: retailer.id, status: { [Op.in]: ACTIVE_ORDER_STATUSES } } }),
      vendorIds.length
        ? InventoryUpdateLog.findAll({
            include: [{ model: Inventory, where: { vendorId: { [Op.in]: vendorIds } }, include: [Product] }],
            order: [['createdAt', 'DESC']],
            limit: 8,
          })
        : [],
    ]);

  res.json({
    success: true,
    data: {
      totalConnectedSuppliers,
      pendingRequirements,
      activeOrders,
      recentSupplierUpdates: recentSupplierUpdates.map((log) => ({
        id: log.id,
        field: log.field,
        changeType: log.changeType,
        productName: log.Inventory?.Product?.name,
        createdAt: log.createdAt,
      })),
    },
  });
});

const vendorDashboard = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found');

  const inventory = await Inventory.findAll({ where: { vendorId: vendor.id }, include: [Product] });
  const totalProducts = inventory.length;
  const lowStockProducts = inventory.filter((i) => i.isActive && i.quantity <= i.moq * 3);
  const currentInventoryUnits = inventory.reduce((sum, i) => (i.isActive ? sum + i.quantity : sum), 0);

  const [newRetailerRequirements, pendingOrders, recentActivity, recommendations] = await Promise.all([
    DemandRequest.count({ where: { status: 'PENDING' } }),
    Order.count({ where: { vendorId: vendor.id, status: 'PENDING' } }),
    InventoryUpdateLog.findAll({
      include: [{ model: Inventory, where: { vendorId: vendor.id }, include: [Product] }],
      order: [['createdAt', 'DESC']],
      limit: 8,
    }),
    getRecommendationsForVendor(vendor),
  ]);

  const highDemand = (await getTopProducts(5, { regionId: vendor.regionId })).filter((r) => r.demandScore > 60);

  res.json({
    success: true,
    data: {
      totalProducts,
      currentInventoryUnits,
      lowStockProducts: lowStockProducts.map((i) => ({
        inventoryId: i.id,
        productName: i.Product?.name,
        quantity: i.quantity,
        moq: i.moq,
      })),
      newRetailerRequirements,
      pendingOrders,
      highDemandProducts: highDemand.map((r) => ({
        productId: r.product.id,
        name: r.product.name,
        demandScore: r.demandScore,
        classification: r.classification,
      })),
      stockingRecommendations: recommendations.filter((r) => r.priority === 'HIGH_PRIORITY').length,
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        field: log.field,
        changeType: log.changeType,
        productName: log.Inventory?.Product?.name,
        createdAt: log.createdAt,
      })),
    },
  });
});

module.exports = { retailerDashboard, vendorDashboard };
