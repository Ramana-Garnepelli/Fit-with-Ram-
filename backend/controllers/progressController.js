const User = require('../models/userModel');

// @desc    Upload progress photo
// @route   POST /api/progress/photo
// @access  Private
const uploadProgressPhoto = async (req, res) => {
    try {
        const { url, type } = req.body; // In production, handle file upload
        const user = await User.findById(req.user.id);

        user.progressPhotos.push({
            date: new Date(),
            url,
            type: type || 'front'
        });

        await user.save();

        res.json({ message: 'Progress photo uploaded successfully!' });
    } catch (error) {
        console.error('Error uploading progress photo:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Log measurements
// @route   POST /api/progress/measurement
// @access  Private
const logMeasurement = async (req, res) => {
    try {
        const { weight, bodyFat, chest, waist, hips, arms, thighs, calves, notes } = req.body;
        const user = await User.findById(req.user.id);

        user.measurements.push({
            date: new Date(),
            weight,
            bodyFat,
            chest,
            waist,
            hips,
            arms,
            thighs,
            calves,
            notes
        });

        // Also update weightLog for backward compatibility
        if (weight) {
            user.weightLog.push({
                weight,
                date: new Date()
            });
        }

        await user.save();

        res.json({ message: 'Measurements logged successfully!' });
    } catch (error) {
        console.error('Error logging measurements:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get progress statistics
// @route   GET /api/progress/stats
// @access  Private
const getProgressStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Calculate stats
        const totalWorkouts = user.workoutHistory.filter(w => w.completed).length;
        const currentStreak = calculateStreak(user.workoutHistory);
        const weightChange = calculateWeightChange(user.measurements);
        const recentPhotos = user.progressPhotos.slice(-6); // Last 6 photos

        res.json({
            totalWorkouts,
            currentStreak,
            weightChange,
            recentPhotos,
            latestMeasurement: user.measurements[user.measurements.length - 1] || null,
            startWeight: user.startWeight,
            targetWeight: user.targetWeight
        });
    } catch (error) {
        console.error('Error fetching progress stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to calculate workout streak
const calculateStreak = (workoutHistory) => {
    if (!workoutHistory || workoutHistory.length === 0) return 0;

    const sortedWorkouts = workoutHistory
        .filter(w => w.completed)
        .sort((a, b) => b.date - a.date);

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const workout of sortedWorkouts) {
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === streak || (streak === 0 && daysDiff === 0)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
};

// Helper function to calculate weight change
const calculateWeightChange = (measurements) => {
    if (!measurements || measurements.length < 2) return { change: 0, percentage: 0 };

    const firstMeasurement = measurements[0];
    const latestMeasurement = measurements[measurements.length - 1];

    if (!firstMeasurement.weight || !latestMeasurement.weight) {
        return { change: 0, percentage: 0 };
    }

    const change = latestMeasurement.weight - firstMeasurement.weight;
    const percentage = ((change / firstMeasurement.weight) * 100).toFixed(1);

    return { change: change.toFixed(1), percentage };
};

module.exports = {
    uploadProgressPhoto,
    logMeasurement,
    getProgressStats
};
