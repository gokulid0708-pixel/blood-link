const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getAllInventories);
router.get('/:id', inventoryController.getBloodBankInventory);
router.post('/:id/action', inventoryController.updateInventoryAction);

module.exports = router;
