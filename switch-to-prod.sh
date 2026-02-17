#!/bin/bash
# Switch to Production Mode for Fit with Ram

# Set Backend Variables
if [ -f "backend/.env" ]; then
    echo "Updating backend/.env..."
    sed -i "" "s/PHONEPE_ENV=SHOULD_BE_UAT/PHONEPE_ENV=PROD/g" backend/.env
    sed -i "" "s/PHONEPE_MERCHANT_ID=PGTESTPAYUAT86/PHONEPE_MERCHANT_ID=YOUR_PROD_MERCHANT_ID/g" backend/.env
    sed -i "" "s/PHONEPE_SALT_KEY=96434309-7796-489d-8924-ab56988a6076/PHONEPE_SALT_KEY=YOUR_PROD_SALT_KEY/g" backend/.env
    sed -i "" "s/PHONEPE_SALT_INDEX=1/PHONEPE_SALT_INDEX=YOUR_PROD_SALT_INDEX/g" backend/.env
    sed -i "" "s/NODE_ENV=development/NODE_ENV=production/g" backend/.env
    echo "✅ backend/.env updated."
else
    echo "❌ backend/.env not found. Please create it first."
fi

echo ""
echo "--- NEXT STEPS ---"
echo "1. Replace 'YOUR_PROD_...' placeholders in backend/.env with real credentials."
echo "2. Set FRONTEND_URL and BACKEND_URL in your hosting provider's (Vercel/Railway) environment settings."
echo "3. Ensure NEXT_PUBLIC_API_URL is set in Vercel to your backend's public URL."

