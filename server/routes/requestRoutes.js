const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');

router.post('/', requestController.createBloodRequest);
router.get('/', requestController.getAllBloodRequests);
router.get('/donor/:donorId', requestController.getRequestsByDonor);
router.get('/:id', requestController.getBloodRequestById);
router.post('/:id/escalate', requestController.escalateRequest);
router.post('/:id/respond', requestController.donorRespondRequest);
router.post('/:id/respond-drive', requestController.donorRespondDrive);
router.post('/:id/fulfill-requisition', requestController.bloodBankFulfillRequisition);
router.post('/:id/dispatch', requestController.dispatchAlert);
router.post('/:id/quick-message', requestController.sendQuickMessage);
router.get('/:id/quick-messages', requestController.getQuickMessages);

module.exports = router;
