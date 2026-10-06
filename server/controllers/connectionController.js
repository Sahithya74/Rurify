const { RetailerVendorConnection, Retailer, Vendor, Region } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const listMyConnections = asyncHandler(async (req, res) => {
  if (req.user.role === 'retailer') {
    const retailer = await Retailer.findOne({ where: { userId: req.user.id } });
    if (!retailer) throw new ApiError(404, 'Retailer profile not found');
    const connections = await RetailerVendorConnection.findAll({
      where: { retailerId: retailer.id },
      include: [{ model: Vendor, include: [Region] }],
    });
    return res.json({ success: true, data: connections.map((c) => c.Vendor) });
  }

  if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    if (!vendor) throw new ApiError(404, 'Vendor profile not found');
    const connections = await RetailerVendorConnection.findAll({
      where: { vendorId: vendor.id },
      include: [{ model: Retailer, include: [Region] }],
    });
    return res.json({ success: true, data: connections.map((c) => c.Retailer) });
  }

  throw new ApiError(403, 'Not available for this role');
});

const connectToVendor = asyncHandler(async (req, res) => {
  const retailer = await Retailer.findOne({ where: { userId: req.user.id } });
  if (!retailer) throw new ApiError(404, 'Retailer profile not found');

  const vendor = await Vendor.findByPk(req.body.vendorId);
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  const [connection, created] = await RetailerVendorConnection.findOrCreate({
    where: { retailerId: retailer.id, vendorId: vendor.id },
  });

  res.status(created ? 201 : 200).json({ success: true, data: connection, alreadyConnected: !created });
});

module.exports = { listMyConnections, connectToVendor };
