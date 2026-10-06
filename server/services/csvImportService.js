const { parse } = require('csv-parse/sync');
const { Category, Product, Inventory } = require('../models');
const { logInventoryChange } = require('./inventorySyncService');

const REQUIRED_COLUMNS = ['productName', 'category', 'unit', 'quantity', 'price', 'moq'];
const VALID_FRESHNESS = ['FRESH', 'GOOD', 'AVERAGE'];

function parseBoolean(value) {
  if (value === undefined || value === '') return true;
  return ['true', '1', 'yes', 'y'].includes(String(value).trim().toLowerCase());
}

async function importCsvForVendor(buffer, vendorId) {
  let records;
  try {
    records = parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
  } catch (err) {
    return { summary: { totalRows: 0, success: 0, failed: 0 }, errors: [{ row: 0, message: `Could not parse CSV: ${err.message}` }] };
  }

  if (records.length === 0) {
    return { summary: { totalRows: 0, success: 0, failed: 0 }, errors: [{ row: 0, message: 'CSV file has no data rows' }] };
  }

  const header = Object.keys(records[0]);
  const missingColumns = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missingColumns.length > 0) {
    return {
      summary: { totalRows: records.length, success: 0, failed: records.length },
      errors: [{ row: 0, message: `Missing required column(s): ${missingColumns.join(', ')}` }],
    };
  }

  const errors = [];
  const seenInFile = new Set();
  let success = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2; // +1 for header, +1 for 1-based
    const name = (row.productName || '').trim();
    const variety = (row.variety || '').trim();
    const categoryName = (row.category || '').trim();
    const unit = (row.unit || 'kg').trim();
    const quantity = Number(row.quantity);
    const price = Number(row.price);
    const moq = Number(row.moq);
    const freshness = (row.freshness || 'FRESH').trim().toUpperCase();
    const dedupeKey = `${name.toLowerCase()}|${variety.toLowerCase()}`;

    if (!name || !categoryName) {
      errors.push({ row: rowNum, message: 'productName and category are required' });
      continue;
    }
    if (Number.isNaN(quantity) || quantity < 0) {
      errors.push({ row: rowNum, message: `Invalid quantity: "${row.quantity}"` });
      continue;
    }
    if (Number.isNaN(price) || price <= 0) {
      errors.push({ row: rowNum, message: `Invalid price: "${row.price}"` });
      continue;
    }
    if (Number.isNaN(moq) || moq <= 0) {
      errors.push({ row: rowNum, message: `Invalid MOQ: "${row.moq}"` });
      continue;
    }
    if (!VALID_FRESHNESS.includes(freshness)) {
      errors.push({ row: rowNum, message: `Invalid freshness "${row.freshness}" — must be one of ${VALID_FRESHNESS.join(', ')}` });
      continue;
    }
    if (seenInFile.has(dedupeKey)) {
      errors.push({ row: rowNum, message: `Duplicate product in file: "${name}" ${variety}` });
      continue;
    }
    seenInFile.add(dedupeKey);

    try {
      const [category] = await Category.findOrCreate({ where: { name: categoryName } });
      const [product] = await Product.findOrCreate({
        where: { name, variety },
        defaults: { categoryId: category.id, unit },
      });

      const existing = await Inventory.findOne({ where: { productId: product.id, vendorId } });
      if (existing) {
        const before = existing.toJSON();
        await existing.update({
          quantity,
          price,
          moq,
          freshness,
          deliveryAvailable: parseBoolean(row.deliveryAvailable),
          expiryDate: row.expiryDate || null,
          isActive: true,
        });
        await logInventoryChange(existing, before, 'UPDATED');
      } else {
        const created = await Inventory.create({
          productId: product.id,
          vendorId,
          quantity,
          price,
          moq,
          freshness,
          deliveryAvailable: parseBoolean(row.deliveryAvailable),
          expiryDate: row.expiryDate || null,
        });
        await logInventoryChange(created, null, 'CREATED');
      }
      success++;
    } catch (err) {
      errors.push({ row: rowNum, message: `Could not save row: ${err.message}` });
    }
  }

  return {
    summary: { totalRows: records.length, success, failed: errors.length },
    errors,
  };
}

module.exports = { importCsvForVendor, REQUIRED_COLUMNS };
