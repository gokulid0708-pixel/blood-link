const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');

router.get('/', donorController.getAllDonors);
router.patch('/:donorId/availability', donorController.updateAvailability);
router.get('/:donorId/feed', donorController.getDonorFeed);
router.get('/:donorId/history', donorController.getDonorHistory);
router.get('/:donorId/notifications', donorController.getDonorNotifications);
router.post('/:donorId/confirm-active', donorController.confirmActive);
router.post('/:donorId/temporarily-unavailable', donorController.setTemporarilyUnavailable);

module.exports = router;
