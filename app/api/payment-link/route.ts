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
  
  // Debug environment variables
  console.log("Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    RAZORPAY_KEY_ID_exists: !!process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET_exists: !!process.env.RAZORPAY_KEY_SECRET,
    NEXT_PUBLIC_RAZORPAY_KEY_ID_exists: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_APP_URL_exists: !!process.env.NEXT_PUBLIC_APP_URL
  });
  
  try {
    const body = await request.json();
    console.log("Request body received:", JSON.stringify(body));
    
    const { transactionId, amount, customerName, customerEmail, description, customerPhone } = body;
    
    console.log("Parsed request data:", {
      transactionId,
      amount: typeof amount === 'number' ? amount : `${amount} (${typeof amount})`,
      customerName: typeof customerName === 'string' ? customerName : `${customerName} (${typeof customerName})`,
      customerEmail,
      description,
      customerPhone
    });
    
    console.log("Received request body:", body);
    
    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
    }
    
    // Validate amount - ensure it's a valid number
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid amount', 
        details: 'Amount must be a valid number greater than 0' 
      }, { status: 400 });
    }
    
    // Validate customer name
    if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid customer name', 
        details: 'Customer name is required and cannot be empty' 
      }, { status: 400 });
    }
    
    console.log("Creating payment link for transaction:", transactionId);
    console.log("Amount:", numericAmount, "Type:", typeof numericAmount);
    console.log("Customer Name:", customerName, "Type:", typeof customerName);
    
    // Create transaction data from request body
    const transaction = {
      id: transactionId,
      customer_name: customerName.trim(),
      customer_email: customerEmail || 'customer@example.com',
      customer_phone: customerPhone || "+919876543210", // Use provided phone or default
      invoice_number: `INV-${transactionId.substring(0, 8)}`,
      invoice_date: new Date().toISOString().split('T')[0],
      total_amount: numericAmount,
      payment_status: 'pending'
    };

    // Check for Razorpay credentials
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
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
      
      try {
        const razorpay = new Razorpay({
          key_id: key_id,
          key_secret: key_secret
        });

        // Convert amount to paise (Razorpay expects amount in paise)
        const amountInPaise = Math.round(transaction.total_amount * 100);
        
        console.log('Creating payment link with options:', {
          amount: amountInPaise,
          currency: "INR",
          description: description || `Payment for Invoice #${transaction.invoice_number}`,
          customer_details: {
            name: transaction.customer_name,
            email: transaction.customer_email
          }
        });

        // Create the payment link with more detailed options
        const paymentLinkOptions = {
          amount: amountInPaise,
          currency: "INR",
          accept_partial: false,
          description: description || `Payment for Invoice #${transaction.invoice_number}`,
          customer: {
            name: transaction.customer_name,
            email: transaction.customer_email,
            contact: transaction.customer_phone // Use the phone from transaction data
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
        };
        
        console.log('Payment link options:', JSON.stringify(paymentLinkOptions));
        
        try {
          const paymentLink = await razorpay.paymentLink.create(paymentLinkOptions);

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
        } catch (razorpayError) {
          console.error("Razorpay API error:", razorpayError);
          
          // Extract detailed error information
          let errorDetails = "Unknown error";
          if (razorpayError && typeof razorpayError === 'object') {
            const err = razorpayError as any;
            if (err.error && err.error.description) {
              errorDetails = err.error.description;
            } else if (err.description) {
              errorDetails = err.description;
            } else if (err.message) {
              errorDetails = err.message;
            }
          }
          
          return NextResponse.json({ 
            success: false, 
            error: 'Razorpay API error',
            details: errorDetails
          }, { status: 400 });
        }
      } catch (razorpayInitError) {
        console.error("Error initializing Razorpay:", razorpayInitError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to initialize Razorpay',
          details: razorpayInitError instanceof Error ? razorpayInitError.message : String(razorpayInitError)
        }, { status: 500 });
      }
    } catch (error) {
      console.error('Error in payment link API route:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
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