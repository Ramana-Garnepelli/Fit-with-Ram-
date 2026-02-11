const express = require('express');
const router = express.Router();
const {
    getTodaysWorkout,
    completeWorkout,
    getWorkoutHistory,
    logExercise,
    getWeeklyOverview
} = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');

router.get('/today', protect, getTodaysWorkout);
router.post('/complete', protect, completeWorkout);
router.get('/history', protect, getWorkoutHistory);
router.post('/log-exercise', protect, logExercise);
router.get('/weekly-overview', protect, getWeeklyOverview);

module.exports = router;
