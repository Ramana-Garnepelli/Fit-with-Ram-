const Plan = require('../models/planModel');
const User = require('../models/userModel');

// @desc    Get all plans
// @route   GET /api/plans
// @access  Public
const getPlans = async (req, res) => {
    const plans = await Plan.find({ isActive: true });
    res.status(200).json(plans);
};

// @desc    Create a new plan
// @route   POST /api/plans
// @access  Private/Admin
const createPlan = async (req, res) => {
    const plan = await Plan.create(req.body);
    res.status(201).json(plan);
};

// @desc    Update a plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const updatePlan = async (req, res) => {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
        res.status(404);
        throw new Error('Plan not found');
    }

    const updatedPlan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.status(200).json(updatedPlan);
};

// @desc    Delete a plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const deletePlan = async (req, res) => {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
        res.status(404);
        throw new Error('Plan not found');
    }

    await plan.remove();

    res.status(200).json({ id: req.params.id });
};

// @desc    Get User Dashboard Data (My Plan & Diet)
// @route   GET /api/programs/my-program
// @access  Private
const getMyProgram = async (req, res) => {
    const user = await User.findById(req.user.id).select('workoutPlan dietPlan purchases');
    res.status(200).json(user);
};

module.exports = {
    getPlans,
    createPlan,
    updatePlan,
    deletePlan,
    getMyProgram
};
