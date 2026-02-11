const mongoose = require('mongoose');

const dailyContentSchema = mongoose.Schema({
    planType: {
        type: String,
        enum: ['muscle_building', 'fat_loss', 'strength'],
        required: true
    },
    dayNumber: { type: Number, required: true }, // e.g., 1, 2, 3...
    title: { type: String, required: true }, // e.g., "Day 1: Chest & Triceps"
    exercises: [{
        name: { type: String, required: true },
        sets: { type: String, required: true },
        reps: { type: String, required: true },
        tips: { type: String }
    }],
    diet: [{
        mealName: { type: String, required: true }, // "Breakfast"
        foodItems: { type: String, required: true }, // "Oats + 2 Eggs"
        calories: { type: String } // "400 kcal"
    }]
}, { timestamps: true });

// Ensure we don't have duplicate days for the same plan type
dailyContentSchema.index({ planType: 1, dayNumber: 1 }, { unique: true });

module.exports = mongoose.model('DailyContent', dailyContentSchema);
