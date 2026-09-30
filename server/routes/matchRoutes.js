const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

router.post('/calculate', matchController.calculateMatches);

module.exports = router;
