const express = require('express');
const router = express.Router();
const {
    getTodaysDiet,
    logMeal,
    getNutritionHistory
} = require('../controllers/dietController');
const { protect } = require('../middleware/authMiddleware');

router.get('/today', protect, getTodaysDiet);
router.post('/log-meal', protect, logMeal);
router.get('/history', protect, getNutritionHistory);

module.exports = router;
