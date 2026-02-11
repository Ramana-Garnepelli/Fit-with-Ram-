const express = require('express');
const router = express.Router();
const { getPlans, createPlan, updatePlan, deletePlan, getMyProgram } = require('../controllers/programController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getPlans).post(protect, admin, createPlan);
router.route('/:id').put(protect, admin, updatePlan).delete(protect, admin, deletePlan);
router.get('/my-program', protect, getMyProgram);

module.exports = router;
