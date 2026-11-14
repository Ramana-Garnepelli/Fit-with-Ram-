# PhonePe Production Setup

The backend uses PhonePe's payment page and verifies transaction status directly with PhonePe before activating a plan. It does not contain test credentials or simulate successful payments. UAT and production both charge the plan's configured price; use only PhonePe test accounts in UAT.

## Required configuration

Set these backend environment variables locally in `backend/.env` or in your hosting provider's secret/environment settings:

```env
PHONEPE_ENV=PROD
PHONEPE_MERCHANT_ID=<production merchant ID>
PHONEPE_SALT_KEY=<production salt key>
PHONEPE_SALT_INDEX=<production salt index>
FRONTEND_URL=https://fitwithram.com
BACKEND_URL=https://api.fitwithram.com
MONGODB_URI=<persistent MongoDB connection string>
JWT_SECRET=<long random secret>
```

For PhonePe's test environment, set `PHONEPE_ENV=UAT` and use the UAT credentials from your PhonePe account. Do not copy production credentials into the repository, frontend, or chat. Configure the PhonePe redirect and callback URLs to match the `FRONTEND_URL` and `BACKEND_URL` values.

The production backend requires `MONGODB_URI` and `JWT_SECRET` and will not fall back to an in-memory database. PhonePe payment initiation returns a configuration error until its merchant credentials and public URLs are set.

## Customer payment flow

1. A signed-in customer chooses an active plan.
2. The backend creates a PhonePe payment for the full plan price and returns PhonePe's hosted checkout URL.
3. PhonePe returns the customer to `/payment/success` with the merchant transaction ID.
4. The backend checks the transaction and amount with PhonePe, then activates the plan once for the owning customer.
5. The customer is redirected to the dashboard after confirmation. A still-processing transaction remains pending and can be checked again.

Never treat the browser redirect or callback alone as proof of payment. The backend status verification is authoritative.
