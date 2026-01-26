const express = require('express');
const router = express.Router();
const { getUsers, deleteUser, getDashboardStats, getUserById, updateUserPlan } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/users', protect, admin, getUsers);
router.get('/users/:id', protect, admin, getUserById);
router.put('/users/:id/plan', protect, admin, updateUserPlan);
router.delete('/users/:id', protect, admin, deleteUser);
router.get('/stats', protect, admin, getDashboardStats);

module.exports = router;
