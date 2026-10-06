const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = { signToken, verifyToken };
