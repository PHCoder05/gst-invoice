import supabaseClient from './supabase';

// Define the Invoice and InvoiceItem types if they're not already imported
export type InvoiceItem = {
  id: string;
  invoice_id: string;
  service_id: string;
  name: string;
  description?: string;
  hsn_code: string;
  price: number;
  quantity: number;
  gst_rate: number;
  amount: number;
}

export type Invoice = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_gstin?: string;
  customer_address?: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  user_id?: string;
  created_at: string;
}

export async function getInvoices() {
  try {
    console.log('Fetching invoices from Supabase...');
    
    if (!supabaseClient) {
      console.error('Supabase client is not available');
      return [];
    }
    
    // Get invoices from Supabase
    const { data, error } = await supabaseClient
      .from('invoices')
      .select('*, client:clients(*), items:invoice_items(*)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoices from Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      return [];
    }
    
    console.log(`Found ${data.length} invoices in Supabase`);
    return data;
  } catch (e) {
    console.error('Exception in getInvoices:', e);
    return [];
  }
}

export async function getInvoice(id: string) {
  try {
    console.log('Fetching invoice with ID:', id);
    
    if (!supabaseClient) {
      console.error('Supabase client is not available');
      return null;
    }
    
    // Get invoice from Supabase
    const { data, error } = await supabaseClient
      .from('invoices')
      .select('*, client:clients(*), items:invoice_items(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching invoice from Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      return null;
    }
    
    console.log('Invoice found in Supabase:', data);
    return data;
  } catch (e) {
    console.error('Exception in getInvoice:', e);
    return null;
  }
}

export async function createInvoice(invoice: Omit<Invoice, "id" | "created_at" | "items"> & { items: Omit<InvoiceItem, "id" | "invoice_id">[] }) {
  try {
    console.log('Creating invoice with data:', JSON.stringify(invoice, null, 2));
    
    if (!supabaseClient) {
      console.error('Supabase client is not available');
      return null;
    }
    
    // Start a transaction
    const { data: newInvoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .insert([{
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        status: invoice.status || 'draft',
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount || 0,
        total: invoice.total,
        notes: invoice.notes || '',
      }])
      .select()
      .single();
    
    if (invoiceError) {
      console.error('Error creating invoice in Supabase:', invoiceError);
      console.error('Error code:', invoiceError.code);
      console.error('Error details:', invoiceError.details);
      console.error('Error message:', invoiceError.message);
      return null;
    }
    
    console.log('Invoice created successfully in Supabase:', newInvoice);
    
    // Now add the invoice items
    if (invoice.items && invoice.items.length > 0) {
      const invoiceItems = invoice.items.map(item => ({
        invoice_id: newInvoice.id,
        service_id: item.service_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        hsn_code: item.hsn_code,
        gst_rate: item.gst_rate,
        amount: item.amount || (item.price * item.quantity)
      }));
      
      const { data: items, error: itemsError } = await supabaseClient
        .from('invoice_items')
        .insert(invoiceItems)
        .select();
      
      if (itemsError) {
        console.error('Error creating invoice items in Supabase:', itemsError);
        console.error('Error code:', itemsError.code);
        console.error('Error details:', itemsError.details);
        console.error('Error message:', itemsError.message);
        // We don't return null here because the invoice was created successfully
      } else {
        console.log('Invoice items created successfully in Supabase:', items);
        newInvoice.items = items;
      }
    }
    
    return newInvoice as Invoice;
  } catch (e) {
    console.error('Exception in createInvoice:', e);
    return null;
  }
}

export async function updateInvoice(
  id: string, 
  invoice: Partial<Omit<Invoice, "id" | "created_at" | "items">> & { 
    items?: (Omit<InvoiceItem, "invoice_id"> | Omit<InvoiceItem, "id" | "invoice_id">)[] 
  }
) {
  try {
    console.log('Updating invoice with ID:', id);
    console.log('Update data:', JSON.stringify(invoice, null, 2));
    
    if (!supabaseClient) {
      console.error('Supabase client is not available');
      return null;
    }
    
    // First, update the invoice
    const invoiceUpdate: any = {};
    
    // if (invoice.client_id !== undefined) invoiceUpdate.client_id = invoice.client_id;
    if (invoice.invoice_number !== undefined) invoiceUpdate.invoice_number = invoice.invoice_number;
    if (invoice.invoice_date !== undefined) invoiceUpdate.invoice_date = invoice.invoice_date;
    if (invoice.due_date !== undefined) invoiceUpdate.due_date = invoice.due_date;
    if (invoice.status !== undefined) invoiceUpdate.status = invoice.status;
    if (invoice.subtotal !== undefined) invoiceUpdate.subtotal = invoice.subtotal;
    if (invoice.tax !== undefined) invoiceUpdate.tax = invoice.tax;
    if (invoice.discount !== undefined) invoiceUpdate.discount = invoice.discount;
    if (invoice.total !== undefined) invoiceUpdate.total = invoice.total;
    if (invoice.notes !== undefined) invoiceUpdate.notes = invoice.notes;
    
    // Only update if there are fields to update
    if (Object.keys(invoiceUpdate).length > 0) {
      const { data: updatedInvoice, error: invoiceError } = await supabaseClient
        .from('invoices')
        .update(invoiceUpdate)
        .eq('id', id)
        .select()
        .single();
      
      if (invoiceError) {
        console.error('Error updating invoice in Supabase:', invoiceError);
        console.error('Error code:', invoiceError.code);
        console.error('Error details:', invoiceError.details);
        console.error('Error message:', invoiceError.message);
        return null;
      }
      
      console.log('Invoice updated successfully in Supabase:', updatedInvoice);
      
      // Now handle the items if they were provided
      if (invoice.items && invoice.items.length > 0) {
        // First, get existing items
        const { data: existingItems, error: fetchError } = await supabaseClient
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', id);
        
        if (fetchError) {
          console.error('Error fetching existing invoice items:', fetchError);
        } else {
          console.log('Existing invoice items:', existingItems);
          
          // Identify items to update, add, or delete
          const existingItemIds = existingItems.map((item: InvoiceItem) => item.id);
          const updatedItemIds: string[] = [];
          
          // Process each item in the update
          for (const item of invoice.items) {
            if ('id' in item) {
              // This is an existing item to update
              updatedItemIds.push(item.id);
              
              const { error: updateError } = await supabaseClient
                .from('invoice_items')
                .update({
                  service_id: item.service_id,
                  name: item.name,
                  description: item.description,
                  quantity: item.quantity,
                  price: item.price,
                  hsn_code: item.hsn_code,
                  gst_rate: item.gst_rate,
                  amount: item.amount || (item.price * item.quantity)
                })
                .eq('id', item.id);
              
              if (updateError) {
                console.error(`Error updating invoice item ${item.id}:`, updateError);
              } else {
                console.log(`Updated invoice item ${item.id}`);
              }
            } else {
              // This is a new item to add
              const { data: newItem, error: insertError } = await supabaseClient
                .from('invoice_items')
                .insert([{
                  invoice_id: id,
                  service_id: item.service_id,
                  name: item.name,
                  description: item.description,
                  quantity: item.quantity,
                  price: item.price,
                  hsn_code: item.hsn_code,
                  gst_rate: item.gst_rate,
                  amount: item.amount || (item.price * item.quantity)
                }])
                .select()
                .single();
              
              if (insertError) {
                console.error('Error inserting new invoice item:', insertError);
              } else {
                console.log('Inserted new invoice item:', newItem);
                if (newItem) updatedItemIds.push(newItem.id);
              }
            }
          }
          
          // Delete items that weren't in the update
          const itemsToDelete = existingItemIds.filter(id => !updatedItemIds.includes(id));
          
          if (itemsToDelete.length > 0) {
            const { error: deleteError } = await supabaseClient
              .from('invoice_items')
              .delete()
              .in('id', itemsToDelete);
            
            if (deleteError) {
              console.error('Error deleting invoice items:', deleteError);
            } else {
              console.log(`Deleted ${itemsToDelete.length} invoice items`);
            }
          }
        }
      }
      
      // Fetch the updated invoice with its items
      const { data: finalInvoice, error: fetchError } = await supabaseClient
        .from('invoices')
        .select('*, client:clients(*), items:invoice_items(*)')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching updated invoice:', fetchError);
        return updatedInvoice;
      }
      
      return finalInvoice;
    } else {
      console.log('No invoice fields to update');
      
      // If only updating items, fetch the current invoice
      const { data: currentInvoice, error: fetchError } = await supabaseClient
        .from('invoices')
        .select('*, client:clients(*), items:invoice_items(*)')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching current invoice:', fetchError);
        return null;
      }
      
      return currentInvoice;
    }
  } catch (e) {
    console.error('Exception in updateInvoice:', e);
    return null;
  }
}

export async function deleteInvoice(id: string) {
  try {
    console.log('Deleting invoice with ID:', id);
    
    if (!supabaseClient) {
      console.error('Supabase client is not available');
      return false;
    }
    
    // First delete the invoice items (due to foreign key constraints)
    const { error: itemsError } = await supabaseClient
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);
    
    if (itemsError) {
      console.error('Error deleting invoice items from Supabase:', itemsError);
      console.error('Error code:', itemsError.code);
      console.error('Error details:', itemsError.details);
      console.error('Error message:', itemsError.message);
      return false;
    }
    
    // Then delete the invoice
    const { error } = await supabaseClient
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting invoice from Supabase:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      return false;
    }
    
    console.log('Invoice and its items deleted successfully from Supabase');
    return true;
  } catch (e) {
    console.error('Exception in deleteInvoice:', e);
    return false;
  }
} 