const crypto = require('crypto');

/**
 * PhonePe Checksum Verification Utility
 * Use this to verify your production credentials and checksum calculation.
 */

const MERCH_ID = process.argv[2] || "PGTESTPAYUAT86";
const SALT_KEY = process.argv[3] || "96434309-7796-489d-8924-ab56988a6076";
const SALT_INDEX = process.argv[4] || 1;

console.log("--- PhonePe Checksum Tester ---");
console.log(`Merchant ID: ${MERCH_ID}`);
console.log(`Salt Key: ${SALT_KEY.substring(0, 4)}...`);
console.log(`Salt Index: ${SALT_INDEX}`);

// Test Case: Standard Pay Initiation Checksum
const data = {
    merchantId: MERCH_ID,
    merchantTransactionId: "TXN_TEST_123",
    amount: 100,
    redirectUrl: "https://fitwithram.com",
    redirectMode: "REDIRECT",
    paymentInstrument: { type: "PAY_PAGE" }
};

const payload = JSON.stringify(data);
const payloadBase64 = Buffer.from(payload).toString('base64');
const stringToHash = payloadBase64 + "/pg/v1/pay" + SALT_KEY;
const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
const checksum = sha256 + "###" + SALT_INDEX;

console.log("\n[Pay Initiation Checksum]");
console.log("Payload (Base64):", payloadBase64);
console.log("String to Hash:", stringToHash);
console.log("Final X-VERIFY Checksum:", checksum);

// Test Case: Status Check Checksum
const transId = "TXN_TEST_123";
const statusStringToHash = `/pg/v1/status/${MERCH_ID}/${transId}` + SALT_KEY;
const statusSha256 = crypto.createHash('sha256').update(statusStringToHash).digest('hex');
const statusChecksum = statusSha256 + "###" + SALT_INDEX;

console.log("\n[Status Check Checksum]");
console.log("String to Hash:", statusStringToHash);
console.log("Final X-VERIFY Checksum:", statusChecksum);

console.log("\nUsage:");
console.log("node phonepe_checksum_verify.js [MERCHANT_ID] [SALT_KEY] [SALT_INDEX]");
