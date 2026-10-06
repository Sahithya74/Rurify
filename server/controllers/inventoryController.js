const { Inventory, Product, Category, Vendor, Retailer } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { logInventoryChange, getInventoryUpdatesSince } = require('../services/inventorySyncService');
const { importCsvForVendor } = require('../services/csvImportService');
const { logAction } = require('../services/auditService');

async function getOwnVendor(userId) {
  const vendor = await Vendor.findOne({ where: { userId } });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found');
  return vendor;
}

const listMyInventory = asyncHandler(async (req, res) => {
  const vendor = await getOwnVendor(req.user.id);
  const inventory = await Inventory.findAll({
    where: { vendorId: vendor.id },
    include: [{ model: Product, include: [Category] }],
    order: [['updatedAt', 'DESC']],
  });
  res.json({ success: true, data: inventory });
});

const createInventory = asyncHandler(async (req, res) => {
  const vendor = await getOwnVendor(req.user.id);
  const {
    productName,
    categoryId,
    variety = '',
    description,
    imageUrl,
    unit,
    quantity,
    price,
    moq,
    freshness,
    expiryDate,
    deliveryAvailable = true,
  } = req.body;

  const [product] = await Product.findOrCreate({
    where: { name: productName, variety },
    defaults: { categoryId, description, imageUrl, unit },
  });

  const existing = await Inventory.findOne({ where: { productId: product.id, vendorId: vendor.id } });
  if (existing) {
    throw new ApiError(409, 'You already have a listing for this product and variety. Edit it instead.');
  }

  const inventory = await Inventory.create({
    productId: product.id,
    vendorId: vendor.id,
    quantity,
    price,
    moq,
    freshness,
    expiryDate: expiryDate || null,
    deliveryAvailable,
  });

  await logInventoryChange(inventory, null, 'CREATED');
  await logAction(req.user.id, 'INVENTORY_CREATE', 'Inventory', inventory.id);

  const full = await Inventory.findByPk(inventory.id, { include: [{ model: Product, include: [Category] }] });
  res.status(201).json({ success: true, data: full });
});

const updateInventory = asyncHandler(async (req, res) => {
  const vendor = await getOwnVendor(req.user.id);
  const inventory = await Inventory.findByPk(req.params.id);
  if (!inventory) throw new ApiError(404, 'Inventory record not found');
  if (inventory.vendorId !== vendor.id) {
    throw new ApiError(403, 'You can only edit your own inventory');
  }

  const before = inventory.toJSON();
  const allowed = ['quantity', 'price', 'moq', 'freshness', 'expiryDate', 'deliveryAvailable', 'isActive'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  await inventory.update(updates);
  await logInventoryChange(inventory, before, inventory.isActive ? 'UPDATED' : 'DEACTIVATED');
  await logAction(req.user.id, 'INVENTORY_UPDATE', 'Inventory', inventory.id, updates);

  const full = await Inventory.findByPk(inventory.id, { include: [{ model: Product, include: [Category] }] });
  res.json({ success: true, data: full });
});

const deactivateInventory = asyncHandler(async (req, res) => {
  const vendor = await getOwnVendor(req.user.id);
  const inventory = await Inventory.findByPk(req.params.id);
  if (!inventory) throw new ApiError(404, 'Inventory record not found');
  if (inventory.vendorId !== vendor.id) {
    throw new ApiError(403, 'You can only edit your own inventory');
  }
  const before = inventory.toJSON();
  await inventory.update({ isActive: false });
  await logInventoryChange(inventory, before, 'DEACTIVATED');
  await logAction(req.user.id, 'INVENTORY_DEACTIVATE', 'Inventory', inventory.id);
  res.json({ success: true, data: { id: inventory.id, isActive: false } });
});

const importInventoryCsv = asyncHandler(async (req, res) => {
  const vendor = await getOwnVendor(req.user.id);
  if (!req.file) throw new ApiError(400, 'A CSV file is required (field name: file)');

  const result = await importCsvForVendor(req.file.buffer, vendor.id);
  await logAction(req.user.id, 'INVENTORY_CSV_IMPORT', 'Vendor', vendor.id, result.summary);
  res.json({ success: true, data: result });
});

/** Polling endpoint powering retailer dashboards' automatic sync feed. */
const getSyncFeed = asyncHandler(async (req, res) => {
  const retailer = await Retailer.findOne({ where: { userId: req.user.id } });
  if (!retailer) throw new ApiError(404, 'Retailer profile not found');

  const updates = await getInventoryUpdatesSince(retailer.id, req.query.since);
  res.json({
    success: true,
    data: updates.map((log) => ({
      id: log.id,
      field: log.field,
      oldValue: log.oldValue,
      newValue: log.newValue,
      changeType: log.changeType,
      productName: log.Inventory?.Product?.name,
      vendorName: log.Inventory?.Vendor?.businessName,
      createdAt: log.createdAt,
    })),
    serverTime: new Date().toISOString(),
  });
});

module.exports = {
  listMyInventory,
  createInventory,
  updateInventory,
  deactivateInventory,
  importInventoryCsv,
  getSyncFeed,
};
