const {
  DemandRequest,
  VendorResponse,
  Retailer,
  Vendor,
  Product,
  Category,
  Inventory,
} = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { notifyMany, notify } = require('../services/notificationService');
const { logAction } = require('../services/auditService');
const { computeDemandForProduct } = require('../services/demandService');
const { maybeSendDemandAlert } = require('../services/demandAlertService');

const createRequirement = asyncHandler(async (req, res) => {
  const retailer = await Retailer.findOne({ where: { userId: req.user.id } });
  if (!retailer) throw new ApiError(404, 'Retailer profile not found');

  const product = await Product.findByPk(req.body.productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const requirement = await DemandRequest.create({
    retailerId: retailer.id,
    productId: product.id,
    requiredQty: req.body.requiredQty,
    requiredDate: req.body.requiredDate || null,
    preferredPrice: req.body.preferredPrice || null,
    notes: req.body.notes || null,
  });

  const carryingVendors = await Vendor.findAll({
    include: [{ model: Inventory, where: { productId: product.id }, required: true }],
  });
  const vendorUserIds =
    carryingVendors.length > 0
      ? carryingVendors.map((v) => v.userId)
      : (await Vendor.findAll({ attributes: ['userId'] })).map((v) => v.userId);

  await notifyMany(vendorUserIds, {
    type: 'NEW_REQUIREMENT',
    title: `New demand request: ${product.name}`,
    message: `${retailer.shopName} requires ${req.body.requiredQty} ${product.unit} of ${product.name}${product.variety ? ' — ' + product.variety : ''}.`,
    relatedEntityType: 'DemandRequest',
    relatedEntityId: requirement.id,
  });

  await maybeSendDemandAlert(product);
  await logAction(req.user.id, 'REQUIREMENT_CREATE', 'DemandRequest', requirement.id);

  res.status(201).json({ success: true, data: requirement });
});

const listRequirements = asyncHandler(async (req, res) => {
  if (req.user.role === 'retailer') {
    const retailer = await Retailer.findOne({ where: { userId: req.user.id } });
    if (!retailer) throw new ApiError(404, 'Retailer profile not found');
    const requirements = await DemandRequest.findAll({
      where: { retailerId: retailer.id },
      include: [{ model: Product, include: [Category] }, VendorResponse],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, data: requirements });
  }

  if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    if (!vendor) throw new ApiError(404, 'Vendor profile not found');

    // Vendors see all pending demand (not just products they already carry) so
    // unmet demand with zero current suppliers still surfaces as a stocking opportunity.
    const requirements = await DemandRequest.findAll({
      where: { status: 'PENDING' },
      include: [
        { model: Product, include: [Category] },
        { model: Retailer, attributes: ['id', 'shopName'] },
        VendorResponse,
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ success: true, data: requirements });
  }

  throw new ApiError(403, 'Not available for admin via this endpoint');
});

const getRequirement = asyncHandler(async (req, res) => {
  const requirement = await DemandRequest.findByPk(req.params.id, {
    include: [{ model: Product, include: [Category] }, Retailer, VendorResponse],
  });
  if (!requirement) throw new ApiError(404, 'Requirement not found');
  res.json({ success: true, data: requirement });
});

const respondToRequirement = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found');

  const requirement = await DemandRequest.findByPk(req.params.id, { include: [Retailer, Product] });
  if (!requirement) throw new ApiError(404, 'Requirement not found');

  const [response] = await VendorResponse.findOrCreate({
    where: { demandRequestId: requirement.id, vendorId: vendor.id },
    defaults: { response: req.body.response, notes: req.body.notes || null },
  });
  if (response.response !== req.body.response || req.body.notes) {
    await response.update({ response: req.body.response, notes: req.body.notes || null });
  }

  if (req.body.response === 'AVAILABLE' && requirement.Retailer) {
    await notify(requirement.Retailer.userId, {
      type: 'REQUIREMENT_RESPONSE',
      title: `${vendor.businessName} has ${requirement.Product.name} available`,
      message: `${vendor.businessName} responded to your requirement for ${requirement.Product.name}.`,
      relatedEntityType: 'DemandRequest',
      relatedEntityId: requirement.id,
    });
  }

  await logAction(req.user.id, 'REQUIREMENT_RESPOND', 'DemandRequest', requirement.id, req.body);

  res.json({ success: true, data: response });
});

/** Aggregates all pending requests for a product — the "8 retailers, 42kg, 0 stock" view. */
const getAggregateForProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const requirements = await DemandRequest.findAll({
    where: { productId: product.id, status: 'PENDING' },
  });

  const retailerIds = new Set(requirements.map((r) => r.retailerId));
  const totalRequestedQty = requirements.reduce((sum, r) => sum + r.requiredQty, 0);

  const activeInventory = await Inventory.findAll({ where: { productId: product.id, isActive: true } });
  const nearbyStock = activeInventory.reduce((sum, i) => sum + i.quantity, 0);

  const demand = await computeDemandForProduct(product.id);

  res.json({
    success: true,
    data: {
      product,
      retailersRequesting: retailerIds.size,
      totalRequestedQty,
      nearbyStock,
      demandScore: demand.demandScore,
      demandClassification: demand.classification,
    },
  });
});

module.exports = {
  createRequirement,
  listRequirements,
  getRequirement,
  respondToRequirement,
  getAggregateForProduct,
};
