# Production PhonePe Integration Guide

## Overview

This guide explains how to switch from PhonePe sandbox (UAT) to production environment.

## Current Status

The application is currently configured for **PhonePe Sandbox (UAT)** environment for testing purposes.

## Prerequisites for Production

1. **PhonePe Business Account**: You need an approved PhonePe Business account
2. **Production Credentials**: Obtain from PhonePe Business Dashboard
   - Merchant ID
   - Salt Key
   - Salt Index (usually 1)

## Getting Production Credentials

1. Log in to [PhonePe Business Dashboard](https://business.phonepe.com/)
2. Navigate to "Developers" or "API" section
3. Find your production credentials:
   - Merchant ID
   - Salt Key
   - Salt Index

## Configuration Changes

### Backend Environment Variables

Update your `.env` file (or hosting platform environment variables):

```env
# Change from UAT to PRODUCTION
PHONEPE_ENV=PRODUCTION

# Replace with your production credentials
PHONEPE_MERCHANT_ID=your_production_merchant_id
PHONEPE_SALT_KEY=your_production_salt_key
PHONEPE_SALT_INDEX=1
```

### Code Changes

The code in `backend/controllers/phonePeController.js` automatically switches between sandbox and production based on the `PHONEPE_ENV` variable:

```javascript
const BASE_URL = ENV === "PROD" || ENV === "PRODUCTION"
    ? "https://api.phonepe.com/apis/hermes"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";
```

**No code changes needed** - just update environment variables!

### Update Callback URLs

In PhonePe Business Dashboard, configure:

1. **Redirect URL**: `https://fitwithram.com/payment/success?id={merchantTransactionId}`
2. **Callback URL**: `https://api.fitwithram.com/api/payment/phonepe/callback`

Replace with your actual production domain.

## Testing Checklist

Before going live:

- [ ] Production credentials configured
- [ ] Callback URLs updated in PhonePe dashboard
- [ ] Test with small amount (₹1 or ₹10)
- [ ] Verify payment success flow
- [ ] Verify payment failure handling
- [ ] Check database updates correctly
- [ ] Verify user gets access to purchased plan

## Important Differences: Sandbox vs Production

| Feature | Sandbox (UAT) | Production |
|---------|---------------|------------|
| Base URL | `api-preprod.phonepe.com` | `api.phonepe.com` |
| Test Payments | Simulated | Real money |
| Credentials | Test credentials | Production credentials |
| Simulator | PhonePe Simulator app | Real PhonePe app |

## Security Notes

1. **Never commit production credentials** to Git
2. **Use environment variables** for all sensitive data
3. **Keep Salt Key secret** - never expose in frontend code
4. **Monitor transactions** regularly in PhonePe dashboard
5. **Set up alerts** for failed payments

## Rollback Plan

If production integration has issues:

1. Change `PHONEPE_ENV=UAT` in environment variables
2. Restart backend service
3. System will automatically use sandbox again

## Support

For PhonePe integration issues:
- PhonePe Business Support: support@phonepe.com
- PhonePe Developer Docs: https://developer.phonepe.com/

### Automated Production Logic ✅

The current implementation in `backend/controllers/phonePeController.js` is already designed for a "hands-free" production switch:

#### 1. Dynamic Amount
The code automatically detects if it's in a production environment:
```javascript
const amount = process.env.NODE_ENV === 'production' ? plan.price * 100 : 100;
```
- **In Development**: Charges ₹1 (for safe testing).
- **In Production**: Charges the actual `plan.price`.

#### 2. Dynamic Mobile Number
Uses the actual user's phone number recorded during signup:
```javascript
const mobileNumber = req.user.phone || "7036592919";
```

#### 3. Secured Base URL
Automatically switches to the PhonePe production API when `PHONEPE_ENV=PROD`:
```javascript
const BASE_URL = ENV === "PROD" ? "https://api.phonepe.com/apis/hermes" : "...";
```
