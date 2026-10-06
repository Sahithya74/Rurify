const bcrypt = require('bcryptjs');
const { sequelize, User, Retailer, Vendor } = require('../models');
const { signToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');

const register = asyncHandler(async (req, res) => {
  const { email, password, name, phone, role, address, lat, lng, regionId, shopName, businessName } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await sequelize.transaction(async (t) => {
    const user = await User.create({ email, passwordHash, name, phone, role }, { transaction: t });

    if (role === 'retailer') {
      await Retailer.create(
        { userId: user.id, shopName, address, lat, lng, regionId, verified: false },
        { transaction: t }
      );
    } else {
      await Vendor.create(
        { userId: user.id, businessName, address, lat, lng, regionId, verified: false },
        { transaction: t }
      );
    }
    return user;
  });

  await logAction(result.id, 'REGISTER', 'User', result.id);

  const token = signToken(result);
  res.status(201).json({
    success: true,
    data: { token, user: { id: result.id, email: result.email, name: result.name, role: result.role } },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Invalid email or password');

  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');

  await logAction(user.id, 'LOGIN', 'User', user.id);

  const token = signToken(user);
  res.json({
    success: true,
    data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } },
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'email', 'name', 'phone', 'role', 'isActive'],
    include: [
      { model: Retailer, required: false },
      { model: Vendor, required: false },
    ],
  });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

module.exports = { register, login, me };
