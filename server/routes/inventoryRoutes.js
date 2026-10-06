const express = require('express');
const router = express.Router();
const {
  listMyInventory,
  createInventory,
  updateInventory,
  deactivateInventory,
  importInventoryCsv,
  getSyncFeed,
} = require('../controllers/inventoryController');
const { createInventoryValidator, updateInventoryValidator } = require('../validators/inventoryValidators');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { csvUpload } = require('../middleware/upload');

router.get('/sync', authenticate, authorize('retailer'), getSyncFeed);

router.get('/', authenticate, authorize('vendor'), listMyInventory);
router.post('/', authenticate, authorize('vendor'), createInventoryValidator, validate, createInventory);
router.put('/:id', authenticate, authorize('vendor'), updateInventoryValidator, validate, updateInventory);
router.delete('/:id', authenticate, authorize('vendor'), deactivateInventory);
router.post('/import', authenticate, authorize('vendor'), csvUpload.single('file'), importInventoryCsv);

module.exports = router;
