const mongoose = require('mongoose');

const planSchema = mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['muscle_building', 'fat_loss', 'strength'], required: true },
    mode: { type: String, enum: ['online', 'offline'], required: true },
    price: { type: Number, required: true }, // 300 - 600
    description: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    workoutTemplate: { type: Object }, // Default workout structure for this plan
    dietTemplate: { type: Object }     // Default diet structure for this plan
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
