const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentication required');
    }
    const payload = verifyToken(token);
    const user = await User.findByPk(payload.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid or inactive account');
    }
    req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};

module.exports = { authenticate, authorize };
