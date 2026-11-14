#!/bin/bash
set -euo pipefail

ENV_FILE="backend/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "Missing $ENV_FILE. Configure production variables in your deployment environment."
    exit 1
fi

if ! grep -Eq '^PHONEPE_ENV=(PROD|PRODUCTION)$' "$ENV_FILE"; then
    echo "Set PHONEPE_ENV=PROD after entering your production PhonePe credentials."
    exit 1
fi

missing=()
for key in PHONEPE_MERCHANT_ID PHONEPE_SALT_KEY PHONEPE_SALT_INDEX MONGODB_URI JWT_SECRET FRONTEND_URL BACKEND_URL; do
    value="$(sed -n "s/^${key}=//p" "$ENV_FILE" | head -n 1)"
    case "$value" in
        ""|your_*|YOUR_*|*placeholder*|*PLACEHOLDER*) missing+=("$key") ;;
    esac
done

if [ "${#missing[@]}" -gt 0 ]; then
    echo "Missing or placeholder production settings: ${missing[*]}"
    exit 1
fi

echo "Required production settings are present. This check does not verify PhonePe account approval or test a live charge."
