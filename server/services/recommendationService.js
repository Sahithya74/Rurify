const { Product } = require('../models');
const { computeDemandForProducts, byDemand } = require('./demandService');

/**
 * Builds a stocking recommendation for one product, from real computed
 * demand data — never a hard-coded verdict.
 */
function buildRecommendation(product, demand) {
  const { demandScore, classification, searches, requirementRequests, nearbyStock, totalRequestedQty } =
    demand;

  if ((classification === 'HIGH' || classification === 'VERY_HIGH') && nearbyStock === 0) {
    return {
      productId: product.id,
      productName: `${product.name}${product.variety ? ' — ' + product.variety : ''}`,
      priority: 'HIGH_PRIORITY',
      demandScore,
      classification,
      reason: `${searches} local searches and ${requirementRequests} retailer requirement(s) (${totalRequestedQty} ${product.unit} requested) with zero nearby supply. High regional demand with no nearby availability.`,
    };
  }

  if ((classification === 'HIGH' || classification === 'VERY_HIGH') && nearbyStock > 0 && nearbyStock < totalRequestedQty) {
    return {
      productId: product.id,
      productName: `${product.name}${product.variety ? ' — ' + product.variety : ''}`,
      priority: 'CONSIDER_INCREASING',
      demandScore,
      classification,
      reason: `Demand is ${classification.replace('_', ' ')} (score ${demandScore}) but current nearby stock (${nearbyStock} ${product.unit}) is below requested quantity (${totalRequestedQty} ${product.unit}). Consider increasing inventory.`,
    };
  }

  if (classification === 'MEDIUM' && nearbyStock < totalRequestedQty) {
    return {
      productId: product.id,
      productName: `${product.name}${product.variety ? ' — ' + product.variety : ''}`,
      priority: 'CONSIDER_INCREASING',
      demandScore,
      classification,
      reason: `Moderate and growing demand (score ${demandScore}) with ${searches} searches recorded. Consider increasing inventory ahead of demand.`,
    };
  }

  return {
    productId: product.id,
    productName: `${product.name}${product.variety ? ' — ' + product.variety : ''}`,
    priority: 'NONE',
    demandScore,
    classification,
    reason: 'Current supply meets observed demand.',
  };
}

async function getRecommendationsForVendor(vendor) {
  const products = await Product.findAll({ attributes: ['id', 'name', 'variety', 'unit'] });
  const demandByProduct = await computeDemandForProducts(null, { regionId: vendor.regionId });
  const results = [];
  for (const product of products) {
    const demand = demandByProduct.get(product.id);
    const rec = buildRecommendation(product, demand);
    if (rec.priority !== 'NONE') results.push({ ...rec, rawScore: demand.rawScore });
  }
  return results.sort(byDemand);
}

module.exports = { buildRecommendation, getRecommendationsForVendor };
