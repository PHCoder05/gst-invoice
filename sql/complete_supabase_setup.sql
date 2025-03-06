-- COMPLETE SUPABASE SETUP FOR GST INVOICE SYSTEM
-- Run this query in your Supabase SQL Editor to set up the entire database

-- STEP 1: Create tables
-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  hsn_code TEXT NOT NULL,
  gst_rate NUMERIC(5, 2) NOT NULL CHECK (gst_rate >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_gstin TEXT,
  customer_address TEXT,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  due_date DATE,
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  tax NUMERIC(12, 2) NOT NULL CHECK (tax >= 0),
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_id TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  hsn_code TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  gst_rate NUMERIC(5, 2) NOT NULL CHECK (gst_rate >= 0),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- STEP 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS services_user_id_idx ON services(user_id);
CREATE INDEX IF NOT EXISTS services_name_idx ON services(name);
CREATE INDEX IF NOT EXISTS services_active_idx ON services(active);
CREATE INDEX IF NOT EXISTS services_hsn_code_idx ON services(hsn_code);

CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_customer_name_idx ON invoices(customer_name);
CREATE INDEX IF NOT EXISTS invoices_invoice_number_idx ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS invoices_invoice_date_idx ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS invoice_items_service_id_idx ON invoice_items(service_id);

-- STEP 3: Enable Row Level Security (RLS) on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create RLS policies for services table
CREATE POLICY "Users can view their own services" 
  ON services FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own services" 
  ON services FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" 
  ON services FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" 
  ON services FOR DELETE 
  USING (auth.uid() = user_id);

-- STEP 5: Create RLS policies for invoices table
CREATE POLICY "Users can view their own invoices" 
  ON invoices FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" 
  ON invoices FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
  ON invoices FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" 
  ON invoices FOR DELETE 
  USING (auth.uid() = user_id);

-- STEP 6: Create RLS policies for invoice_items table
CREATE POLICY "Users can view their own invoice items" 
  ON invoice_items FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own invoice items" 
  ON invoice_items FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own invoice items" 
  ON invoice_items FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own invoice items" 
  ON invoice_items FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

-- STEP 7: Create triggers to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id_on_services()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER set_user_id_on_services_trigger
BEFORE INSERT ON services
FOR EACH ROW
WHEN (NEW.user_id IS NULL)
EXECUTE PROCEDURE set_user_id_on_services();

CREATE OR REPLACE FUNCTION set_user_id_on_invoices()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER set_user_id_on_invoices_trigger
BEFORE INSERT ON invoices
FOR EACH ROW
WHEN (NEW.user_id IS NULL)
EXECUTE PROCEDURE set_user_id_on_invoices();

-- STEP 8: Create a function to handle creating an invoice and its items in a single transaction
CREATE OR REPLACE FUNCTION create_invoice_with_items(
  invoice_data JSONB,
  items_data JSONB
) RETURNS JSONB AS $$
DECLARE
  new_invoice_id UUID;
  result JSONB;
BEGIN
  -- Begin transaction
  BEGIN
    -- Insert the invoice and get the ID
    INSERT INTO invoices (
      customer_name,
      customer_email,
      customer_gstin,
      customer_address,
      invoice_number,
      invoice_date,
      due_date,
      subtotal,
      tax,
      discount,
      total,
      notes,
      status,
      user_id
    ) VALUES (
      invoice_data->>'customer_name',
      invoice_data->>'customer_email',
      invoice_data->>'customer_gstin',
      invoice_data->>'customer_address',
      invoice_data->>'invoice_number',
      (invoice_data->>'invoice_date')::DATE,
      CASE WHEN invoice_data->>'due_date' IS NULL THEN NULL ELSE (invoice_data->>'due_date')::DATE END,
      (invoice_data->>'subtotal')::NUMERIC,
      (invoice_data->>'tax')::NUMERIC,
      (invoice_data->>'discount')::NUMERIC,
      (invoice_data->>'total')::NUMERIC,
      invoice_data->>'notes',
      invoice_data->>'status',
      (invoice_data->>'user_id')::UUID
    )
    RETURNING id INTO new_invoice_id;

    -- Insert the invoice items
    FOR i IN 0..jsonb_array_length(items_data) - 1 LOOP
      INSERT INTO invoice_items (
        invoice_id,
        service_id,
        name,
        description,
        hsn_code,
        price,
        quantity,
        gst_rate,
        amount
      ) VALUES (
        new_invoice_id,
        CASE WHEN items_data->i->>'service_id' IS NULL THEN NULL ELSE (items_data->i->>'service_id')::UUID END,
        items_data->i->>'name',
        items_data->i->>'description',
        items_data->i->>'hsn_code',
        (items_data->i->>'price')::NUMERIC,
        (items_data->i->>'quantity')::NUMERIC,
        (items_data->i->>'gst_rate')::NUMERIC,
        (items_data->i->>'amount')::NUMERIC
      );
    END LOOP;

    -- Prepare the result
    result := jsonb_build_object('invoice_id', new_invoice_id, 'success', true);
    
    RETURN result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 9: Create a function to handle updating an invoice and its items in a single transaction
CREATE OR REPLACE FUNCTION update_invoice_with_items(
  p_invoice_id UUID,
  invoice_data JSONB,
  new_items JSONB,
  update_items JSONB,
  delete_item_ids JSONB
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  item_id UUID;
BEGIN
  -- Begin transaction
  BEGIN
    -- Update the invoice
    UPDATE invoices
    SET
      customer_name = COALESCE(invoice_data->>'customer_name', customer_name),
      customer_email = COALESCE(invoice_data->>'customer_email', customer_email),
      customer_gstin = CASE WHEN invoice_data ? 'customer_gstin' THEN invoice_data->>'customer_gstin' ELSE customer_gstin END,
      customer_address = CASE WHEN invoice_data ? 'customer_address' THEN invoice_data->>'customer_address' ELSE customer_address END,
      invoice_number = COALESCE(invoice_data->>'invoice_number', invoice_number),
      invoice_date = CASE WHEN invoice_data ? 'invoice_date' THEN (invoice_data->>'invoice_date')::DATE ELSE invoice_date END,
      due_date = CASE 
                  WHEN invoice_data ? 'due_date' AND invoice_data->>'due_date' IS NULL THEN NULL
                  WHEN invoice_data ? 'due_date' THEN (invoice_data->>'due_date')::DATE
                  ELSE due_date
                 END,
      subtotal = CASE WHEN invoice_data ? 'subtotal' THEN (invoice_data->>'subtotal')::NUMERIC ELSE subtotal END,
      tax = CASE WHEN invoice_data ? 'tax' THEN (invoice_data->>'tax')::NUMERIC ELSE tax END,
      discount = CASE WHEN invoice_data ? 'discount' THEN (invoice_data->>'discount')::NUMERIC ELSE discount END,
      total = CASE WHEN invoice_data ? 'total' THEN (invoice_data->>'total')::NUMERIC ELSE total END,
      notes = CASE WHEN invoice_data ? 'notes' THEN invoice_data->>'notes' ELSE notes END,
      status = COALESCE(invoice_data->>'status', status)
    WHERE id = p_invoice_id;
    
    -- Insert new invoice items
    IF jsonb_array_length(new_items) > 0 THEN
      FOR i IN 0..jsonb_array_length(new_items) - 1 LOOP
        INSERT INTO invoice_items (
          invoice_id,
          service_id,
          name,
          description,
          hsn_code,
          price,
          quantity,
          gst_rate,
          amount
        ) VALUES (
          p_invoice_id,
          CASE WHEN new_items->i->>'service_id' IS NULL THEN NULL ELSE (new_items->i->>'service_id')::UUID END,
          new_items->i->>'name',
          new_items->i->>'description',
          new_items->i->>'hsn_code',
          (new_items->i->>'price')::NUMERIC,
          (new_items->i->>'quantity')::NUMERIC,
          (new_items->i->>'gst_rate')::NUMERIC,
          (new_items->i->>'amount')::NUMERIC
        );
      END LOOP;
    END IF;
    
    -- Update existing invoice items
    IF jsonb_array_length(update_items) > 0 THEN
      FOR i IN 0..jsonb_array_length(update_items) - 1 LOOP
        UPDATE invoice_items
        SET
          service_id = CASE WHEN update_items->i->>'service_id' IS NULL THEN NULL ELSE (update_items->i->>'service_id')::UUID END,
          name = update_items->i->>'name',
          description = update_items->i->>'description',
          hsn_code = update_items->i->>'hsn_code',
          price = (update_items->i->>'price')::NUMERIC,
          quantity = (update_items->i->>'quantity')::NUMERIC,
          gst_rate = (update_items->i->>'gst_rate')::NUMERIC,
          amount = (update_items->i->>'amount')::NUMERIC
        WHERE 
          id = (update_items->i->>'id')::UUID AND
          invoice_id = p_invoice_id;
      END LOOP;
    END IF;
    
    -- Delete removed invoice items
    IF jsonb_array_length(delete_item_ids) > 0 THEN
      FOR i IN 0..jsonb_array_length(delete_item_ids) - 1 LOOP
        DELETE FROM invoice_items
        WHERE 
          id = (delete_item_ids->i)::UUID AND
          invoice_id = p_invoice_id;
      END LOOP;
    END IF;
    
    -- Prepare the result
    result := jsonb_build_object('invoice_id', p_invoice_id, 'success', true);
    
    RETURN result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 10: Create a function to check if RLS is enabled on a table
CREATE OR REPLACE FUNCTION is_rls_enabled(p_table_name text) 
RETURNS TABLE(table_name text, rls_enabled boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tables.table_name::text,
    tables.row_security_active AS rls_enabled
  FROM
    information_schema.tables
  WHERE
    tables.table_schema = 'public'
    AND tables.table_name = p_table_name;
END;
$$ LANGUAGE plpgsql;

-- STEP 11: Update middleware export (fix for your current error)
-- Note: This isn't part of the database setup, but a reminder to fix the middleware.ts file
-- Your middleware.ts file should export the middleware function correctly

-- Done! Your GST Invoice System database is now set up.
-- Wrap RAISE NOTICE in a DO block to avoid syntax error
DO $$
BEGIN
  RAISE NOTICE 'GST Invoice System database setup completed successfully.';
END $$; 