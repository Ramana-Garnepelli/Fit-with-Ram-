const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    sets: {
        type: Number,
        required: true
    },
    reps: {
        type: String, // "8-10" or "12-15" or "AMRAP"
        required: true
    },
    restSeconds: {
        type: Number,
        default: 90
    },
    notes: String,
    videoUrl: String,
    muscleGroup: {
        type: String,
        enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio']
    },
    equipment: String
});

const workoutPlanSchema = new mongoose.Schema({
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
    dayNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 7
    },
    dayType: {
        type: String,
        enum: ['push', 'pull', 'legs', 'hiit', 'cardio', 'rest'],
        required: true
    },
    dayName: {
        type: String,
        required: true // "Push Day", "Pull Day", "Legs Day", "HIIT Circuit"
    },
    exercises: [exerciseSchema],
    totalDuration: {
        type: Number, // minutes
        default: 60
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    caloriesBurned: {
        type: Number,
        default: 300
    },
    description: String
}, {
    timestamps: true
});

// Index for efficient queries
workoutPlanSchema.index({ programType: 1, weekNumber: 1, dayNumber: 1 });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
