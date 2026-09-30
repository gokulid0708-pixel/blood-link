const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/register/donor', authController.registerDonor);
router.post('/register/hospital', authController.registerHospital);
router.post('/register/bloodbank', authController.registerBloodBank);
router.post('/login', authController.login);
router.post('/otp/request', authController.requestOtp);
router.post('/otp/verify', authController.verifyOtpCode);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
