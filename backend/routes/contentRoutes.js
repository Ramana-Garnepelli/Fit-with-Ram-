const express = require('express');
const router = express.Router();
const { createOrUpdateDay, getDayContent } = require('../controllers/contentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, createOrUpdateDay);
router.get('/:planType/:dayNumber', protect, getDayContent);

module.exports = router;
