/* eslint-disable no-console */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const {
  sequelize,
  User,
  Region,
  Retailer,
  Vendor,
  Category,
  Product,
  Inventory,
  InventoryUpdateLog,
  RetailerVendorConnection,
  SearchHistory,
  DemandRequest,
  Order,
  OrderStatusHistory,
  Notification,
  AuditLog,
} = require('../models');
const { maybeSendDemandAlert } = require('../services/demandAlertService');

if (env.db.dialect === 'mysql' && env.nodeEnv === 'production' && !process.env.FORCE_SEED) {
  console.error('Refusing to seed a production MySQL database without FORCE_SEED=1');
  process.exit(1);
}

const img = (name) => `https://placehold.co/600x400/png?text=${encodeURIComponent(name)}`;
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function run() {
  console.log('Resetting database (sqlite dev / explicit seed run)...');
  await sequelize.sync({ force: true });

  const passwordHash = await bcrypt.hash(env.seedDemoPassword, 10);
  const adminPasswordHash = await bcrypt.hash(env.seedAdminPassword, 10);

  // ---------------------------------------------------------------- Regions
  const regionDefs = [
    { name: 'Pune Rural', state: 'Maharashtra', lat: 18.52, lng: 73.85 },
    { name: 'Nashik', state: 'Maharashtra', lat: 20.0, lng: 73.78 },
    { name: 'Kolhapur', state: 'Maharashtra', lat: 16.7, lng: 74.24 },
    { name: 'Satara', state: 'Maharashtra', lat: 17.68, lng: 73.99 },
    { name: 'Solapur', state: 'Maharashtra', lat: 17.66, lng: 75.9 },
  ];
  const regions = await Region.bulkCreate(regionDefs, { returning: true });
  console.log(`Created ${regions.length} regions`);

  // -------------------------------------------------------------- Categories
  const categoryNames = ['Fruits', 'Vegetables', 'Herbs', 'Pantry', 'Dairy', 'Specialty Foods'];
  const categories = {};
  for (const name of categoryNames) {
    categories[name] = await Category.create({ name });
  }
  console.log(`Created ${categoryNames.length} categories`);

  // ---------------------------------------------------------------- Products
  const productDefs = [
    // Fruits
    { key: 'avocado', name: 'Avocado', category: 'Fruits', unit: 'kg' },
    { key: 'kiwi', name: 'Kiwi', category: 'Fruits', unit: 'kg' },
    { key: 'dragonfruit', name: 'Dragon Fruit', category: 'Fruits', unit: 'kg' },
    { key: 'strawberry', name: 'Strawberry', category: 'Fruits', unit: 'kg' },
    { key: 'blueberry', name: 'Blueberry', category: 'Fruits', unit: 'kg' },
    { key: 'pomegranate', name: 'Pomegranate', category: 'Fruits', unit: 'kg' },
    { key: 'banana', name: 'Banana', category: 'Fruits', unit: 'kg' },
    // Vegetables
    { key: 'celery', name: 'Celery', category: 'Vegetables', unit: 'kg' },
    { key: 'broccoli', name: 'Broccoli', category: 'Vegetables', unit: 'kg' },
    { key: 'zucchini', name: 'Zucchini', category: 'Vegetables', unit: 'kg' },
    { key: 'lettuce', name: 'Lettuce', category: 'Vegetables', unit: 'kg' },
    { key: 'asparagus', name: 'Asparagus', category: 'Vegetables', unit: 'kg' },
    { key: 'bellpepper', name: 'Bell Pepper', category: 'Vegetables', unit: 'kg' },
    { key: 'kale', name: 'Kale', category: 'Vegetables', unit: 'kg' },
    { key: 'eggplant', name: 'Eggplant', variety: 'Italian', category: 'Vegetables', unit: 'kg' },
    { key: 'tomato', name: 'Tomato', category: 'Vegetables', unit: 'kg' },
    // Herbs
    { key: 'oregano', name: 'Oregano', category: 'Herbs', unit: 'kg' },
    { key: 'basil', name: 'Basil', category: 'Herbs', unit: 'kg' },
    { key: 'rosemary', name: 'Rosemary', category: 'Herbs', unit: 'kg' },
    { key: 'mint', name: 'Mint', category: 'Herbs', unit: 'kg' },
    { key: 'coriander', name: 'Coriander', category: 'Herbs', unit: 'kg' },
    // Pantry
    { key: 'quinoa', name: 'Quinoa', category: 'Pantry', unit: 'kg' },
    { key: 'chiaseeds', name: 'Chia Seeds', category: 'Pantry', unit: 'kg' },
    { key: 'oliveoil', name: 'Olive Oil', category: 'Pantry', unit: 'L' },
    { key: 'pasta', name: 'Specialty Pasta', category: 'Pantry', unit: 'pack' },
    { key: 'rice', name: 'Rice', category: 'Pantry', unit: 'kg' },
    // Dairy
    { key: 'mozzarella', name: 'Mozzarella', category: 'Dairy', unit: 'pack' },
    { key: 'cheddar', name: 'Cheddar', category: 'Dairy', unit: 'pack' },
    { key: 'creamcheese', name: 'Cream Cheese', category: 'Dairy', unit: 'pack' },
    { key: 'greekyogurt', name: 'Greek Yogurt', category: 'Dairy', unit: 'pack' },
    { key: 'specialtybutter', name: 'Specialty Butter', category: 'Dairy', unit: 'pack' },
    { key: 'paneer', name: 'Paneer', category: 'Dairy', unit: 'kg' },
    // Specialty Foods
    { key: 'hummus', name: 'Hummus', category: 'Specialty Foods', unit: 'pack' },
    { key: 'pesto', name: 'Pesto', category: 'Specialty Foods', unit: 'pack' },
    { key: 'balsamic', name: 'Balsamic Vinegar', category: 'Specialty Foods', unit: 'L' },
  ];

  const products = {};
  for (const def of productDefs) {
    products[def.key] = await Product.create({
      name: def.name,
      variety: def.variety || '',
      categoryId: categories[def.category].id,
      unit: def.unit,
      description: `${def.name}${def.variety ? ' (' + def.variety + ')' : ''} sourced from regional wholesale suppliers.`,
      imageUrl: img(def.name),
    });
  }
  console.log(`Created ${Object.keys(products).length} products`);

  // ----------------------------------------------------------------- Vendors
  const vendorDefs = [
    { name: 'Pune Fresh Wholesale', regionIdx: 0, lat: 18.6281, lng: 73.85, reliability: 88 },
    { name: 'Deccan Produce Distributors', regionIdx: 0, lat: 18.7092, lng: 73.85, reliability: 75 },
    { name: 'Nashik AgroMart Wholesale', regionIdx: 1, lat: 20.05, lng: 73.8, reliability: 80 },
    { name: 'Godavari Farm Supplies', regionIdx: 1, lat: 20.1, lng: 73.9, reliability: 70 },
    { name: 'Kolhapur Wholesale Hub', regionIdx: 2, lat: 16.75, lng: 74.3, reliability: 85 },
    { name: 'Panchganga Traders', regionIdx: 2, lat: 16.8, lng: 74.2, reliability: 65 },
    { name: 'Satara Fresh Supply Co', regionIdx: 3, lat: 17.72, lng: 74.02, reliability: 90 },
    { name: 'Krishna Valley Wholesalers', regionIdx: 3, lat: 17.75, lng: 73.95, reliability: 72 },
    { name: 'Solapur Bulk Grocers', regionIdx: 4, lat: 17.7, lng: 75.95, reliability: 68 },
    { name: 'Bhima Agro Distributors', regionIdx: 4, lat: 17.6, lng: 75.85, reliability: 77 },
  ];

  const vendors = [];
  for (let i = 0; i < vendorDefs.length; i++) {
    const def = vendorDefs[i];
    const user = await User.create({
      email: `vendor${i + 1}@rurify.demo`,
      passwordHash,
      name: `${def.name} (Admin)`,
      phone: `9800${String(100000 + i).slice(-6)}`,
      role: 'vendor',
    });
    const vendor = await Vendor.create({
      userId: user.id,
      businessName: def.name,
      address: `${def.name}, ${regions[def.regionIdx].name}, Maharashtra`,
      lat: def.lat,
      lng: def.lng,
      regionId: regions[def.regionIdx].id,
      verified: true,
      reliabilityScore: def.reliability,
    });
    vendors.push(vendor);
  }
  console.log(`Created ${vendors.length} vendors (vendor1..vendor${vendors.length}@rurify.demo)`);

  // --------------------------------------------------------------- Retailers
  const retailerDefs = [
    { name: 'Shree Kirana Store', regionIdx: 0, lat: 18.52, lng: 73.85 },
    { name: 'Ganesh General Store', regionIdx: 0, lat: 18.55, lng: 73.9 },
    { name: 'Annapurna Mart', regionIdx: 0, lat: 18.4, lng: 73.7 },
    { name: 'City Corner Store', regionIdx: 0, lat: 18.6, lng: 74.0 },
    { name: 'Nashik Daily Needs', regionIdx: 1, lat: 19.98, lng: 73.75 },
    { name: 'Godavari Grocers', regionIdx: 1, lat: 20.08, lng: 73.85 },
    { name: 'Sinnar Family Mart', regionIdx: 1, lat: 20.15, lng: 73.95 },
    { name: 'Niphad Super Store', regionIdx: 1, lat: 20.02, lng: 73.9 },
    { name: 'Kolhapur Corner Shop', regionIdx: 2, lat: 16.68, lng: 74.22 },
    { name: 'Ichalkaranji Traders', regionIdx: 2, lat: 16.78, lng: 74.28 },
    { name: 'Hatkanangale Grocers', regionIdx: 2, lat: 16.72, lng: 74.18 },
    { name: 'Panhala Daily Mart', regionIdx: 2, lat: 16.85, lng: 74.35 },
    { name: 'Satara Family Grocers', regionIdx: 3, lat: 17.65, lng: 73.95 },
    { name: 'Karad Super Bazaar', regionIdx: 3, lat: 17.6, lng: 74.1 },
    { name: 'Wai Daily Store', regionIdx: 3, lat: 17.8, lng: 73.9 },
    { name: 'Mahabaleshwar Mart', regionIdx: 3, lat: 17.75, lng: 74.05 },
    { name: 'Solapur Central Store', regionIdx: 4, lat: 17.65, lng: 75.9 },
    { name: 'Pandharpur Grocers', regionIdx: 4, lat: 17.55, lng: 75.8 },
    { name: 'Barshi Family Mart', regionIdx: 4, lat: 17.75, lng: 76.0 },
    { name: 'Akkalkot Daily Needs', regionIdx: 4, lat: 17.6, lng: 76.1 },
  ];

  const retailers = [];
  for (let i = 0; i < retailerDefs.length; i++) {
    const def = retailerDefs[i];
    const user = await User.create({
      email: `retailer${i + 1}@rurify.demo`,
      passwordHash,
      name: `${def.name} (Owner)`,
      phone: `9700${String(100000 + i).slice(-6)}`,
      role: 'retailer',
    });
    const retailer = await Retailer.create({
      userId: user.id,
      shopName: def.name,
      address: `${def.name}, ${regions[def.regionIdx].name}, Maharashtra`,
      lat: def.lat,
      lng: def.lng,
      regionId: regions[def.regionIdx].id,
      verified: true,
    });
    retailers.push(retailer);
  }
  console.log(`Created ${retailers.length} retailers (retailer1..retailer${retailers.length}@rurify.demo)`);

  // --------------------------------------------------------- Admin account
  const adminUser = await User.create({
    email: 'admin@rurify.demo',
    passwordHash: adminPasswordHash,
    name: 'Platform Admin',
    role: 'admin',
  });
  console.log('Created admin account (admin@rurify.demo)');

  // ---------------------------------------------------- General inventory
  const GENERAL_KEYS = productDefs
    .map((p) => p.key)
    .filter((k) => !['celery', 'kiwi', 'avocado', 'oregano', 'zucchini'].includes(k));

  const FRESHNESS = ['FRESH', 'GOOD', 'AVERAGE'];
  const inventoryRows = {}; // key: `${productKey}:${vendorIdx}` -> Inventory instance

  for (let v = 0; v < vendors.length; v++) {
    for (let k = 0; k < 5; k++) {
      const idx = (v * 5 + k) % GENERAL_KEYS.length;
      const productKey = GENERAL_KEYS[idx];
      const product = products[productKey];
      const price = 60 + ((idx * 7 + v * 3) % 180);
      const quantity = 15 + ((v * 5 + k * 3) % 70);
      const moq = 2 + (k % 3) * 3;
      const freshness = FRESHNESS[(v + k) % 3];
      const deliveryAvailable = (v + k) % 4 !== 0;

      const row = await Inventory.create({
        productId: product.id,
        vendorId: vendors[v].id,
        quantity,
        price,
        moq,
        freshness,
        deliveryAvailable,
        expiryDate: null,
      });
      inventoryRows[`${productKey}:${v}`] = row;
    }
  }

  // Avocado — exact demo-flow-1 numbers (Supplier A vs Supplier B)
  const avocadoA = await Inventory.create({
    productId: products.avocado.id,
    vendorId: vendors[0].id, // Pune Fresh Wholesale, ~12km from retailer1
    quantity: 25,
    price: 280,
    moq: 5,
    freshness: 'FRESH',
    deliveryAvailable: true,
  });
  const avocadoB = await Inventory.create({
    productId: products.avocado.id,
    vendorId: vendors[1].id, // Deccan Produce Distributors, ~21km from retailer1
    quantity: 60,
    price: 260,
    moq: 10,
    freshness: 'GOOD',
    deliveryAvailable: true,
  });

  // Oregano — low stock relative to demand (drives "CONSIDER_INCREASING")
  const oreganoV1 = await Inventory.create({
    productId: products.oregano.id,
    vendorId: vendors[0].id,
    quantity: 4,
    price: 450,
    moq: 1,
    freshness: 'GOOD',
    deliveryAvailable: true,
  });
  await Inventory.create({
    productId: products.oregano.id,
    vendorId: vendors[2].id,
    quantity: 6,
    price: 470,
    moq: 1,
    freshness: 'FRESH',
    deliveryAvailable: false,
  });

  // Zucchini — moderate stock at two vendors
  const zucchiniV5 = await Inventory.create({
    productId: products.zucchini.id,
    vendorId: vendors[4].id,
    quantity: 18,
    price: 90,
    moq: 3,
    freshness: 'FRESH',
    deliveryAvailable: true,
  });
  await Inventory.create({
    productId: products.zucchini.id,
    vendorId: vendors[5].id,
    quantity: 10,
    price: 95,
    moq: 3,
    freshness: 'GOOD',
    deliveryAvailable: true,
  });

  // Kiwi — sold out and deactivated (nearby stock = 0, but history of real orders)
  const kiwiInactive = await Inventory.create({
    productId: products.kiwi.id,
    vendorId: vendors[1].id,
    quantity: 0,
    price: 320,
    moq: 2,
    freshness: 'AVERAGE',
    deliveryAvailable: true,
    isActive: false,
  });

  // Celery — intentionally zero suppliers anywhere (unmet demand demo flow)

  // Record each listing in the change log (staggered over the last 10 days),
  // as the live create path does, so the sync feed has history.
  const listed = await Inventory.findAll({ where: { isActive: true }, order: [['id', 'ASC']] });
  for (let i = 0; i < listed.length; i++) {
    const log = await InventoryUpdateLog.create({
      inventoryId: listed[i].id,
      field: 'created',
      oldValue: null,
      newValue: 'listed',
      changeType: 'CREATED',
    });
    await log.update({ createdAt: daysAgo(10 - (i % 10)) }, { silent: true });
  }
  console.log('Seeded inventory (general + demo-critical rows)');

  // --------------------------------------------------- Retailer<->Vendor links
  for (let r = 0; r < retailers.length; r++) {
    const regionIdx = retailerDefs[r].regionIdx;
    const sameRegionVendors = vendors.filter((v, vi) => vendorDefs[vi].regionIdx === regionIdx);
    for (const vendor of sameRegionVendors) {
      await RetailerVendorConnection.findOrCreate({ where: { retailerId: retailers[r].id, vendorId: vendor.id } });
    }
  }
  console.log('Created retailer-vendor connections');

  // ------------------------------------------------------------ Search history
  // `pool` restricts the activity to specific retailers (e.g. one region's shops).
  async function recordSearches(productKey, count, pool = retailers) {
    const product = products[productKey];
    for (let i = 0; i < count; i++) {
      const retailer = pool[i % pool.length];
      const row = await SearchHistory.create({
        retailerId: retailer.id,
        query: product.name,
        productId: product.id,
        resultsCount: 1,
      });
      await row.update({ createdAt: daysAgo(30 - (i % 30)) }, { silent: true });
    }
  }

  // Counts are spaced so the top-5 order (Kiwi, Avocado, Oregano, Celery,
  // Zucchini) survives a run of the demo flows, which add a few searches,
  // orders, and requirements of their own.
  await recordSearches('kiwi', 63);
  await recordSearches('avocado', 85);
  await recordSearches('oregano', 72);
  await recordSearches('celery', 79);
  await recordSearches('zucchini', 25);
  // Region-specific demand, so the regional view differs by region
  const nashikRetailers = retailers.filter((r, i) => retailerDefs[i].regionIdx === 1);
  const solapurRetailers = retailers.filter((r, i) => retailerDefs[i].regionIdx === 4);
  await recordSearches('mozzarella', 20, nashikRetailers);
  await recordSearches('quinoa', 12, solapurRetailers);
  // light background noise on a few common items so they stay clearly below the top 5
  for (const key of ['banana', 'tomato', 'mint', 'coriander', 'rice', 'paneer', 'broccoli', 'lettuce']) {
    await recordSearches(key, (GENERAL_KEYS.indexOf(key) % 5) + 1);
  }
  console.log('Seeded search history');

  // ---------------------------------------------------------- Demand requests
  async function recordDemandRequests(productKey, qtyList, pool = retailers) {
    const product = products[productKey];
    const created = [];
    for (let i = 0; i < qtyList.length; i++) {
      const retailer = pool[i % pool.length];
      const dr = await DemandRequest.create({
        retailerId: retailer.id,
        productId: product.id,
        requiredQty: qtyList[i],
        requiredDate: daysAgo(-7),
        preferredPrice: null,
        notes: null,
        status: 'PENDING',
      });
      created.push(dr);
    }
    return created;
  }

  await recordDemandRequests('kiwi', [3, 3, 2, 4, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 2]); // 15 requests
  // Celery: exactly 8 retailers, totaling 42kg — the aggregate-demo numbers
  await recordDemandRequests('celery', [6, 5, 6, 5, 5, 5, 5, 5]);
  // Oregano: 20kg requested vs 10kg nearby stock -> "consider increasing inventory"
  await recordDemandRequests('oregano', [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]);
  await recordDemandRequests('avocado', [2, 2, 2, 3, 2, 2, 2, 2, 2, 2]); // 10 requests, well under 85kg stock
  await recordDemandRequests('zucchini', [2, 3, 2, 3, 2, 3]); // 6 requests
  await recordDemandRequests('mozzarella', [5, 5, 4, 6, 5], nashikRetailers);
  await recordDemandRequests('quinoa', [3, 2, 4, 3], solapurRetailers);
  console.log('Seeded demand requests');

  // ------------------------------------------------------------------- Orders
  async function recordOrders(inventoryRow, product, statuses) {
    for (let i = 0; i < statuses.length; i++) {
      const status = statuses[i];
      const retailer = retailers[(i + 3) % retailers.length];
      const quantity = Math.max(inventoryRow.moq, 2 + (i % 3));
      const totalPrice = Math.round(quantity * inventoryRow.price * 100) / 100;
      const order = await Order.create({
        retailerId: retailer.id,
        vendorId: inventoryRow.vendorId,
        inventoryId: inventoryRow.id,
        productId: product.id,
        quantity,
        pricePerUnit: inventoryRow.price,
        totalPrice,
        status,
      });
      await OrderStatusHistory.create({ orderId: order.id, status, changedBy: null });
    }
  }

  await recordOrders(avocadoA, products.avocado, [
    'COMPLETED',
    'COMPLETED',
    'COMPLETED',
    'COMPLETED',
    'ACCEPTED',
    'PROCESSING',
    'OUT_FOR_DELIVERY',
    'PENDING',
  ]);
  await recordOrders(kiwiInactive, products.kiwi, [
    'COMPLETED',
    'COMPLETED',
    'COMPLETED',
    'REJECTED',
    'REJECTED',
    'CANCELLED',
    'CANCELLED',
  ]);
  await recordOrders(oreganoV1, products.oregano, ['COMPLETED', 'COMPLETED', 'COMPLETED', 'ACCEPTED', 'PENDING', 'READY']);
  await recordOrders(zucchiniV5, products.zucchini, ['COMPLETED', 'COMPLETED', 'PENDING', 'ACCEPTED']);
  console.log('Seeded orders across the full status lifecycle');

  // ------------------------------------------------------------- Notifications
  const retailer1User = await User.findOne({ where: { email: 'retailer1@rurify.demo' } });
  const vendor1User = await User.findOne({ where: { email: 'vendor1@rurify.demo' } });

  await Notification.bulkCreate([
    {
      userId: retailer1User.id,
      type: 'STOCK_UPDATE',
      title: 'Avocado stock updated',
      message: 'Pune Fresh Wholesale: 30 -> 25 kg.',
      isRead: false,
    },
    {
      userId: retailer1User.id,
      type: 'ORDER_STATUS',
      title: 'Order #1 is now COMPLETED',
      message: 'Avocado order marked completed by Pune Fresh Wholesale.',
      isRead: true,
    },
    {
      userId: vendor1User.id,
      type: 'NEW_ORDER',
      title: 'New order: Avocado',
      message: 'Shree Kirana Store ordered 5 kg of Avocado.',
      isRead: false,
    },
  ]);
  // Demand alerts come from the real alert service, not hand-written text
  let alerts = 0;
  for (const product of Object.values(products)) {
    if (await maybeSendDemandAlert(product)) alerts++;
  }
  console.log(`Seeded notifications (+ ${alerts} computed demand alerts)`);

  await AuditLog.create({ userId: adminUser.id, action: 'SEED_COMPLETE', entityType: null, entityId: null, details: null });

  console.log('\nSeed complete.');
  console.log('Demo accounts: retailer1@rurify.demo | vendor1@rurify.demo | admin@rurify.demo');
  if (env.seedDemoPassword === 'Demo@1234' && env.seedAdminPassword === 'Demo@1234') {
    console.log('Password for every seeded account: Demo@1234');
  } else {
    console.log('Passwords: SEED_DEMO_PASSWORD (retailers/vendors) and SEED_ADMIN_PASSWORD (admin) in server/.env');
  }
}

module.exports = { seed: run };

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
