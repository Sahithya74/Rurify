const { Op } = require('sequelize');
const { Vendor, Notification, DemandRequest } = require('../models');
const { computeDemandForProduct } = require('./demandService');
const { notifyMany } = require('./notificationService');

const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Sends an in-app DEMAND_ALERT to every vendor when a product's demand is
 * HIGH/VERY_HIGH and nearby supply can't cover what retailers have asked for.
 * At most one alert per product per 24h. Email/SMS/WhatsApp channels would
 * hang off notifyMany() later; only in-app delivery exists today.
 */
async function maybeSendDemandAlert(product) {
  const demand = await computeDemandForProduct(product.id);
  const isHigh = demand.classification === 'HIGH' || demand.classification === 'VERY_HIGH';
  if (!isHigh || demand.nearbyStock >= demand.totalRequestedQty) return false;

  const recent = await Notification.findOne({
    where: {
      type: 'DEMAND_ALERT',
      relatedEntityType: 'Product',
      relatedEntityId: product.id,
      createdAt: { [Op.gt]: new Date(Date.now() - ALERT_COOLDOWN_MS) },
    },
  });
  if (recent) return false;

  const pending = await DemandRequest.findAll({
    where: { productId: product.id, status: 'PENDING' },
    attributes: ['retailerId', 'requiredQty'],
  });
  const retailerCount = new Set(pending.map((r) => r.retailerId)).size;
  const pendingQty = pending.reduce((sum, r) => sum + r.requiredQty, 0);
  const supplyLabel = demand.nearbyStock === 0 ? 'none' : `${demand.nearbyStock} ${product.unit} (low)`;

  const vendors = await Vendor.findAll({ attributes: ['userId'] });
  await notifyMany(
    vendors.map((v) => v.userId),
    {
      type: 'DEMAND_ALERT',
      title: `Demand alert: ${product.name}`,
      message: `${retailerCount} retailers have requested ${product.name} (${pendingQty} ${product.unit} total). Current nearby supply: ${supplyLabel}. Demand: ${demand.classification.replace('_', ' ')} (score ${demand.demandScore}). Consider stocking ${product.name}.`,
      relatedEntityType: 'Product',
      relatedEntityId: product.id,
    }
  );
  return true;
}

module.exports = { maybeSendDemandAlert };
