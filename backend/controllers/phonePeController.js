const crypto = require('crypto');
const Payment = require('../models/paymentModel');
const User = require('../models/userModel');
const Plan = require('../models/planModel');

const getPhonePeConfig = () => {
    const required = [
        'PHONEPE_MERCHANT_ID',
        'PHONEPE_SALT_KEY',
        'PHONEPE_SALT_INDEX',
        'FRONTEND_URL',
        'BACKEND_URL'
    ];
    const missing = required.filter((name) => !process.env[name]);

    if (missing.length) {
        throw new Error(`PhonePe is not configured. Missing: ${missing.join(', ')}`);
    }

    const environment = (process.env.PHONEPE_ENV || '').trim().toUpperCase();
    if (!['UAT', 'PROD', 'PRODUCTION'].includes(environment)) {
        throw new Error('PHONEPE_ENV must be set to UAT or PROD');
    }

    return {
        merchantId: process.env.PHONEPE_MERCHANT_ID,
        saltKey: process.env.PHONEPE_SALT_KEY,
        saltIndex: process.env.PHONEPE_SALT_INDEX,
        baseUrl: environment === 'UAT'
            ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
            : 'https://api.phonepe.com/apis/hermes'
    };
};

const initiatePayment = async (req, res) => {
    let config;
    try {
        config = getPhonePeConfig();
    } catch (error) {
        return res.status(503).json({ success: false, message: error.message });
    }

    try {
        const { planId } = req.body;
        const plan = await Plan.findById(planId);
        if (!plan || !plan.isActive) {
            return res.status(404).json({ success: false, message: 'Plan not found or unavailable' });
        }

        if (!Number.isFinite(plan.price) || plan.price <= 0) {
            return res.status(400).json({ success: false, message: 'Plan price is invalid' });
        }

        const merchantTransactionId = `MT${crypto.randomBytes(12).toString('hex')}`;
        const amount = Math.round(plan.price * 100);
        const frontendUrl = process.env.FRONTEND_URL.replace(/\/+$/, '');
        const backendUrl = process.env.BACKEND_URL.replace(/\/+$/, '');
        const paymentRequest = {
            merchantId: config.merchantId,
            merchantTransactionId,
            merchantUserId: req.user.id,
            amount,
            redirectUrl: `${frontendUrl}/payment/success?id=${encodeURIComponent(merchantTransactionId)}`,
            redirectMode: 'REDIRECT',
            callbackUrl: `${backendUrl}/api/payment/phonepe/callback`,
            paymentInstrument: { type: 'PAY_PAGE' }
        };

        if (req.user.phone) {
            paymentRequest.mobileNumber = req.user.phone;
        }

        const payload = Buffer.from(JSON.stringify(paymentRequest)).toString('base64');
        const checksum = crypto
            .createHash('sha256')
            .update(`${payload}/pg/v1/pay${config.saltKey}`)
            .digest('hex') + `###${config.saltIndex}`;

        const response = await fetch(`${config.baseUrl}/pg/v1/pay`, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            body: JSON.stringify({ request: payload })
        });
        const responseData = await response.json();

        if (!response.ok || responseData.success !== true) {
            console.error('PhonePe payment initiation failed:', responseData.message || response.status);
            return res.status(502).json({
                success: false,
                message: responseData.message || 'PhonePe could not start the payment'
            });
        }

        const redirectUrl = responseData.data?.instrumentResponse?.redirectInfo?.url;
        if (!redirectUrl) {
            console.error('PhonePe response did not include a payment redirect URL');
            return res.status(502).json({ success: false, message: 'PhonePe returned an invalid payment response' });
        }

        await Payment.create({
            user: req.user.id,
            plan: plan._id,
            merchantTransactionId,
            amount: plan.price,
            status: 'pending',
            provider: 'phonepe'
        });

        return res.status(200).json({ success: true, url: redirectUrl, merchantTransactionId });
    } catch (error) {
        console.error('PhonePe payment initiation error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to initiate PhonePe payment' });
    }
};

const checkStatus = async (req, res) => {
    let config;
    try {
        config = getPhonePeConfig();
    } catch (error) {
        return res.status(503).json({ success: false, message: error.message });
    }

    try {
        const { id: merchantTransactionId } = req.params;
        const payment = await Payment.findOne({
            merchantTransactionId,
            user: req.user._id,
            provider: 'phonepe'
        });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        if (payment.status === 'paid') {
            const user = await User.findById(payment.user).select('-password');
            return res.status(200).json({ success: true, message: 'Payment successful', user });
        }
        if (payment.status === 'failed') {
            return res.status(200).json({ success: false, failed: true, message: 'Payment was not completed' });
        }

        const endpoint = `/pg/v1/status/${config.merchantId}/${encodeURIComponent(merchantTransactionId)}`;
        const checksum = crypto
            .createHash('sha256')
            .update(`${endpoint}${config.saltKey}`)
            .digest('hex') + `###${config.saltIndex}`;
        const response = await fetch(`${config.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': config.merchantId
            }
        });
        const responseData = await response.json();

        if (['PAYMENT_ERROR', 'PAYMENT_DECLINED', 'TIMED_OUT'].includes(responseData.code)) {
            payment.status = 'failed';
            await payment.save();
            return res.status(200).json({ success: false, failed: true, message: 'Payment was not completed' });
        }

        if (!response.ok || responseData.success !== true) {
            console.error('PhonePe status request failed:', responseData.message || response.status);
            return res.status(502).json({ success: false, message: 'Unable to verify payment with PhonePe' });
        }

        const providerState = responseData.data?.state;
        if (responseData.code !== 'PAYMENT_SUCCESS' || providerState !== 'COMPLETED') {
            if (providerState === 'FAILED') {
                payment.status = 'failed';
                await payment.save();
                return res.status(200).json({ success: false, failed: true, message: 'Payment was not completed' });
            }
            return res.status(200).json({
                success: false,
                pending: true,
                message: 'Payment is still processing. Please wait.'
            });
        }

        if (responseData.data.amount !== Math.round(payment.amount * 100)) {
            console.error('PhonePe payment amount did not match the stored order');
            return res.status(502).json({ success: false, message: 'Payment amount verification failed' });
        }

        const [user, plan] = await Promise.all([
            User.findById(payment.user),
            Plan.findById(payment.plan)
        ]);
        if (!user || !plan) {
            return res.status(500).json({ success: false, message: 'Could not activate the purchased plan' });
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

        payment.status = 'paid';
        payment.providerPaymentId = responseData.data.transactionId;
        await payment.save();

        const updatedUser = await User.findById(user._id).select('-password');
        return res.status(200).json({ success: true, message: 'Payment successful', user: updatedUser });
    } catch (error) {
        console.error('PhonePe status verification error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to verify payment status' });
    }
};

const handleCallback = async (req, res) => {
    if (typeof req.body?.response !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid PhonePe callback payload' });
    }

    try {
        const callback = JSON.parse(Buffer.from(req.body.response, 'base64').toString('utf8'));
        if (!callback.data?.merchantTransactionId) {
            return res.status(400).json({ success: false, message: 'Invalid PhonePe callback payload' });
        }

        // The authenticated status check is authoritative; callbacks never grant access.
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid PhonePe callback payload' });
    }
};

module.exports = {
    initiatePayment,
    checkStatus,
    handleCallback
};
