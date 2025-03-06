import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/lib/supabase-server';
import { Service } from '@/types/service';

// Get all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    
    // Get user from the session to apply RLS
    const { data: { session } } = await supabaseServer.auth.getSession();
    const user_id = session?.user?.id;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let query = supabaseServer
      .from('services')
      .select('*')
      .eq('user_id', user_id)
      .order('name');
    
    // Filter by active status if provided
    if (active !== null) {
      query = query.eq('active', active === 'true');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Exception in GET /api/services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new service
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
    if (!body.name || body.price === undefined || !body.hsn_code || body.gst_rate === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Prepare service data with user_id
    const serviceData = {
      name: body.name,
      description: body.description || '',
      price: typeof body.price === 'number' ? body.price : parseFloat(body.price),
      active: body.active !== undefined ? body.active : true,
      hsn_code: body.hsn_code,
      gst_rate: typeof body.gst_rate === 'number' ? body.gst_rate : parseFloat(body.gst_rate),
      user_id
    };
    
    // Insert the service
    const { data, error } = await supabaseServer
      .from('services')
      .insert([serviceData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Exception in POST /api/services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 