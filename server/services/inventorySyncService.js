const { Op } = require('sequelize');
const {
  Inventory,
  InventoryUpdateLog,
  RetailerVendorConnection,
  Retailer,
  Product,
  Vendor,
} = require('../models');
const { notifyMany } = require('./notificationService');

const TRACKED_FIELDS = ['quantity', 'price', 'moq', 'freshness', 'deliveryAvailable', 'isActive'];

async function connectedRetailerUserIds(vendorId) {
  const connections = await RetailerVendorConnection.findAll({
    where: { vendorId },
    include: [{ model: Retailer }],
  });
  return connections.map((c) => c.Retailer?.userId).filter(Boolean);
}

/**
 * Records a diff for every tracked field that changed, and notifies
 * connected retailers so their dashboards reflect the change on next poll.
 * This is the core of Section 5's "automatic inventory synchronization".
 */
async function logInventoryChange(inventoryRow, beforeJson, changeType) {
  const vendor = await Vendor.findByPk(inventoryRow.vendorId);
  const product = await Product.findByPk(inventoryRow.productId);
  const retailerUserIds = await connectedRetailerUserIds(inventoryRow.vendorId);

  if (changeType === 'CREATED') {
    await InventoryUpdateLog.create({
      inventoryId: inventoryRow.id,
      field: 'created',
      oldValue: null,
      newValue: 'listed',
      changeType: 'CREATED',
    });
    if (retailerUserIds.length > 0) {
      await notifyMany(retailerUserIds, {
        type: 'NEW_PRODUCT',
        title: 'New product available from your supplier',
        message: `${vendor?.businessName || 'A supplier'} added ${product?.name}${product?.variety ? ' — ' + product.variety : ''} (${inventoryRow.quantity} ${product?.unit}).`,
        relatedEntityType: 'Inventory',
        relatedEntityId: inventoryRow.id,
      });
    }
    return;
  }

  if (!beforeJson) return;

  const changedFields = TRACKED_FIELDS.filter((f) => String(beforeJson[f]) !== String(inventoryRow[f]));
  if (changedFields.length === 0) return;

  await Promise.all(
    changedFields.map((field) =>
      InventoryUpdateLog.create({
        inventoryId: inventoryRow.id,
        field,
        oldValue: String(beforeJson[field]),
        newValue: String(inventoryRow[field]),
        changeType: inventoryRow.isActive ? 'UPDATED' : 'DEACTIVATED',
      })
    )
  );

  if (retailerUserIds.length === 0) return;

  if (changedFields.includes('quantity')) {
    await notifyMany(retailerUserIds, {
      type: 'STOCK_UPDATE',
      title: `${product?.name} stock updated`,
      message: `${vendor?.businessName}: ${beforeJson.quantity} -> ${inventoryRow.quantity} ${product?.unit}.`,
      relatedEntityType: 'Inventory',
      relatedEntityId: inventoryRow.id,
    });
  }
  if (changedFields.includes('price')) {
    await notifyMany(retailerUserIds, {
      type: 'PRICE_UPDATE',
      title: `${product?.name} price updated`,
      message: `${vendor?.businessName}: ₹${beforeJson.price} -> ₹${inventoryRow.price} per ${product?.unit}.`,
      relatedEntityType: 'Inventory',
      relatedEntityId: inventoryRow.id,
    });
  }
}

/** Powers the retailer dashboard's polling-based sync feed. */
async function getInventoryUpdatesSince(retailerId, since) {
  const connections = await RetailerVendorConnection.findAll({ where: { retailerId } });
  const vendorIds = connections.map((c) => c.vendorId);
  if (vendorIds.length === 0) return [];

  const sinceDate = since ? new Date(since) : new Date(0);
  const logs = await InventoryUpdateLog.findAll({
    where: { createdAt: { [Op.gt]: sinceDate } },
    include: [
      {
        model: Inventory,
        where: { vendorId: { [Op.in]: vendorIds } },
        include: [Product, Vendor],
        required: true,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  return logs;
}

module.exports = { logInventoryChange, getInventoryUpdatesSince, connectedRetailerUserIds };
