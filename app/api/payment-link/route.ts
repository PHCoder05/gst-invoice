import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Define a type for Razorpay error
interface RazorpayError {
  statusCode?: number;
  error?: string;
  description?: string;
  message?: string;
  name?: string;
}

export async function POST(request: Request) {
  console.log("Payment link API route called");
  
  try {
    const body = await request.json();
    const { transactionId } = body;
    
    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
    }
    
    console.log("Creating payment link for transaction:", transactionId);
    
    // Create mock transaction data since we're having database issues
    const transaction = {
      id: transactionId,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      invoice_number: `INV-${transactionId.substring(0, 8)}`,
      invoice_date: new Date().toISOString().split('T')[0],
      subtotal: 1000,
      discount_type: 'fixed',
      discount_value: 0,
      discount_amount: 0,
      taxable_amount: 1000,
      cgst_amount: 90,
      sgst_amount: 90,
      total_amount: 1180,
      payment_status: 'pending',
      items: []
    };

    // Check for Razorpay credentials
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    console.log('Checking Razorpay credentials:', {
      key_id_exists: !!key_id,
      key_secret_exists: !!key_secret,
      key_id_prefix: key_id?.substring(0, 8)
    });

    if (!key_id || !key_secret) {
      console.error('Missing Razorpay credentials');
      return NextResponse.json({ 
        success: false, 
        error: 'Razorpay configuration is incomplete',
        details: 'Missing API keys'
      }, { status: 500 });
    }

    try {
      console.log('Initializing Razorpay instance');
      
      const razorpay = new Razorpay({
        key_id: key_id,
        key_secret: key_secret
      });

      // Convert amount to paise (Razorpay expects amount in paise)
      const amountInPaise = Math.round(transaction.total_amount * 100);
      
      console.log('Creating payment link with options:', {
        amount: amountInPaise,
        currency: "INR",
        description: `Payment for Invoice #${transaction.invoice_number}`,
        customer_details: {
          name: transaction.customer_name,
          email: transaction.customer_email
        }
      });

      // Create the payment link with more detailed options
      const paymentLink = await razorpay.paymentLink.create({
        amount: amountInPaise,
        currency: "INR",
        accept_partial: false,
        description: `Payment for Invoice #${transaction.invoice_number}`,
        customer: {
          name: transaction.customer_name,
          email: transaction.customer_email,
          contact: "+919876543210" // Valid 10-digit phone number with +91 prefix (total 13 chars)
        },
        notify: {
          email: true,
          sms: true
        },
        reminder_enable: true,
        notes: {
          transaction_id: transaction.id,
          invoice_number: transaction.invoice_number
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/transactions/${transaction.id}/invoice`,
        callback_method: "get",
        expire_by: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // Link expires in 7 days
        reference_id: transaction.invoice_number
      });

      console.log('Payment link created successfully:', {
        short_url: paymentLink.short_url,
        id: paymentLink.id,
        status: paymentLink.status
      });

      return NextResponse.json({
        success: true,
        paymentLink: paymentLink.short_url,
        paymentLinkId: paymentLink.id,
        amount: transaction.total_amount
      });

    } catch (error) {
      console.error("Error creating payment link:", error);
      
      // Safe error handling without type assumptions
      let statusCode = 500;
      let errorMessage = 'Failed to create payment link';
      let errorDetails = 'Unknown error occurred';
      
      // Safely check for 401 status
      if (error && typeof error === 'object') {
        const err = error as any;
        if (err.statusCode === 401) {
          statusCode = 401;
          errorMessage = 'Razorpay authentication failed';
          errorDetails = 'Invalid API keys. Please check your Razorpay dashboard for the correct credentials.';
        } else if (err.message) {
          errorDetails = err.message;
        }
      }
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage, 
        details: errorDetails,
        debug: {
          key_id_prefix: key_id?.substring(0, 8)
        }
      }, { status: statusCode });
    }
  } catch (error) {
    console.error('Error in payment link API route:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 