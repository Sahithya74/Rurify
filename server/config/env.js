require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const INSECURE_SECRETS = [
  undefined,
  '',
  'dev-only-insecure-secret-change-me',
  'change-this-to-a-long-random-string-in-production',
];
if (process.env.NODE_ENV === 'production' && INSECURE_SECRETS.includes(process.env.JWT_SECRET)) {
  throw new Error('JWT_SECRET must be set to a strong, unique value in production');
}

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './database/dev.sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'rurify',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  seedDemoPassword: process.env.SEED_DEMO_PASSWORD || 'Demo@1234',
};
