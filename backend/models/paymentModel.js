const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['created', 'pending', 'paid', 'failed'], default: 'created' },
    provider: { type: String, enum: ['razorpay', 'phonepe'], default: 'razorpay' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
