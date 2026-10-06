const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const sequelize = require('./config/db');
require('./models');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const referenceRoutes = require('./routes/referenceRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const requirementRoutes = require('./routes/requirementRoutes');
const orderRoutes = require('./routes/orderRoutes');
const demandRoutes = require('./routes/demandRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use('/api/auth', authRoutes);
app.use('/api', referenceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/demand', demandRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Rurify API listening on port ${env.port} (${env.nodeEnv}, db=${env.db.dialect})`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;
