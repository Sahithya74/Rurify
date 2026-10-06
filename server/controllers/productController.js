const { Op } = require('sequelize');
const { Product, Category, Inventory, Vendor, Retailer, SearchHistory } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { rankSuppliers } = require('../services/matchingService');

const listProducts = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.categoryId) where.categoryId = req.query.categoryId;
  const products = await Product.findAll({
    where,
    include: [Category],
    order: [['name', 'ASC']],
  });
  res.json({ success: true, data: products });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, { include: [Category] });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: product });
});

/** Retailer-facing search: finds matching products and a quick supply snapshot for each. */
const searchProducts = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const where = {};
  if (q) {
    where[Op.or] = [{ name: { [Op.like]: `%${q}%` } }, { variety: { [Op.like]: `%${q}%` } }];
  }
  if (req.query.categoryId) where.categoryId = req.query.categoryId;

  const products = await Product.findAll({ where, include: [Category], order: [['name', 'ASC']] });

  let retailer = null;
  if (req.user.role === 'retailer') {
    retailer = await Retailer.findOne({ where: { userId: req.user.id } });
    await SearchHistory.create({
      retailerId: retailer?.id || null,
      query: q || '(browse)',
      productId: products.length === 1 ? products[0].id : null,
      resultsCount: products.length,
    });
  }

  const results = await Promise.all(
    products.map(async (product) => {
      const inventoryRows = await Inventory.findAll({
        where: { productId: product.id, isActive: true, quantity: { [Op.gt]: 0 } },
        include: [Vendor],
      });

      let bestMatchScore = null;
      let nearestDistanceKm = null;
      if (retailer && inventoryRows.length > 0) {
        const ranked = rankSuppliers(inventoryRows, retailer, Number(req.query.requestedQty) || undefined);
        if (ranked.length > 0) {
          bestMatchScore = ranked[0].matchScore;
          nearestDistanceKm = Math.min(...ranked.map((r) => r.distanceKm));
        }
      }

      const prices = inventoryRows.map((r) => r.price);
      return {
        product,
        supplierCount: inventoryRows.length,
        minPrice: prices.length ? Math.min(...prices) : null,
        bestMatchScore,
        nearestDistanceKm,
        available: inventoryRows.length > 0,
      };
    })
  );

  res.json({ success: true, data: results });
});

/** Ranked supplier list for one product, using the transparent match-score algorithm. */
const getSuppliersForProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.user.role !== 'retailer') {
    throw new ApiError(403, 'Only retailers can view ranked suppliers');
  }
  const retailer = await Retailer.findOne({ where: { userId: req.user.id } });
  if (!retailer) throw new ApiError(404, 'Retailer profile not found');

  const where = { productId: product.id, isActive: true };
  if (req.query.deliveryOnly === 'true') where.deliveryAvailable = true;
  if (req.query.maxPrice) where.price = { [Op.lte]: Number(req.query.maxPrice) };

  const inventoryRows = await Inventory.findAll({ where, include: [Vendor] });
  let ranked = rankSuppliers(inventoryRows, retailer, Number(req.query.requestedQty) || undefined);

  if (req.query.maxDistance) {
    ranked = ranked.filter((r) => r.distanceKm <= Number(req.query.maxDistance));
  }

  res.json({
    success: true,
    data: {
      product,
      suppliers: ranked.map((r) => ({
        inventoryId: r.inventory.id,
        vendorId: r.inventory.vendorId,
        vendorName: r.inventory.Vendor.businessName,
        distanceKm: r.distanceKm,
        quantity: r.inventory.quantity,
        unit: product.unit,
        price: r.inventory.price,
        moq: r.inventory.moq,
        freshness: r.inventory.freshness,
        deliveryAvailable: r.inventory.deliveryAvailable,
        lastUpdated: r.inventory.updatedAt,
        matchScore: r.matchScore,
        breakdown: r.breakdown,
      })),
      unavailable: ranked.length === 0,
    },
  });
});

module.exports = { listProducts, getProduct, searchProducts, getSuppliersForProduct };
