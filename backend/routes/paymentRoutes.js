const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { initiatePayment, checkStatus, handleCallback } = require('../controllers/phonePeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

// PhonePe Routes
router.post('/phonepe/initiate', protect, initiatePayment);
router.get('/phonepe/status/:id', protect, checkStatus);
router.post('/phonepe/callback', handleCallback);

module.exports = router;
