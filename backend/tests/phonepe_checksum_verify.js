const crypto = require('crypto');

const [merchantId, saltKey, saltIndex] = process.argv.slice(2);
if (!merchantId || !saltKey || !saltIndex) {
    console.error('Usage: node phonepe_checksum_verify.js <MERCHANT_ID> <SALT_KEY> <SALT_INDEX>');
    process.exit(1);
}

const payload = Buffer.from(JSON.stringify({
    merchantId,
    merchantTransactionId: 'TXN_TEST_123',
    amount: 100,
    redirectUrl: 'https://example.com/payment/success',
    redirectMode: 'REDIRECT',
    paymentInstrument: { type: 'PAY_PAGE' }
})).toString('base64');

const payChecksum = crypto
    .createHash('sha256')
    .update(`${payload}/pg/v1/pay${saltKey}`)
    .digest('hex') + `###${saltIndex}`;
const statusChecksum = crypto
    .createHash('sha256')
    .update(`/pg/v1/status/${merchantId}/TXN_TEST_123${saltKey}`)
    .digest('hex') + `###${saltIndex}`;

if (!/^[a-f0-9]{64}###.+$/i.test(payChecksum) || !/^[a-f0-9]{64}###.+$/i.test(statusChecksum)) {
    console.error('PhonePe checksum calculation failed');
    process.exit(1);
}

console.log('PhonePe pay and status checksum calculations completed. Checksum values were not printed.');
