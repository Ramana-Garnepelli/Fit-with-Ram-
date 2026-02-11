const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
    time: {
        type: String,
        required: true // "07:00", "10:00", etc.
    },
    name: {
        type: String,
        required: true // "Breakfast", "Mid-Morning Snack", etc.
    },
    foods: [{
        type: String
    }],
    macros: {
        protein: {
            type: Number,
            required: true
        },
        carbs: {
            type: Number,
            required: true
        },
        fats: {
            type: Number,
            required: true
        }
    },
    calories: {
        type: Number,
        required: true
    },
    notes: String,
    alternatives: [String] // Alternative food options
});

const dietPlanSchema = new mongoose.Schema({
    programType: {
        type: String,
        enum: ['muscle_building', 'fat_loss', 'strength'],
        required: true
    },
    weekNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    calorieTarget: {
        type: Number,
        required: true
    },
    macroTargets: {
        protein: Number,
        carbs: Number,
        fats: Number
    },
    meals: [mealSchema],
    waterIntake: {
        type: Number, // liters
        default: 3
    },
    supplements: [{
        name: String,
        timing: String,
        dosage: String
    }],
    notes: String
}, {
    timestamps: true
});

// Index for efficient queries
dietPlanSchema.index({ programType: 1, weekNumber: 1 });

module.exports = mongoose.model('DietPlan', dietPlanSchema);
