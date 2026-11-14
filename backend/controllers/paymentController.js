const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/paymentModel');
const User = require('../models/userModel');
const Plan = require('../models/planModel');

const getMyPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('plan', 'name type duration mode');
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllPayments = async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (['created', 'pending', 'paid', 'failed'].includes(status)) filter.status = status;
        const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50));
        const [payments, total, totals] = await Promise.all([
            Payment.find(filter).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize)
                .populate('user', 'name email phone').populate('plan', 'name type'),
            Payment.countDocuments(filter),
            Payment.aggregate([
                { $match: { status: 'paid' } },
                { $group: { _id: '$currency', count: { $sum: 1 }, revenue: { $sum: '$amount' } } }
            ])
        ]);
        res.json({ payments, total, page: pageNumber, pages: Math.ceil(total / pageSize), totals });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

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

    if (!plan || !plan.isActive) {
        res.status(404);
        throw new Error('Plan not found or unavailable');
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
            status: 'created',
            provider: 'razorpay'
        });

        res.json(order);
    } catch (error) {
        console.error("Razorpay Error:", error);
        res.status(500);
        throw new Error(error.message);
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (
        typeof razorpay_order_id !== 'string' ||
        typeof razorpay_payment_id !== 'string' ||
        typeof razorpay_signature !== 'string' ||
        !process.env.RAZORPAY_KEY_SECRET
    ) {
        return res.status(400).json({ success: false, message: 'Invalid payment verification request' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(razorpay_signature);

    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
        return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const payment = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
        user: req.user._id,
        provider: 'razorpay'
    });
    if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (payment.status === 'paid') {
        return res.json({ success: true, message: 'Payment verified' });
    }
    if (payment.status !== 'created') {
        return res.status(400).json({ success: false, message: 'Payment is not awaiting verification' });
    }

    const [user, plan] = await Promise.all([
        User.findById(payment.user),
        Plan.findById(payment.plan)
    ]);
    if (!user || !plan) {
        return res.status(404).json({ success: false, message: 'Could not activate the purchased plan' });
    }

    const durationDays = Number.isFinite(plan.duration) && plan.duration > 0 ? plan.duration : 30;
    await User.updateOne(
        { _id: user._id, 'purchases.paymentId': { $ne: payment._id } },
        {
            $push: {
                purchases: {
                    paymentId: payment._id,
                    planId: plan._id,
                    amount: payment.amount,
                    purchaseDate: new Date(),
                    validUntil: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
                }
            },
            $set: {
                ...(plan.workoutTemplate && { workoutPlan: plan.workoutTemplate }),
                ...(plan.dietTemplate && { dietPlan: plan.dietTemplate }),
                activePlanType: plan.type,
                currentDay: 1
            }
        }
    );

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'paid';
    await payment.save();
    return res.json({ success: true, message: 'Payment verified' });
};

module.exports = {
    createOrder,
    verifyPayment,
    getMyPayments,
    getAllPayments
};
