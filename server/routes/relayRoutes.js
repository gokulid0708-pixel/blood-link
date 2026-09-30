const express = require('express');
const router = express.Router();
const relayController = require('../controllers/relayController');

router.post('/initiate-call', relayController.handleInitiateCall);
router.post('/respond-call', relayController.handleRespondCall);
router.post('/send-message', relayController.handleSendMessage);
router.get('/sessions/:userId', relayController.handleGetSessions);
router.get('/session/:sessionId', relayController.handleGetSessionById);
router.get('/active-request/:donorId', relayController.handleGetActiveRequest);

module.exports = router;
