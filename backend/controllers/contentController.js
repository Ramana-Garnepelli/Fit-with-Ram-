const DailyContent = require('../models/dailyContentModel');

// @desc    Create or Update Daily Content
// @route   POST /api/content
// @access  Admin
const createOrUpdateDay = async (req, res) => {
    const { planType, dayNumber, title, exercises, diet } = req.body;

    try {
        let content = await DailyContent.findOne({ planType, dayNumber });

        if (content) {
            // Update existing
            content.title = title || content.title;
            content.exercises = exercises || content.exercises;
            content.diet = diet || content.diet;
            await content.save();
            return res.json({ message: 'Day Updated', content });
        } else {
            // Create new
            content = await DailyContent.create({
                planType,
                dayNumber,
                title,
                exercises,
                diet
            });
            return res.status(201).json({ message: 'Day Created', content });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Content for a specific day
// @route   GET /api/content/:planType/:dayNumber
// @access  Private (User/Admin)
const getDayContent = async (req, res) => {
    const { planType, dayNumber } = req.params;

    try {
        const content = await DailyContent.findOne({ planType, dayNumber });
        if (content) {
            res.json(content);
        } else {
            res.status(404).json({ message: 'Content not waiting for this day yet' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createOrUpdateDay, getDayContent };
