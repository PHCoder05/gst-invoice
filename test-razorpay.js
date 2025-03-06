// Simple script to test Razorpay API keys
require('dotenv').config({ path: '.env.local' });
const Razorpay = require('razorpay');

// Get Razorpay credentials from environment variables
// It's safer to use environment variables rather than hardcoding credentials
const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

console.log('Testing Razorpay credentials:');
console.log('Key ID:', KEY_ID ? `${KEY_ID.substring(0, 10)}...` : 'Not found');
console.log('Secret Key:', KEY_SECRET ? 'Available' : 'Not found');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET
});

// Test by creating a simple order
async function testCredentials() {
  try {
    // Make a simple API call (listing customers)
    const result = await razorpay.customers.all();
    console.log('API call succeeded!');
    console.log('Response:', JSON.stringify(result).substring(0, 100) + '...');
    console.log('Your Razorpay credentials are working properly.');
  } catch (error) {
    console.error('API call failed!');
    console.error('Error:', error.message);
    console.error('Your Razorpay credentials may be incorrect or expired.');
    
    if (error.statusCode === 401) {
      console.error('Authentication failed. Please check your API key and secret.');
    }
  }
}

// Run the test
testCredentials(); 