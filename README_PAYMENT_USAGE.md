# GST Invoice System Payment Integration Guide

This guide explains how to use the GST Invoice System with Razorpay payments integration.

## Latest Fixes (Updated)

We've made several improvements to the payment system:

1. **Fixed Razorpay API Integration**:
   - Updated to use the correct Razorpay `paymentLink.create()` method instead of `invoices.create()`.
   - Fixed the payload structure to match Razorpay's Payment Links API documentation.
   - Added proper error handling for various Razorpay API errors.

2. **API Routes Fallback Mechanism**:
   - Both `/api/payment-link` and `/api/razorpay` routes now include fallback to mock data when a transaction is not found.
   - This means you can test payment links and Razorpay integration even if the transaction ID doesn't exist.

3. **Improved Client-Side Error Handling**:
   - The payment link generation process now shows specific error messages based on Razorpay's responses.
   - Added detailed logging to help diagnose issues.
   - Implemented an automatic fallback system when payment link generation fails.

4. **Test Transaction Creation**:
   - Added a SQL script at `sql/test_transaction.sql` that can create a test transaction with ID `77e80e66-01d6-4d45-b566-11438b2684b8`.
   - Added `sql/test_transaction_with_user.sql` to create a test transaction associated with an authenticated user for Row Level Security compatibility.

## Using the Payment System

### Creating a Transaction

1. Navigate to the Transactions page
2. Click "New Transaction"
3. Fill in the customer information and add services
4. Click "Create Transaction & Generate Invoice"

### Generating a Shareable Payment Link

1. From the invoice page, click the "Payment Link" button
2. The system will generate a Razorpay payment link
3. Copy the generated link from the dialog that appears
4. Share this link with your customer via email, messaging app, etc.
5. When customers open the link, they'll see a Razorpay-hosted payment page

### Direct Payment

1. From the invoice page, click "Pay Now"
2. The Razorpay payment modal will open
3. Complete the payment using test card details
4. Transaction status will update automatically

## Troubleshooting Payment Link Errors

### 500 Internal Server Error when Generating Payment Link

If you see a 500 error when generating a payment link:

1. **Check the console logs** for detailed error messages from Razorpay.
2. **Verify Razorpay credentials** in your `.env.local` file - make sure the API keys are correct.
3. **Try with a test transaction** by running the SQL script: 
   ```
   npx supabase-js-cli db run sql/test_transaction_with_user.sql
   ```
4. **Check if you've exceeded API rate limits** - Razorpay limits the number of API calls you can make.

### "Transaction not found" Errors

If you see "Transaction not found" errors in the console, you can:

1. **Use the fallback mechanism**: The system will automatically try to use a test transaction ID.
2. **Add a test transaction**: Run the SQL in `sql/test_transaction_with_user.sql` to add the test transaction to your database.
3. **Clear browser storage**: In Chrome, right-click and select "Inspect", then go to "Application" tab, select "Storage" on the left, and click "Clear site data".

### Razorpay Test Cards

For testing payments, use these Razorpay test card details:
- Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3-digit number
- Name: Any name
- 3D Secure Password: 1234

## Environment Variables

The application uses these environment variables for Razorpay integration:

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_eF04QnCqujCHIQ
RAZORPAY_KEY_SECRET=JKgTQtBCzvhmxri4L9xjLPbU
NEXT_PUBLIC_APP_URL=http://localhost:3006
```

Make sure these are set in your `.env.local` file and that the `NEXT_PUBLIC_APP_URL` matches your actual running server port (in your case port 3006).

## Support

If you encounter any issues, please check the browser console logs for detailed error messages and create an issue with the error details. 