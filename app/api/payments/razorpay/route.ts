import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import supabaseServer from '@/lib/supabase-server';

// Initialize Razorpay config
const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

// Route to create a payment order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice_id } = body;
    
    if (!invoice_id) {
      return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
    }
    
    // Get user from the session to apply RLS
    const { data: { session } } = await supabaseServer.auth.getSession();
    const user_id = session?.user?.id;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch the invoice
    const { data: invoice, error: fetchError } = await supabaseServer
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .eq('user_id', user_id)
      .single();
    
    if (fetchError) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    // Prepare the order data
    const amount = Math.round(invoice.total * 100); // Amount in paise
    const currency = 'INR';
    const receipt = invoice.invoice_number;
    
    // Make the request to Razorpay API
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')}`
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes: {
          invoice_id: invoice_id,
          customer_name: invoice.customer_name,
          customer_email: invoice.customer_email
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        error: 'Failed to create Razorpay order',
        details: errorData
      }, { status: response.status });
    }
    
    const orderData = await response.json();
    
    // Return the order details to client
    return NextResponse.json({
      id: orderData.id,
      amount: orderData.amount / 100, // Convert paise to rupees for display
      currency: orderData.currency,
      receipt: orderData.receipt,
      key_id: razorpayKeyId,
      invoice_id
    });
  } catch (error) {
    console.error('Exception in POST /api/payments/razorpay:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Route to verify payment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      invoice_id
    } = body;
    
    // Verify all required parameters
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !invoice_id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // Get user from the session to apply RLS
    const { data: { session } } = await supabaseServer.auth.getSession();
    const user_id = session?.user?.id;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the payment signature
    const generated_signature = crypto
      .createHmac('sha256', razorpayKeySecret || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    
    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }
    
    // Verify invoice exists and belongs to user
    const { data: invoice, error: fetchError } = await supabaseServer
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .eq('user_id', user_id)
      .single();
    
    if (fetchError) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    // Update the invoice payment status
    const { data, error } = await supabaseServer
      .from('invoices')
      .update({
        status: 'paid',
        payment_id: razorpay_payment_id
      })
      .eq('id', invoice_id)
      .eq('user_id', user_id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: 'Failed to update invoice payment status' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      invoice: data
    });
  } catch (error) {
    console.error('Exception in PUT /api/payments/razorpay:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 