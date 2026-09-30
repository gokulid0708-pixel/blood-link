const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/overview', adminController.getAdminOverview);
router.post('/verify', adminController.verifyEntity);
router.get('/verification-queue', adminController.getVerificationQueue);
router.get('/auditlogs', adminController.getAuditLogs);

module.exports = router;
