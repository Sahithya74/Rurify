const { Product } = require('../models');
const { computeDemandForProduct } = require('./demandService');

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
  const results = [];
  for (const product of products) {
    const demand = await computeDemandForProduct(product.id, { regionId: vendor.regionId });
    const rec = buildRecommendation(product, demand);
    if (rec.priority !== 'NONE') results.push(rec);
  }
  return results.sort((a, b) => b.demandScore - a.demandScore);
}

module.exports = { buildRecommendation, getRecommendationsForVendor };
