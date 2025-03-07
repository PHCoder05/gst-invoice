import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Service as ServiceType } from '@/types/service';

// Helper function to check if a string is a valid URL
function isValidUrl(urlString: string | undefined): boolean {
  if (!urlString) return false;
  
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
}

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// For debugging purposes
console.log(`Supabase URL (redacted): ${supabaseUrl ? `${supabaseUrl.substring(0, 8)}...` : 'undefined'}`);
console.log(`Supabase Anon Key provided: ${supabaseAnonKey ? 'Yes' : 'No'}`);

// Create a mock Supabase client that mimics the structure but doesn't do anything
const createMockClient = (): SupabaseClient => {
  console.warn('Using mock Supabase client. Your app will work, but no data will be stored or retrieved.');
  
  // Cast to unknown first to avoid TypeScript errors
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
          delete: () => Promise.resolve({ error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ error: null }),
        insert: () => ({
          select: () => Promise.resolve({ data: null, error: null }),
        }),
        update: () => ({
          eq: () => ({
            select: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      insert: () => ({
        select: () => Promise.resolve({ data: null, error: null }),
      }),
      update: () => ({
        eq: () => ({
          select: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInAnonymously: () => Promise.resolve({ data: null, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  } as unknown as SupabaseClient;
};

// Determine whether to use a real or mock client
let supabase: SupabaseClient;

// ONLY create a real client if we're 100% sure we have valid inputs
if (typeof supabaseUrl === 'string' && 
    supabaseUrl.startsWith('https://') && 
    supabaseUrl.includes('.supabase.co') && 
    typeof supabaseAnonKey === 'string' && 
    supabaseAnonKey.length > 10) {
    
  try {
    // Create the real client
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    console.log('Supabase client initialized with real credentials');
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // Fall back to mock client if real one fails
    supabase = createMockClient();
  }
} else {
  // Use mock client if environment variables aren't properly set
  supabase = createMockClient();
}

// Helper function to safely access localStorage (avoid SSR issues)
export function safeLocalStorage() {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  
  // Return a mock localStorage for SSR
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

// Export the supabase client as default
export default supabase;

// Export a safer checkAuth function
export async function checkAuth() {
  try {
    console.log('Checking authentication status');
    
    // Actually check the auth status with Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error in checkAuth:', error);
      return { data: null, error };
    }
    
    if (!data.session) {
      console.log('No session found, signing in anonymously');
      
      // Sign in anonymously to get a token for RLS
      const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
      
      if (signInError) {
        console.error('Error signing in anonymously:', signInError);
        return { data: null, error: signInError };
      }
      
      console.log('Anonymous auth successful');
      return { data: signInData, error: null };
    }
    
    console.log('User is already authenticated');
    return { data, error: null };
  } catch (e) {
    console.error('Exception in checkAuth function:', e);
    return { data: null, error: e };
  }
}

// Type definitions
export type Service = {
  id: string
  name: string
  description: string
  price: number
  active: boolean
  created_at: string
  hsn_code: string
  gst_rate: number
}

export type Customer = {
  name: string
  email: string
  gstin?: string
  address?: string
}

export type TransactionItem = {
  id?: string
  transaction_id?: string
  service_id: string
  service_name: string
  service_description: string
  hsn_code: string
  price: number
  gst_rate: number
  quantity: number
}

export type Transaction = {
  id: string
  customer_name: string
  customer_email: string
  customer_gstin?: string
  customer_address?: string
  invoice_number: string
  invoice_date: string
  subtotal: number
  discount_type: "percentage" | "fixed"
  discount_value: number
  discount_amount: number
  taxable_amount: number
  cgst_amount: number
  sgst_amount: number
  total_amount: number
  payment_status: "pending" | "paid"
  payment_id?: string
  items: TransactionItem[]
  created_at?: string
}

// Service functions
export async function getServices() {
  try {
    console.log('Fetching services from Supabase...');
    
    if (!supabase) {
      console.error('Supabase client is not available');
      return [];
    }
    
    // Get services from Supabase
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching services from Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      return [];
    }
    
    console.log(`Found ${data.length} services in Supabase`);
    return data;
  } catch (e) {
    console.error('Exception in getServices:', e);
    return [];
  }
}

export async function getService(id: string) {
  try {
    console.log('Fetching service with ID:', id);
    
    if (!supabase) {
      console.error('Supabase client is not available');
      return null;
    }
    
    // Get service from Supabase
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching service from Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      return null;
    }
    
    console.log('Service found in Supabase:', data);
    return data;
  } catch (e) {
    console.error('Exception in getService:', e);
    return null;
  }
}

export async function createService(service: Omit<Service, "id" | "created_at">) {
  try {
    console.log('Creating service with data:', JSON.stringify(service, null, 2));
    
    if (!supabase) {
      console.error('Supabase client is not available');
      return null;
    }
    
    // Check authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Authentication error before creating service:', authError);
      return null;
    }
    
    if (!authData.session) {
      console.error('No session found before creating service. Trying to sign in anonymously.');
      
      const { error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) {
        console.error('Failed to sign in anonymously:', signInError);
        return null;
      }
    }
    
    // Ensure all required fields are present
    const serviceData = {
      name: service.name || 'Unnamed Service',
      description: service.description || '',
      price: typeof service.price === 'number' ? service.price : parseFloat(service.price as any) || 0,
      active: service.active !== undefined ? service.active : true,
      hsn_code: service.hsn_code || '998311', // Default HSN code
      gst_rate: typeof service.gst_rate === 'number' ? service.gst_rate : parseFloat(service.gst_rate as any) || 18,
    };
    
    console.log('Normalized service data:', JSON.stringify(serviceData, null, 2));
    
    // Insert the service into Supabase
    const { data, error } = await supabase
      .from('services')
      .insert([serviceData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating service in Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error message:', error.message);
      return null;
    }
    
    console.log('Service created successfully in Supabase:', data);
    return data as Service;
  } catch (e) {
    console.error('Exception in createService:', e);
    return null;
  }
}

export async function updateService(id: string, service: Partial<Omit<Service, "id" | "created_at">>) {
  try {
    console.log('Updating service with ID:', id);
    console.log('Update data:', JSON.stringify(service, null, 2));
    
    if (!supabase) {
      console.error('Supabase client is not available');
      return null;
    }
    
    // Update the service in Supabase
    const { data, error } = await supabase
      .from('services')
      .update(service)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating service in Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      return null;
    }
    
    console.log('Service updated successfully in Supabase:', data);
    return data as Service;
  } catch (e) {
    console.error('Exception in updateService:', e);
    return null;
  }
}

export async function deleteService(id: string) {
  try {
    console.log('Deleting service with ID:', id);
    
    if (!supabase) {
      console.error('Supabase client is not available');
      return false;
    }
    
    // Delete the service from Supabase
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting service from Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      return false;
    }
    
    console.log('Service deleted successfully from Supabase');
    return true;
  } catch (e) {
    console.error('Exception in deleteService:', e);
    return false;
  }
}

// Transaction functions
export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return data as Transaction[];
}

export async function getTransaction(id: string) {
  try {
    console.log('Fetching transaction with ID:', id);
    
    // Check if the ID looks like a mock ID (for development/testing)
    if (id.startsWith('mock-')) {
      console.warn('Using mock transaction data for ID:', id);
      return {
        id: id,
        customer_name: 'Mock Customer',
        customer_email: 'mock@example.com',
        invoice_number: 'MOCK-001',
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
        items: [],
        created_at: new Date().toISOString()
      } as Transaction;
    }
    
    if (!supabase) {
      console.error('Supabase client is not available');
      return null;
    }
    
    // Get transaction from Supabase
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (transactionError) {
      console.error('Error fetching transaction:', transactionError);
      console.error('Error code:', transactionError.code);
      console.error('Error details:', transactionError.details);
      console.error('Error message:', transactionError.message);
      return null;
    }
    
    // Get transaction items
    const { data: items, error: itemsError } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', id);
    
    if (itemsError) {
      console.error('Error fetching transaction items:', itemsError);
      return null;
    }
    
    return {
      ...transaction,
      items: items || []
    } as Transaction;
  } catch (e) {
    console.error('Exception in getTransaction:', e);
    return null;
  }
}

export async function createTransaction(transaction: Omit<Transaction, "id" | "created_at">) {
  try {
    console.log('Creating transaction with data:', JSON.stringify(transaction, null, 2));
    
    if (!supabase) {
      console.error('Supabase client is not available');
      return null;
    }
    
    // Check authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Authentication error before creating transaction:', authError);
      return null;
    }
    
    if (!authData.session) {
      console.error('No session found before creating transaction. Trying to sign in anonymously.');
      
      const { error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) {
        console.error('Failed to sign in anonymously:', signInError);
        return null;
      }
    }
    
    // Start a transaction
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        customer_name: transaction.customer_name,
        customer_email: transaction.customer_email,
        customer_gstin: transaction.customer_gstin,
        customer_address: transaction.customer_address,
        invoice_number: transaction.invoice_number,
        invoice_date: transaction.invoice_date,
        subtotal: transaction.subtotal,
        discount_type: transaction.discount_type,
        discount_value: transaction.discount_value,
        discount_amount: transaction.discount_amount,
        taxable_amount: transaction.taxable_amount,
        cgst_amount: transaction.cgst_amount,
        sgst_amount: transaction.sgst_amount,
        total_amount: transaction.total_amount,
        payment_status: transaction.payment_status
      }])
      .select()
      .single();
    
    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      console.error('Error code:', transactionError.code);
      console.error('Error details:', transactionError.details);
      console.error('Error message:', transactionError.message);
      return null;
    }
    
    // Insert items
    if (transaction.items && transaction.items.length > 0) {
      const items = transaction.items.map(item => ({
        ...item,
        transaction_id: transactionData.id
      }));
      
      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(items);
      
      if (itemsError) {
        console.error('Error creating transaction items:', itemsError);
        // Consider rolling back the transaction here
        return null;
      }
    }
    
    return {
      ...transactionData,
      items: transaction.items
    } as Transaction;
  } catch (e) {
    console.error('Exception in createTransaction:', e);
    return null;
  }
}

export async function updateTransaction(id: string, transaction: Partial<Omit<Transaction, "id" | "created_at">>) {
  const { data, error } = await supabase
    .from('transactions')
    .update(transaction)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating transaction:', error);
    return null;
  }
  
  return data as Transaction;
}

export async function updateTransactionPayment(id: string, paymentId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .update({ 
      payment_status: 'paid',
      payment_id: paymentId
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating transaction payment:', error);
    return null;
  }
  
  return data as Transaction;
}

export async function deleteTransaction(id: string) {
  // Delete transaction items first (assuming cascade is not set up)
  const { error: itemsError } = await supabase
    .from('transaction_items')
    .delete()
    .eq('transaction_id', id);
  
  if (itemsError) {
    console.error('Error deleting transaction items:', itemsError);
    return false;
  }
  
  // Then delete the transaction
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
  
  return true;
}

export function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}

