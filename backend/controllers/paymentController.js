const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/paymentModel');
const User = require('../models/userModel');
const Plan = require('../models/planModel');

// Lazy initialization to prevent crash when keys are not set
let razorpayInstance = null;
const getRazorpay = () => {
    if (!razorpayInstance) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
        }
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayInstance;
};

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
    const { planId } = req.body;
    const plan = await Plan.findById(planId);

    if (!plan) {
        res.status(404);
        throw new Error('Plan not found');
    }

    const options = {
        amount: plan.price * 100, // Amount in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
    };

    try {
        const order = await getRazorpay().orders.create(options);

        const payment = await Payment.create({
            user: req.user.id,
            plan: planId,
            razorpayOrderId: order.id,
            amount: plan.price,
            status: 'created'
        });

        res.json(order);
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        // Update payment status
        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (payment) {
            payment.razorpayPaymentId = razorpay_payment_id;
            payment.razorpaySignature = razorpay_signature;
            payment.status = 'paid';
            await payment.save();

            // Unlock plan for user
            const user = await User.findById(payment.user);
            const plan = await Plan.findById(payment.plan);

            user.purchases.push({
                planId: payment.plan,
                amount: payment.amount,
                purchaseDate: new Date(),
                validUntil: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // Assuming 30 days validity or logic from plan
            });

            // Auto-assign template if available
            if (plan.workoutTemplate) user.workoutPlan = plan.workoutTemplate;
            if (plan.dietTemplate) user.dietPlan = plan.dietTemplate;

            await user.save();
        }

        res.json({ success: true, message: 'Payment verified' });
    } else {
        res.status(400);
        throw new Error('Invalid signature');
    }
};

module.exports = {
    createOrder,
    verifyPayment
};
