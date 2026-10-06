const { Op, fn, col, literal } = require('sequelize');
const { Product, SearchHistory, DemandRequest, Order, Inventory, Retailer, Vendor } = require('../models');

/**
 * Rule-based "Demand Intelligence Score" (0-100). Explicitly NOT machine
 * learning — a transparent formula over raw platform activity, documented in
 * docs/architecture.md, so a real model can replace scoreFromCounts() later
 * without changing the API shape.
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

/**
 * A region's share of all retailers. Regional activity is divided by this
 * share before scoring, so a small region with intense demand isn't scored
 * LOW just for being small. Platform-wide scoring uses a share of 1.
 */
async function regionShare(regionId) {
  if (!regionId) return 1;
  const [inRegion, total] = await Promise.all([Retailer.count({ where: { regionId } }), Retailer.count()]);
  return total > 0 ? inRegion / total : 0;
}

function scoreFromCounts(productId, counts, share) {
  const { searches, requirementRequests, totalRequestedQty, orderAttempts, completedOrders, nearbyStock } = counts;

  const hasUnmetDemand = (searches > 0 || requirementRequests > 0) && nearbyStock === 0;
  const stockBelowDemand = nearbyStock > 0 && totalRequestedQty > nearbyStock;
  const availabilityGapBonus = hasUnmetDemand ? 20 : stockBelowDemand ? 10 : 0;

  const activity =
    WEIGHTS.search * searches +
    WEIGHTS.requirementRequest * requirementRequests +
    WEIGHTS.orderAttempt * orderAttempts +
    WEIGHTS.completedOrder * completedOrders;

  const raw = share > 0 ? activity / share + availabilityGapBonus : 0;
  const demandScore = Math.max(0, Math.min(100, Math.round((raw / RAW_SCORE_CAP) * 100)));

  // rawScore is uncapped; it only breaks ties between products both at 100.
  return { productId, ...counts, demandScore, rawScore: Math.round(raw), classification: classify(demandScore) };
}

const byDemand = (a, b) => b.demandScore - a.demandScore || b.rawScore - a.rawScore;

const byProduct = (rows, key) => new Map(rows.map((r) => [r.productId, Number(r[key]) || 0]));

/**
 * Demand for many products in one pass: five GROUP BY queries total,
 * regardless of catalog size. Returns Map<productId, demand>.
 */
async function computeDemandForProducts(productIds, { regionId, share } = {}) {
  const scopeShare = share ?? (await regionShare(regionId));

  const productFilter = productIds ? { productId: { [Op.in]: productIds } } : { productId: { [Op.ne]: null } };
  let retailerFilter = {};
  let vendorFilter = {};
  if (regionId) {
    const [retailers, vendors] = await Promise.all([
      Retailer.findAll({ where: { regionId }, attributes: ['id'], raw: true }),
      Vendor.findAll({ where: { regionId }, attributes: ['id'], raw: true }),
    ]);
    retailerFilter = { retailerId: { [Op.in]: retailers.map((r) => r.id) } };
    vendorFilter = { vendorId: { [Op.in]: vendors.map((v) => v.id) } };
  }

  const grouped = { group: ['productId'], raw: true };
  const [searchRows, requestRows, orderRows, stockRows] = await Promise.all([
    SearchHistory.findAll({
      attributes: ['productId', [fn('COUNT', col('id')), 'n']],
      where: { ...productFilter, ...retailerFilter },
      ...grouped,
    }),
    DemandRequest.findAll({
      attributes: ['productId', [fn('COUNT', col('id')), 'n'], [fn('SUM', col('requiredQty')), 'qty']],
      where: { ...productFilter, ...retailerFilter },
      ...grouped,
    }),
    Order.findAll({
      attributes: [
        'productId',
        [fn('COUNT', col('id')), 'n'],
        [literal("SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)"), 'done'],
      ],
      where: { ...productFilter, ...retailerFilter },
      ...grouped,
    }),
    Inventory.findAll({
      attributes: ['productId', [fn('SUM', col('quantity')), 'qty']],
      where: { ...productFilter, ...vendorFilter, isActive: true },
      ...grouped,
    }),
  ]);

  const searches = byProduct(searchRows, 'n');
  const requests = byProduct(requestRows, 'n');
  const requestedQty = byProduct(requestRows, 'qty');
  const orders = byProduct(orderRows, 'n');
  const completed = byProduct(orderRows, 'done');
  const stock = byProduct(stockRows, 'qty');

  const ids = productIds || (await Product.findAll({ attributes: ['id'], raw: true })).map((p) => p.id);
  const result = new Map();
  for (const id of ids) {
    result.set(
      id,
      scoreFromCounts(
        id,
        {
          searches: searches.get(id) || 0,
          requirementRequests: requests.get(id) || 0,
          totalRequestedQty: requestedQty.get(id) || 0,
          orderAttempts: orders.get(id) || 0,
          completedOrders: completed.get(id) || 0,
          nearbyStock: stock.get(id) || 0,
        },
        scopeShare
      )
    );
  }
  return result;
}

async function computeDemandForProduct(productId, opts = {}) {
  const map = await computeDemandForProducts([Number(productId)], opts);
  return map.get(Number(productId));
}

async function getTopProducts(limit = 10, { regionId } = {}) {
  const products = await Product.findAll({ attributes: ['id', 'name', 'variety', 'unit'] });
  const demand = await computeDemandForProducts(null, { regionId });
  return products
    .map((p) => ({ product: p, ...demand.get(p.id) }))
    .sort(byDemand)
    .slice(0, limit);
}

module.exports = {
  computeDemandForProduct,
  computeDemandForProducts,
  getTopProducts,
  byDemand,
  regionShare,
  classify,
  WEIGHTS,
  RAW_SCORE_CAP,
};
