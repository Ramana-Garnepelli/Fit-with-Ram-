const User = require('../models/userModel');

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

        // Calculate Total Revenue from Payments
        const payments = await Payment.find({ status: 'paid' });
        const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

        // Get Recent Activations (Last 5 paid payments)
        const recentSales = await Payment.find({ status: 'paid' })
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate('user', 'name email')
            .populate('plan', 'name');

        res.json({
            usersCount,
            totalRevenue,
            activeCount: recentSales.length, // Approximate or fetch real active count
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

            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getUsers, getUserById, deleteUser, getDashboardStats, updateUserPlan };
