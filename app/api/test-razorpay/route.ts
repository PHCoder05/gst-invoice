import { NextResponse } from 'next/server';

export async function GET() {
  // Check for Razorpay credentials
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  return NextResponse.json({
    success: true,
    environment: process.env.NODE_ENV,
    credentials: {
      key_id_exists: !!key_id,
      key_secret_exists: !!key_secret,
      key_id_prefix: key_id ? key_id.substring(0, 8) : null,
    },
    public_url: process.env.NEXT_PUBLIC_APP_URL
  });
} 