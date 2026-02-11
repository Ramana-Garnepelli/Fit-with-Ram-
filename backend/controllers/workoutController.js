const WorkoutPlan = require('../models/workoutPlanModel');
const User = require('../models/userModel');

// @desc    Get today's workout for logged-in user
// @route   GET /api/workouts/today
// @access  Private
const getTodaysWorkout = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user.activePlanType) {
            return res.status(404).json({ message: 'No active plan found. Please purchase a plan first.' });
        }

        const currentWeek = user.currentWeek || 1;
        const currentDay = user.currentDay || 1;

        const workout = await WorkoutPlan.findOne({
            programType: user.activePlanType,
            weekNumber: currentWeek,
            dayNumber: currentDay
        });

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found for today' });
        }

        res.json(workout);
    } catch (error) {
        console.error('Error fetching today\'s workout:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark workout as complete
// @route   POST /api/workouts/complete
// @access  Private
const completeWorkout = async (req, res) => {
    try {
        const { workoutPlanId, exercises, duration, caloriesBurned } = req.body;
        const user = await User.findById(req.user.id);

        const workout = await WorkoutPlan.findById(workoutPlanId);
        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        // Add to workout history
        user.workoutHistory.push({
            workoutPlanId,
            date: new Date(),
            dayType: workout.dayType,
            completed: true,
            exercises: exercises || [],
            duration: duration || workout.totalDuration,
            caloriesBurned: caloriesBurned || workout.caloriesBurned
        });

        // Increment current day (cycle through 7 days)
        user.currentDay = user.currentDay >= 7 ? 1 : user.currentDay + 1;

        // Increment week if we completed day 7
        if (user.currentDay === 1) {
            user.currentWeek = user.currentWeek + 1;
        }

        await user.save();

        res.json({
            message: 'Workout completed successfully!',
            nextDay: user.currentDay,
            nextWeek: user.currentWeek
        });
    } catch (error) {
        console.error('Error completing workout:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get workout history
// @route   GET /api/workouts/history
// @access  Private
const getWorkoutHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('workoutHistory.workoutPlanId');

        const history = user.workoutHistory
            .sort((a, b) => b.date - a.date)
            .slice(0, 30); // Last 30 workouts

        res.json(history);
    } catch (error) {
        console.error('Error fetching workout history:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Log individual exercise completion
// @route   POST /api/workouts/log-exercise
// @access  Private
const logExercise = async (req, res) => {
    try {
        const { exerciseName, setsCompleted, notes } = req.body;

        // This can be used for real-time tracking during workout
        res.json({ message: 'Exercise logged', exerciseName, setsCompleted });
    } catch (error) {
        console.error('Error logging exercise:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get weekly overview
// @route   GET /api/workouts/weekly-overview
// @access  Private
const getWeeklyOverview = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Get last 7 days of workouts
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentWorkouts = user.workoutHistory.filter(
            w => w.date >= sevenDaysAgo
        );

        // Create 7-day calendar
        const calendar = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const workout = recentWorkouts.find(
                w => w.date.toISOString().split('T')[0] === dateStr
            );

            calendar.push({
                date: dateStr,
                completed: !!workout,
                dayType: workout?.dayType || null
            });
        }

        res.json(calendar);
    } catch (error) {
        console.error('Error fetching weekly overview:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getTodaysWorkout,
    completeWorkout,
    getWorkoutHistory,
    logExercise,
    getWeeklyOverview
};
