const mongoose = require('mongoose');

const purchaseSchema = mongoose.Schema({
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    purchaseDate: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    validUntil: { type: Date } // Optional, for expiration logic
});

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    activePlanType: { type: String, default: null }, // 'muscle_building', etc.
    currentDay: { type: Number, default: 1 },
    purchases: [purchaseSchema],
    workoutPlan: { type: Object }, // Store detailed plan structure specifically for this user
    dietPlan: { type: Object }     // Store detailed diet structure specifically for this user
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
