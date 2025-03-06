# How to Get Valid Razorpay API Keys

The current Razorpay API keys in your `.env.local` file are not working. Follow these steps to get valid API keys:

## 1. Log in to Your Razorpay Dashboard

Go to [https://dashboard.razorpay.com](https://dashboard.razorpay.com) and log in with your credentials.

## 2. Navigate to API Keys Section

1. Click on the **Settings** gear icon in the sidebar
2. In the dropdown menu, select **API Keys**

## 3. Generate New API Keys

1. Click on **Generate Key** button
2. You'll be asked to enter your password to confirm
3. Razorpay will generate a new **Key ID** and **Key Secret**
4. **IMPORTANT**: The Key Secret will be shown only once, so copy it immediately

## 4. Update Your Environment Variables

Replace the values in your `.env.local` file with your new keys:

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_new_key_id
RAZORPAY_KEY_SECRET=your_new_key_secret
```

## 5. Test Your New Credentials

Run the test script to verify your new credentials:

```
node test-razorpay.js
```

## Note on Test Mode vs. Live Mode

- **Test Mode Keys**: Start with `rzp_test_` and can only be used for testing
- **Live Mode Keys**: Start with `rzp_live_` and are used for real transactions

Make sure you're using the appropriate keys for your environment. For development, it's recommended to use test mode keys.

## Additional Configuration for Payment Links

If you specifically need to create payment links, make sure your account has the Payment Links feature enabled. You might need to contact Razorpay support if you don't see this option in your dashboard. 