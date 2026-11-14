const User = require('../models/userModel');
const Payment = require('../models/paymentModel');
// Plan model is needed for population in getDashboardStats
require('../models/planModel');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard stats (Total Users, Revenue, Recent Sales)
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const usersCount = await User.countDocuments();

        const now = new Date();
        const [revenueStats, activeUsersCount] = await Promise.all([
            Payment.aggregate([
                { $match: { status: 'paid' } },
                { $group: { _id: null, totalRevenue: { $sum: '$amount' }, paidCount: { $sum: 1 } } }
            ]),
            User.countDocuments({ purchases: { $elemMatch: { validUntil: { $gt: now } } } })
        ]);

        // Get Recent Activations (Last 5 paid payments)
        const recentSales = await Payment.find({ status: 'paid' })
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate('user', 'name email')
            .populate('plan', 'name');

        res.json({
            usersCount,
            activeCount: activeUsersCount,
            paidTransactions: revenueStats[0]?.paidCount || 0,
            averageOrderValue: revenueStats[0]?.paidCount
                ? Math.round((revenueStats[0].totalRevenue / revenueStats[0].paidCount) * 100) / 100
                : 0,
            totalRevenue: revenueStats[0]?.totalRevenue || 0,
            recentSales
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user plan (workout and diet)
// @route   PUT /api/admin/users/:id/plan
// @access  Private/Admin
const updateUserPlan = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.workoutPlan = req.body.workoutPlan || user.workoutPlan;
            user.dietPlan = req.body.dietPlan || user.dietPlan;
            user.activePlanType = req.body.planType || user.activePlanType;

            const updatedUser = await user.save();
            const safeUser = updatedUser.toObject();
            delete safeUser.password;
            res.json(safeUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const { seedWorkoutPlans, seedDietPlans } = require('../seedWorkoutDiet');

// @desc    Seed workout and diet plans
// @route   POST /api/admin/seed-workout-diet
// @access  Private/Admin
const seedWorkoutDietData = async (req, res) => {
    try {
        await seedWorkoutPlans();
        await seedDietPlans();
        res.status(200).json({ message: 'Workout and diet plans seeded successfully!' });
    } catch (error) {
        console.error('Error seeding data:', error);
        res.status(500).json({ message: 'Error seeding data', error: error.message });
    }
};

module.exports = {
    getUsers,
    deleteUser,
    getDashboardStats,
    getUserById,
    updateUserPlan,
    seedWorkoutDietData
};
