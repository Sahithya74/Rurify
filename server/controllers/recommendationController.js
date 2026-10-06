const { Vendor } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getRecommendationsForVendor } = require('../services/recommendationService');

const listRecommendations = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
  if (!vendor) throw new ApiError(404, 'Vendor profile not found');
  const recommendations = await getRecommendationsForVendor(vendor);
  res.json({ success: true, data: recommendations });
});

module.exports = { listRecommendations };
