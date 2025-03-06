import { NextResponse } from 'next/server';
import { createTransaction, generateInvoiceNumber } from '@/lib/supabase';

// Create a transaction API route
export async function POST(request: Request) {
  console.log("Transaction API route called");
  
  try {
    const body = await request.json();
    
    // Check if this is a test transaction request
    const isTestTransaction = body.isTestTransaction === true;
    
    // If it's a test transaction, create a predefined test transaction
    if (isTestTransaction) {
      console.log("Creating test transaction");
      
      const testTransaction = {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_gstin: 'TEST1234567890',
        customer_address: '123 Test Street, Test City',
        invoice_number: generateInvoiceNumber(),
        invoice_date: new Date().toISOString().split('T')[0],
        subtotal: 1000,
        discount_type: 'fixed' as 'fixed',
        discount_value: 0,
        discount_amount: 0,
        taxable_amount: 1000,
        cgst_amount: 90,
        sgst_amount: 90,
        total_amount: 1180,
        payment_status: 'pending' as 'pending',
        items: [
          {
            service_id: '00000000-0000-0000-0000-000000000001',
            service_name: 'Test Service',
            service_description: 'Test Service Description',
            hsn_code: '9983',
            price: 1000,
            gst_rate: 18,
            quantity: 1
          }
        ]
      };
      
      const transaction = await createTransaction(testTransaction);
      
      if (!transaction) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create test transaction'
        }, { status: 500 });
      }
      
      console.log("Test transaction created successfully:", transaction.id);
      
      return NextResponse.json({
        success: true,
        message: 'Test transaction created successfully',
        transaction
      });
    }
    
    // For regular transactions, validate required fields
    if (!body.customer_name || !body.customer_email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: customer_name, customer_email'
      }, { status: 400 });
    }
    
    // Ensure invoice_number is generated if not provided
    if (!body.invoice_number) {
      body.invoice_number = generateInvoiceNumber();
    }
    
    // Ensure invoice_date is set if not provided
    if (!body.invoice_date) {
      body.invoice_date = new Date().toISOString().split('T')[0];
    }
    
    // Create transaction in Supabase
    const transaction = await createTransaction(body);
    
    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create transaction in database'
      }, { status: 500 });
    }
    
    console.log(`Transaction created successfully with ID: ${transaction.id}`);
    
    return NextResponse.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create transaction',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 