// utils/payuClient.js
import axios from'axios';
import crypto from 'crypto';

const PAYU_KEY = process.env.MERCHANT_KEY;
const PAYU_SALT = process.env.MERCHANT_SALT;

if (!PAYU_KEY || !PAYU_SALT) {
  throw new Error('PayU credentials are missing in environment variables');
}

const generateHash = (key, command, var1, salt) => {//generate hash to authenticate request
  const hashString = `${key}|${command}|${var1}|${salt}`;
  return crypto.createHash('sha512').update(hashString).digest('hex');
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const verifyPayment = async (txnid, retries = 3, delayMs = 3000) => {
  console.log("payuClient txnId:", txnid);

  const command = 'verify_payment';
  const hash = generateHash(PAYU_KEY, command, txnid, PAYU_SALT);//generate hash to authenticate request

  const payload = new URLSearchParams({//prepare a payload to verify your payment with txnid
    key: PAYU_KEY,
    command,
    hash,
    var1: txnid,
  });

  const PAYU_VERIFY_URL = 'https://test.payu.in/merchant/postservice?form=2';

  for (let attempt = 1; attempt <= retries; attempt++) {//tries verification upto 3 times with 3sec delay for each
    try {
      const response = await axios.post(PAYU_VERIFY_URL, payload, {//make verify call with payload
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000,
      });

      const responseData = typeof response.data === 'string'
        ? JSON.parse(response.data)
        : response.data;

      console.log(`Attempt ${attempt}:`, responseData);

      if (responseData.status === 1) {//If the verification was successful (status === 1), return the result immediately.
        return responseData; // Successfully verified
      }

      if (attempt < retries) {//If it failed but retries are still left, wait and retry.
        console.warn(`Verification failed: ${responseData.msg}. Retrying in ${delayMs / 1000}s...`);
        await delay(delayMs);
      } else {
        throw new Error(`Failed to verify transaction after ${retries} attempts. Last message: ${responseData.msg}`);
      }

    } catch (error) {
      console.error(`Attempt ${attempt} error:`, error?.response?.data || error?.message || error);
      if (attempt < retries) {
        await delay(delayMs);
      } else {
        throw error;
      }
    }
  }
};

export { verifyPayment };