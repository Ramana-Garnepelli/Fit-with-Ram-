const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { initiatePayment, checkStatus } = require('../controllers/phonePeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

// PhonePe Routes
router.post('/phonepe/initiate', protect, initiatePayment);
router.get('/phonepe/status/:id', protect, checkStatus);

module.exports = router;
