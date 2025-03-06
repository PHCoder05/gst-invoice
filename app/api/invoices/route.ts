import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabase-server';
import { Invoice, InvoiceItem } from '@/lib/invoices';

// Generate invoice number with a prefix, current year, and sequential number
function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().substring(2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}${day}-${random}`;
}

// Get all invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Get user from the session to apply RLS
    const { data: { session } } = await supabaseServer.auth.getSession();
    const user_id = session?.user?.id;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let query = supabaseServer
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('user_id', user_id)
      .order('invoice_date', { ascending: false });
    
    // Filter by status if provided
    if (status !== null && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Format the response
    const formattedInvoices = data.map(invoice => ({
      ...invoice,
      items: invoice.items || []
    }));
    
    return NextResponse.json(formattedInvoices);
  } catch (error) {
    console.error('Exception in GET /api/invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get user from the session to apply RLS
    const { data: { session } } = await supabaseServer.auth.getSession();
    const user_id = session?.user?.id;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate required fields
    if (
      !body.customer_name || 
      !body.customer_email ||
      !body.invoice_date ||
      body.subtotal === undefined ||
      body.tax === undefined ||
      body.total === undefined ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Generate invoice number
    const invoice_number = body.invoice_number || generateInvoiceNumber();
    
    // Calculate totals from items for validation
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    
    body.items.forEach((item: any) => {
      const itemTotal = (item.price * item.quantity);
      calculatedSubtotal += itemTotal;
      calculatedTax += itemTotal * (item.gst_rate / 100);
    });
    
    const calculatedTotal = calculatedSubtotal + calculatedTax - (body.discount || 0);
    
    // Validate totals (allow small floating point differences)
    if (
      Math.abs(calculatedSubtotal - body.subtotal) > 0.01 ||
      Math.abs(calculatedTax - body.tax) > 0.01 ||
      Math.abs(calculatedTotal - body.total) > 0.01
    ) {
      return NextResponse.json({ 
        error: 'Invoice totals do not match item calculations',
        calculated: { subtotal: calculatedSubtotal, tax: calculatedTax, total: calculatedTotal },
        provided: { subtotal: body.subtotal, tax: body.tax, total: body.total }
      }, { status: 400 });
    }
    
    // Prepare invoice data
    const invoiceData = {
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_gstin: body.customer_gstin || null,
      customer_address: body.customer_address || null,
      invoice_number,
      invoice_date: body.invoice_date,
      due_date: body.due_date || null,
      subtotal: body.subtotal,
      tax: body.tax,
      discount: body.discount || 0,
      total: body.total,
      notes: body.notes || null,
      status: body.status || 'draft',
      user_id
    };
    
    // Start a transaction
    const { data, error } = await supabaseServer.rpc('create_invoice_with_items', {
      invoice_data: invoiceData,
      items_data: body.items.map((item: any) => ({
        service_id: item.service_id || null,
        name: item.name,
        description: item.description || null,
        hsn_code: item.hsn_code,
        price: item.price,
        quantity: item.quantity,
        gst_rate: item.gst_rate,
        amount: item.price * item.quantity
      }))
    });
    
    if (error) {
      console.error('Error creating invoice:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Fetch the created invoice with its items
    const { data: createdInvoice, error: fetchError } = await supabaseServer
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('id', data.invoice_id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching created invoice:', fetchError);
      return NextResponse.json({ 
        error: 'Invoice created but could not fetch the complete data',
        invoice_id: data.invoice_id
      }, { status: 201 });
    }
    
    return NextResponse.json(createdInvoice, { status: 201 });
  } catch (error) {
    console.error('Exception in POST /api/invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 