const DietPlan = require('../models/dietPlanModel');
const User = require('../models/userModel');

// @desc    Get today's diet plan
// @route   GET /api/diet/today
// @access  Private
const getTodaysDiet = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user.activePlanType) {
            return res.status(404).json({ message: 'No active plan found. Please purchase a plan first.' });
        }

        const currentWeek = user.currentWeek || 1;

        const dietPlan = await DietPlan.findOne({
            programType: user.activePlanType,
            weekNumber: currentWeek
        });

        if (!dietPlan) {
            return res.status(404).json({ message: 'Diet plan not found' });
        }

        // Get today's logged meals
        const today = new Date().toISOString().split('T')[0];
        const todaysMeals = user.mealLog.filter(
            meal => meal.date.toISOString().split('T')[0] === today
        );

        res.json({
            dietPlan,
            loggedMeals: todaysMeals
        });
    } catch (error) {
        console.error('Error fetching today\'s diet:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Log meal completion
// @route   POST /api/diet/log-meal
// @access  Private
const logMeal = async (req, res) => {
    try {
        const { mealName, macros, calories } = req.body;
        const user = await User.findById(req.user.id);

        user.mealLog.push({
            date: new Date(),
            mealName,
            completed: true,
            macros,
            calories
        });

        await user.save();

        res.json({ message: 'Meal logged successfully!' });
    } catch (error) {
        console.error('Error logging meal:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get nutrition history
// @route   GET /api/diet/history
// @access  Private
const getNutritionHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Get last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const history = user.mealLog
            .filter(meal => meal.date >= thirtyDaysAgo)
            .sort((a, b) => b.date - a.date);

        // Group by date and calculate daily totals
        const dailyTotals = {};
        history.forEach(meal => {
            const dateStr = meal.date.toISOString().split('T')[0];
            if (!dailyTotals[dateStr]) {
                dailyTotals[dateStr] = {
                    date: dateStr,
                    totalCalories: 0,
                    totalProtein: 0,
                    totalCarbs: 0,
                    totalFats: 0,
                    mealsLogged: 0
                };
            }
            dailyTotals[dateStr].totalCalories += meal.calories || 0;
            dailyTotals[dateStr].totalProtein += meal.macros?.protein || 0;
            dailyTotals[dateStr].totalCarbs += meal.macros?.carbs || 0;
            dailyTotals[dateStr].totalFats += meal.macros?.fats || 0;
            dailyTotals[dateStr].mealsLogged += 1;
        });

        res.json({
            history,
            dailyTotals: Object.values(dailyTotals)
        });
    } catch (error) {
        console.error('Error fetching nutrition history:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getTodaysDiet,
    logMeal,
    getNutritionHistory
};
