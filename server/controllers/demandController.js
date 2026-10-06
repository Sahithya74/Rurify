const { Region } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { computeDemandForProduct, getTopProducts } = require('../services/demandService');

const topProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const regionId = req.query.regionId ? Number(req.query.regionId) : undefined;
  const results = await getTopProducts(limit, { regionId });
  res.json({
    success: true,
    data: results.map((r) => ({
      productId: r.product.id,
      name: r.product.name,
      variety: r.product.variety,
      unit: r.product.unit,
      searches: r.searches,
      requirementRequests: r.requirementRequests,
      totalRequestedQty: r.totalRequestedQty,
      orderAttempts: r.orderAttempts,
      completedOrders: r.completedOrders,
      nearbyStock: r.nearbyStock,
      demandScore: r.demandScore,
      classification: r.classification,
    })),
  });
});

const demandForProduct = asyncHandler(async (req, res) => {
  const regionId = req.query.regionId ? Number(req.query.regionId) : undefined;
  const result = await computeDemandForProduct(Number(req.params.id), { regionId });
  res.json({ success: true, data: result });
});

const regionalDemand = asyncHandler(async (req, res) => {
  const regions = await Region.findAll();
  const data = await Promise.all(
    regions.map(async (region) => ({
      region: { id: region.id, name: region.name, state: region.state, lat: region.lat, lng: region.lng },
      topProducts: (await getTopProducts(5, { regionId: region.id }))
        .filter((r) => r.demandScore > 0)
        .map((r) => ({
          productId: r.product.id,
          name: r.product.name,
          demandScore: r.demandScore,
          classification: r.classification,
          nearbyStock: r.nearbyStock,
        })),
    }))
  );
  res.json({ success: true, data });
});

module.exports = { topProducts, demandForProduct, regionalDemand };
