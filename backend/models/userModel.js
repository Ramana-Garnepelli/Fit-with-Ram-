const mongoose = require('mongoose');

const purchaseSchema = mongoose.Schema({
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    purchaseDate: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    validUntil: { type: Date } // Optional, for expiration logic
});

const workoutHistorySchema = mongoose.Schema({
    workoutPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan' },
    date: { type: Date, default: Date.now },
    dayType: { type: String }, // 'push', 'pull', 'legs', 'hiit'
    completed: { type: Boolean, default: false },
    exercises: [{
        name: String,
        setsCompleted: Number,
        notes: String
    }],
    duration: { type: Number }, // minutes
    caloriesBurned: { type: Number }
});

const mealLogSchema = mongoose.Schema({
    date: { type: Date, default: Date.now },
    mealName: String,
    completed: { type: Boolean, default: false },
    macros: {
        protein: Number,
        carbs: Number,
        fats: Number
    },
    calories: Number
});

const measurementSchema = mongoose.Schema({
    date: { type: Date, default: Date.now },
    weight: Number, // kg
    bodyFat: Number, // percentage
    chest: Number, // cm
    waist: Number, // cm
    hips: Number, // cm
    arms: Number, // cm
    thighs: Number, // cm
    calves: Number, // cm
    notes: String
});

const progressPhotoSchema = mongoose.Schema({
    date: { type: Date, default: Date.now },
    url: String,
    type: { type: String, enum: ['front', 'back', 'side'], default: 'front' }
});

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    activePlanType: { type: String, default: null }, // 'muscle_building', 'fat_loss', 'strength'
    currentDay: { type: Number, default: 1 },
    currentWeek: { type: Number, default: 1 },
    lastLogin: { type: Date },
    loginDays: { type: [String], default: [] }, // Array of YYYY-MM-DD strings to track unique login days
    height: { type: Number }, // in cm
    weightLog: [{
        weight: { type: Number },
        date: { type: Date, default: Date.now }
    }],
    purchases: [purchaseSchema],
    workoutPlan: { type: Object }, // Store detailed plan structure specifically for this user
    dietPlan: { type: Object },     // Store detailed diet structure specifically for this user

    // Progress Tracking
    workoutHistory: [workoutHistorySchema],
    mealLog: [mealLogSchema],
    measurements: [measurementSchema],
    progressPhotos: [progressPhotoSchema],
    restDays: [{ type: Date }], // Array of rest day dates

    // Goals
    targetWeight: { type: Number },
    startWeight: { type: Number },
    startDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
