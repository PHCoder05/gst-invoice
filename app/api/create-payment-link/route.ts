import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

// Environment variables from .env.local
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(request: Request) {
  console.log("Payment link creation API route called");
  
  // Verify Razorpay keys are available
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.error("Razorpay credentials missing:", {
      keyIdAvailable: !!RAZORPAY_KEY_ID,
      secretAvailable: !!RAZORPAY_KEY_SECRET
    });
    return NextResponse.json(
      { success: false, error: "Razorpay configuration is incomplete" },
      { status: 500 }
    );
  }
  
  console.log("Razorpay key ID:", RAZORPAY_KEY_ID.substring(0, 10) + "...");
  
  try {
    // Parse request body
    const body = await request.json();
    const { amount, customerName, customerEmail, invoiceId, description } = body;
    
    // Validate required fields
    if (!amount || !customerName || !invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: amount, customerName, invoiceId' },
        { status: 400 }
      );
    }
    
    console.log(`Creating payment link for invoice ${invoiceId}, amount: ${amount}`);
    
    // Initialize Razorpay with SDK instead of using the API directly
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });
    
    try {
      // Create payment link using Razorpay SDK
      const paymentLinkData = {
        amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
        currency: 'INR',
        accept_partial: false,
        description: description || `Payment for Invoice #${invoiceId}`,
        customer: {
          name: customerName,
          email: customerEmail || '', // Email is optional
          contact: '', // Phone is optional
        },
        notify: {
          email: Boolean(customerEmail),
          sms: false,
        },
        reminder_enable: true,
        notes: {
          invoice_id: invoiceId,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?invoice_id=${invoiceId}`,
        callback_method: 'get',
      };
      
      console.log('Creating payment link with data:', JSON.stringify(paymentLinkData));
      
      // Use Razorpay SDK to create payment link
      const paymentLink = await razorpay.paymentLink.create(paymentLinkData);
      
      console.log('Payment link created successfully:', paymentLink.short_url);
      
      // Store the payment link in Supabase (assuming there's a transactions table)
      try {
        const { error } = await supabase
          .from('transactions')
          .update({ 
            payment_link: paymentLink.short_url,
            payment_link_id: paymentLink.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);
        
        if (error) {
          console.warn('Failed to store payment link in database:', error);
          // Continue anyway since we have the payment link
        }
      } catch (dbError) {
        console.warn('Database error while storing payment link:', dbError);
        // Continue anyway since we have the payment link
      }
      
      // Return success response with payment link
      return NextResponse.json({
        success: true,
        paymentLink: paymentLink.short_url,
        paymentLinkId: paymentLink.id,
        amount: amount,
      });
    } catch (razorpayError) {
      console.error('Razorpay error details:', razorpayError);
      
      let errorMessage = "Failed to create payment link";
      let errorDetails = "Unknown error";
      
      if (razorpayError instanceof Error) {
        errorDetails = razorpayError.message;
        
        // Check for authentication errors specifically
        if (errorDetails.includes("auth") || errorDetails.includes("401")) {
          errorDetails = "Authentication failed. Please check your Razorpay API keys.";
        }
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage, details: errorDetails },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error in payment link creation API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 