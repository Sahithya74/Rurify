const { Region, Category } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const listRegions = asyncHandler(async (req, res) => {
  const regions = await Region.findAll({ order: [['name', 'ASC']] });
  res.json({ success: true, data: regions });
});

const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  res.json({ success: true, data: categories });
});

module.exports = { listRegions, listCategories };
