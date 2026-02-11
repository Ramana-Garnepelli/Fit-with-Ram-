const express = require('express');
const router = express.Router();
const {
    uploadProgressPhoto,
    logMeasurement,
    getProgressStats
} = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.post('/photo', protect, uploadProgressPhoto);
router.post('/measurement', protect, logMeasurement);
router.get('/stats', protect, getProgressStats);

module.exports = router;
