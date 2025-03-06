import supabaseClient from './supabase';

// Define the Client type if it's not already imported
export type Client = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gstin?: string;
  notes?: string;
  created_at: string;
  user_id?: string;
}

export async function getClients() {
  try {
    console.log('Fetching clients from Supabase...');
    
    if (!supabaseClient) {
      console.error('Supabase client is not available');
      return [];
    }
    
    // Get clients from Supabase
    const { data, error } = await supabaseClient
      .from('clients')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching clients from Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      return [];
    }
    
    console.log(`Found ${data.length} clients in Supabase`);
    return data;
  } catch (e) {
    console.error('Exception in getClients:', e);
    return [];
  }
}

export async function getClient(id: string) {
  try {
    console.log('Fetching client with ID:', id);
    
    if (!supabaseClient) {
      console.error('Supabase client is not available');
      return null;
    }
    
    // Get client from Supabase
    const { data, error } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching client from Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      return null;
    }
    
    console.log('Client found in Supabase:', data);
    return data;
  } catch (e) {
    console.error('Exception in getClient:', e);
    return null;
  }
}

export async function createClient(client: Omit<Client, "id" | "created_at">) {
  try {
    console.log('Creating client with data:', JSON.stringify(client, null, 2));
    
    if (!supabaseClient) {
      console.error('Supabase client is not available');
      return null;
    }
    
    // Ensure all required fields are present
    const clientData = {
      name: client.name || 'Unnamed Client',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      gstin: client.gstin || '',
      notes: client.notes || '',
    };
    
    console.log('Normalized client data:', JSON.stringify(clientData, null, 2));
    
    // Insert the client into Supabase
    const { data, error } = await supabaseClient
      .from('clients')
      .insert([clientData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating client in Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error message:', error.message);
      return null;
    }
    
    console.log('Client created successfully in Supabase:', data);
    return data as Client;
  } catch (e) {
    console.error('Exception in createClient:', e);
    return null;
  }
}

export async function updateClient(id: string, client: Partial<Omit<Client, "id" | "created_at">>) {
  try {
    console.log('Updating client with ID:', id);
    console.log('Update data:', JSON.stringify(client, null, 2));
    
    if (!supabaseClient) {
      console.error('Supabase client is not available');
      return null;
    }
    
    // Update the client in Supabase
    const { data, error } = await supabaseClient
      .from('clients')
      .update(client)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating client in Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      return null;
    }
    
    console.log('Client updated successfully in Supabase:', data);
    return data as Client;
  } catch (e) {
    console.error('Exception in updateClient:', e);
    return null;
  }
}

export async function deleteClient(id: string) {
  try {
    console.log('Deleting client with ID:', id);
    
    if (!supabaseClient) {
      console.error('Supabase client is not available');
      return false;
    }
    
    // Delete the client from Supabase
    const { error } = await supabaseClient
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting client from Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      return false;
    }
    
    console.log('Client deleted successfully from Supabase');
    return true;
  } catch (e) {
    console.error('Exception in deleteClient:', e);
    return false;
  }
} 