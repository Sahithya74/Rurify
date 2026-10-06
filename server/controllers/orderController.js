const { Order, OrderStatusHistory, Inventory, Product, Vendor, Retailer, RetailerVendorConnection } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { notify } = require('../services/notificationService');
const { logAction } = require('../services/auditService');
const { logInventoryChange } = require('../services/inventorySyncService');
const { assertValidTransition } = require('../services/orderWorkflowService');

const createOrder = asyncHandler(async (req, res) => {
  const retailer = await Retailer.findOne({ where: { userId: req.user.id } });
  if (!retailer) throw new ApiError(404, 'Retailer profile not found');

  const inventory = await Inventory.findByPk(req.body.inventoryId, { include: [Product, Vendor] });
  if (!inventory || !inventory.isActive) throw new ApiError(404, 'This product is no longer available');

  const { quantity } = req.body;
  if (quantity < inventory.moq) {
    throw new ApiError(400, `Minimum order quantity is ${inventory.moq} ${inventory.Product.unit}`);
  }
  if (quantity > inventory.quantity) {
    throw new ApiError(400, `Only ${inventory.quantity} ${inventory.Product.unit} available`);
  }

  const totalPrice = Math.round(quantity * inventory.price * 100) / 100;

  const order = await Order.create({
    retailerId: retailer.id,
    vendorId: inventory.vendorId,
    inventoryId: inventory.id,
    productId: inventory.productId,
    quantity,
    pricePerUnit: inventory.price,
    totalPrice,
    status: 'PENDING',
  });
  await OrderStatusHistory.create({ orderId: order.id, status: 'PENDING', changedBy: req.user.id });

  await RetailerVendorConnection.findOrCreate({
    where: { retailerId: retailer.id, vendorId: inventory.vendorId },
  });

  await notify(inventory.Vendor.userId, {
    type: 'NEW_ORDER',
    title: `New order: ${inventory.Product.name}`,
    message: `${retailer.shopName} ordered ${quantity} ${inventory.Product.unit} of ${inventory.Product.name}.`,
    relatedEntityType: 'Order',
    relatedEntityId: order.id,
  });

  await logAction(req.user.id, 'ORDER_CREATE', 'Order', order.id);

  res.status(201).json({ success: true, data: order });
});

const listOrders = asyncHandler(async (req, res) => {
  const where = {};
  if (req.user.role === 'retailer') {
    const retailer = await Retailer.findOne({ where: { userId: req.user.id } });
    if (!retailer) throw new ApiError(404, 'Retailer profile not found');
    where.retailerId = retailer.id;
  } else if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    if (!vendor) throw new ApiError(404, 'Vendor profile not found');
    where.vendorId = vendor.id;
  }

  const orders = await Order.findAll({
    where,
    include: [Product, Vendor, Retailer],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: orders });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [Product, Vendor, Retailer, OrderStatusHistory],
  });
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, data: order });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, { include: [Product, Vendor, Retailer, Inventory] });
  if (!order) throw new ApiError(404, 'Order not found');

  if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    if (!vendor || order.vendorId !== vendor.id) {
      throw new ApiError(403, 'You can only update your own orders');
    }
  } else if (req.user.role === 'retailer') {
    const retailer = await Retailer.findOne({ where: { userId: req.user.id } });
    if (!retailer || order.retailerId !== retailer.id) {
      throw new ApiError(403, 'You can only update your own orders');
    }
    if (req.body.status !== 'CANCELLED') {
      throw new ApiError(403, 'Retailers may only cancel orders');
    }
  } else {
    throw new ApiError(403, 'Not permitted');
  }

  assertValidTransition(order.status, req.body.status);

  if (req.body.status === 'COMPLETED' && order.Inventory) {
    const before = order.Inventory.toJSON();
    const newQty = Math.max(0, order.Inventory.quantity - order.quantity);
    await order.Inventory.update({ quantity: newQty });
    await logInventoryChange(order.Inventory, before, 'UPDATED');
  }

  await order.update({ status: req.body.status });
  await OrderStatusHistory.create({ orderId: order.id, status: req.body.status, changedBy: req.user.id });

  const notifyUserId = req.user.role === 'vendor' ? order.Retailer.userId : order.Vendor.userId;
  await notify(notifyUserId, {
    type: 'ORDER_STATUS',
    title: `Order #${order.id} is now ${req.body.status}`,
    message: `${order.Product.name} (${order.quantity} ${order.Product.unit}) — status updated to ${req.body.status}.`,
    relatedEntityType: 'Order',
    relatedEntityId: order.id,
  });

  await logAction(req.user.id, 'ORDER_STATUS_UPDATE', 'Order', order.id, { status: req.body.status });

  res.json({ success: true, data: order });
});

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus };
