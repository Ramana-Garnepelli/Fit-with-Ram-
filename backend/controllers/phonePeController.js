const crypto = require('crypto');
const Payment = require('../models/paymentModel');
const User = require('../models/userModel');
const Plan = require('../models/planModel');

// PhonePe Sandbox Credentials
const MERCH_ID = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT86";
const SALT_KEY = process.env.PHONEPE_SALT_KEY || "96434309-7796-489d-8924-ab56988a6076";
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || 1;
const ENV = process.env.PHONEPE_ENV || "SHOULD_BE_UAT"; // "SHOULD_BE_UAT" for sandbox, "PROD" for production

const BASE_URL = ENV === "PROD"
    ? "https://api.phonepe.com/apis/hermes"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";

// @desc    Initiate PhonePe Payment
// @route   POST /api/payment/phonepe/initiate
// @access  Private
const initiatePayment = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.user.id;

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        const merchantTransactionId = `MT${Date.now()}`;
        // Hardcoding 1 Rupee (100 Paise) for testing as requested by user
        const amount = 100;

        // Custom mobile number for testing as requested
        const mobileNumber = "7036592919";

        const data = {
            merchantId: MERCH_ID,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: userId,
            amount: amount,
            redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?id=${merchantTransactionId}`,
            redirectMode: "REDIRECT",
            callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/phonepe/callback`,
            mobileNumber: mobileNumber,
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        const payload = JSON.stringify(data);
        const payloadMain = Buffer.from(payload).toString('base64');
        const keyIndex = SALT_INDEX;
        const stringToHash = payloadMain + "/pg/v1/pay" + SALT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const checksum = sha256 + "###" + keyIndex;

        console.log("PhonePe String to Hash:", stringToHash);
        console.log("PhonePe Payload Base64:", payloadMain);
        console.log("PhonePe Checksum:", checksum);

        const response = await fetch(`${BASE_URL}/pg/v1/pay`, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            body: JSON.stringify({
                request: payloadMain
            })
        });

        let responseData;
        const responseText = await response.text();
        console.log("PhonePe Raw Response:", responseText);

        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse PhonePe response as JSON");
            return res.status(500).json({ message: "Invalid response from PhonePe", success: false });
        }

        if (responseData.success) {
            // Save initial payment record
            await Payment.create({
                user: userId,
                plan: planId,
                razorpayOrderId: merchantTransactionId, // Reusing field for Transaction ID
                amount: plan.price,
                status: 'pending',
                provider: 'phonepe'
            });

            return res.status(200).json({
                url: responseData.data.instrumentResponse.redirectInfo.url,
                merchantTransactionId: merchantTransactionId
            });
        } else {
            return res.status(400).json({ message: responseData.message || "Payment initiation failed", success: false });
        }

    } catch (error) {
        console.error("PhonePe Init Error:", error.message);
        res.status(500).json({ message: error.message, success: false });
    }
};

// @desc    Check PhonePe Payment Status
// @route   POST /api/payment/phonepe/status/:id
// @access  Private
const checkStatus = async (req, res) => {
    const merchantTransactionId = req.params.id;

    const keyIndex = SALT_INDEX;
    const stringToHash = `/pg/v1/status/${MERCH_ID}/${merchantTransactionId}` + SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = sha256 + "###" + keyIndex;

    try {
        const url = `${BASE_URL}/pg/v1/status/${MERCH_ID}/${merchantTransactionId}`;
        console.log("Checking PhonePe Status at:", url);
        console.log("Status Checksum String:", stringToHash);
        console.log("Status Checksum:", checksum);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': MERCH_ID
            }
        });

        const responseText = await response.text();
        console.log("PhonePe Status Raw Response:", responseText);

        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse PhonePe response as JSON:", responseText);
            return res.status(500).json({
                success: false,
                message: "PhonePe returned non-JSON response",
                raw: responseText
            });
        }

        if (responseData.success === true && responseData.code === "PAYMENT_SUCCESS") {
            // Payment success - update DB
            const payment = await Payment.findOne({ razorpayOrderId: merchantTransactionId });

            if (payment && payment.status !== 'paid') {
                payment.status = 'paid';
                payment.razorpayPaymentId = responseData.data.transactionId; // Store provider ID
                await payment.save();

                // Grant access to user
                const user = await User.findById(payment.user);
                const plan = await Plan.findById(payment.plan);

                if (user && plan) {
                    user.purchases.push({
                        planId: payment.plan,
                        amount: payment.amount,
                        purchaseDate: new Date(),
                        validUntil: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
                    });

                    if (plan.workoutTemplate) user.workoutPlan = plan.workoutTemplate;
                    if (plan.dietTemplate) user.dietPlan = plan.dietTemplate;

                    user.activePlanType = plan.type;
                    user.currentDay = 1;
                    await user.save();
                }
            }

            return res.status(200).json({ success: true, message: "Payment Success" });
        } else {
            return res.status(400).json({ success: false, message: "Payment Failed or Pending" });
        }
    } catch (error) {
        console.error("PhonePe Status Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    initiatePayment,
    checkStatus
};
