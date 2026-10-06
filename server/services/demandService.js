const { Op } = require('sequelize');
const {
  Product,
  SearchHistory,
  DemandRequest,
  Order,
  Inventory,
  Retailer,
  Vendor,
} = require('../models');

/**
 * Rule-based "Demand Intelligence Score" (0-100). Explicitly NOT machine
 * learning — a transparent, explainable formula over raw platform activity,
 * documented here and in docs/api.md so it can be swapped for a real model
 * later without changing the API shape.
 */
const WEIGHTS = {
  search: 1,
  requirementRequest: 3,
  orderAttempt: 2,
  completedOrder: 2,
};
const RAW_SCORE_CAP = 150;

function classify(score) {
  if (score > 80) return 'VERY_HIGH';
  if (score > 60) return 'HIGH';
  if (score > 30) return 'MEDIUM';
  return 'LOW';
}

async function nearbyStock(productId, regionId) {
  const where = { productId, isActive: true };
  const include = [{ model: Vendor, attributes: ['id', 'regionId'], required: true }];
  const rows = await Inventory.findAll({ where, include });
  const filtered = regionId ? rows.filter((r) => r.Vendor.regionId === regionId) : rows;
  return filtered.reduce((sum, r) => sum + r.quantity, 0);
}

async function computeDemandForProduct(productId, { regionId } = {}) {
  const retailerWhere = regionId ? { regionId } : undefined;
  const retailerInclude = retailerWhere
    ? [{ model: Retailer, where: retailerWhere, attributes: [], required: true }]
    : [];

  const [searches, requirementRequests, requestAgg, orderAttempts, completedOrders, stock] =
    await Promise.all([
      SearchHistory.count({ where: { productId }, include: retailerInclude }),
      DemandRequest.count({ where: { productId }, include: retailerInclude }),
      DemandRequest.sum('requiredQty', { where: { productId }, include: retailerInclude }),
      Order.count({ where: { productId }, include: retailerInclude }),
      Order.count({
        where: { productId, status: 'COMPLETED' },
        include: retailerInclude,
      }),
      nearbyStock(productId, regionId),
    ]);

  const totalRequestedQty = requestAgg || 0;
  const hasUnmetDemand = (searches > 0 || requirementRequests > 0) && stock === 0;
  const stockBelowDemand = stock > 0 && totalRequestedQty > stock;
  const availabilityGapBonus = hasUnmetDemand ? 20 : stockBelowDemand ? 10 : 0;

  const raw =
    WEIGHTS.search * searches +
    WEIGHTS.requirementRequest * requirementRequests +
    WEIGHTS.orderAttempt * orderAttempts +
    WEIGHTS.completedOrder * completedOrders +
    availabilityGapBonus;

  const demandScore = Math.max(0, Math.min(100, Math.round((raw / RAW_SCORE_CAP) * 100)));

  return {
    productId,
    searches,
    requirementRequests,
    totalRequestedQty,
    orderAttempts,
    completedOrders,
    nearbyStock: stock,
    demandScore,
    classification: classify(demandScore),
  };
}

async function getTopProducts(limit = 10, { regionId } = {}) {
  const products = await Product.findAll({ attributes: ['id', 'name', 'variety', 'unit'] });
  const scored = await Promise.all(
    products.map(async (p) => ({
      product: p,
      ...(await computeDemandForProduct(p.id, { regionId })),
    }))
  );
  return scored.sort((a, b) => b.demandScore - a.demandScore).slice(0, limit);
}

module.exports = { computeDemandForProduct, getTopProducts, classify, WEIGHTS, RAW_SCORE_CAP };
