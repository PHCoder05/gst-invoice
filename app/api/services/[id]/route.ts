import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabase-server';

// Get a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get user from the session to apply RLS
    const { data: { session } } = await supabaseServer.auth.getSession();
    const user_id = session?.user?.id;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data, error } = await supabaseServer
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Exception in GET /api/services/${params.id}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update a service
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Get user from the session to apply RLS
    const { data: { session } } = await supabaseServer.auth.getSession();
    const user_id = session?.user?.id;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if service exists and belongs to the user
    const { data: existingService, error: fetchError } = await supabaseServer
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    // Prepare update data
    const updateData = {
      name: body.name !== undefined ? body.name : existingService.name,
      description: body.description !== undefined ? body.description : existingService.description,
      price: body.price !== undefined ? (typeof body.price === 'number' ? body.price : parseFloat(body.price)) : existingService.price,
      active: body.active !== undefined ? body.active : existingService.active,
      hsn_code: body.hsn_code !== undefined ? body.hsn_code : existingService.hsn_code,
      gst_rate: body.gst_rate !== undefined ? (typeof body.gst_rate === 'number' ? body.gst_rate : parseFloat(body.gst_rate)) : existingService.gst_rate,
    };
    
    // Update the service
    const { data, error } = await supabaseServer
      .from('services')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Exception in PATCH /api/services/${params.id}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get user from the session to apply RLS
    const { data: { session } } = await supabaseServer.auth.getSession();
    const user_id = session?.user?.id;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the service is referenced in any invoices
    const { data: invoiceItems, error: checkError } = await supabaseServer
      .from('invoice_items')
      .select('id')
      .eq('service_id', id)
      .limit(1);
    
    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (invoiceItems && invoiceItems.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete service as it is referenced in one or more invoices' 
      }, { status: 400 });
    }
    
    // Delete the service
    const { error } = await supabaseServer
      .from('services')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Exception in DELETE /api/services/${params.id}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 