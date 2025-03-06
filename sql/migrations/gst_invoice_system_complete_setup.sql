-- GST INVOICE SYSTEM - COMPLETE DATABASE SETUP
-- This script will:
-- 1. Create all necessary tables if they don't exist
-- 2. Add user_id columns to all tables
-- 3. Create indexes for better performance
-- 4. Enable Row Level Security (RLS) on all tables
-- 5. Create RLS policies to ensure data privacy
-- 6. Create triggers to automatically set user_id on insert
-- 7. Create a function to check if RLS is enabled

-- Step 1: Create tables if they don't exist
-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    hsn_code TEXT NOT NULL DEFAULT '998311',
    gst_rate DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_gstin TEXT,
    customer_address TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    hsn_code TEXT NOT NULL DEFAULT '998311',
    gst_rate DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_service_id ON invoice_items(service_id);

-- Step 3: Enable Row Level Security (RLS) on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for services table
-- Policy for selecting services
DROP POLICY IF EXISTS services_select_policy ON services;
CREATE POLICY services_select_policy ON services
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for inserting services
DROP POLICY IF EXISTS services_insert_policy ON services;
CREATE POLICY services_insert_policy ON services
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for updating services
DROP POLICY IF EXISTS services_update_policy ON services;
CREATE POLICY services_update_policy ON services
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for deleting services
DROP POLICY IF EXISTS services_delete_policy ON services;
CREATE POLICY services_delete_policy ON services
    FOR DELETE
    USING (auth.uid() = user_id);

-- Step 5: Create RLS policies for invoices table
-- Policy for selecting invoices
DROP POLICY IF EXISTS invoices_select_policy ON invoices;
CREATE POLICY invoices_select_policy ON invoices
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for inserting invoices
DROP POLICY IF EXISTS invoices_insert_policy ON invoices;
CREATE POLICY invoices_insert_policy ON invoices
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for updating invoices
DROP POLICY IF EXISTS invoices_update_policy ON invoices;
CREATE POLICY invoices_update_policy ON invoices
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for deleting invoices
DROP POLICY IF EXISTS invoices_delete_policy ON invoices;
CREATE POLICY invoices_delete_policy ON invoices
    FOR DELETE
    USING (auth.uid() = user_id);

-- Step 6: Create RLS policies for invoice_items table
-- Policy for selecting invoice_items
DROP POLICY IF EXISTS invoice_items_select_policy ON invoice_items;
CREATE POLICY invoice_items_select_policy ON invoice_items
    FOR SELECT
    USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE user_id = auth.uid()
        )
    );

-- Policy for inserting invoice_items
DROP POLICY IF EXISTS invoice_items_insert_policy ON invoice_items;
CREATE POLICY invoice_items_insert_policy ON invoice_items
    FOR INSERT
    WITH CHECK (
        invoice_id IN (
            SELECT id FROM invoices WHERE user_id = auth.uid()
        )
    );

-- Policy for updating invoice_items
DROP POLICY IF EXISTS invoice_items_update_policy ON invoice_items;
CREATE POLICY invoice_items_update_policy ON invoice_items
    FOR UPDATE
    USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE user_id = auth.uid()
        )
    );

-- Policy for deleting invoice_items
DROP POLICY IF EXISTS invoice_items_delete_policy ON invoice_items;
CREATE POLICY invoice_items_delete_policy ON invoice_items
    FOR DELETE
    USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE user_id = auth.uid()
        )
    );

-- Step 7: Create triggers to automatically set user_id on insert
-- Trigger for services table
CREATE OR REPLACE FUNCTION set_services_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS services_set_user_id ON services;
CREATE TRIGGER services_set_user_id
    BEFORE INSERT ON services
    FOR EACH ROW
    EXECUTE FUNCTION set_services_user_id();

-- Trigger for invoices table
CREATE OR REPLACE FUNCTION set_invoices_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS invoices_set_user_id ON invoices;
CREATE TRIGGER invoices_set_user_id
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoices_user_id();

-- Step 8: Create function to check if RLS is enabled
CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE oid = (table_name::regclass)::oid;
  
  RETURN rls_enabled;
END;
$$;

-- Step 9: Insert sample data (optional - comment out if not needed)
/*
-- Sample service
INSERT INTO services (name, description, price, hsn_code, gst_rate, user_id)
VALUES ('GST Consultation', 'GST filing and consultation services', 5000.00, '998231', 18.00, auth.uid());

-- Sample invoice
INSERT INTO invoices (
    invoice_number, 
    invoice_date, 
    due_date, 
    status, 
    subtotal, 
    tax, 
    total, 
    customer_name, 
    customer_email, 
    customer_gstin,
    user_id
)
VALUES (
    'INV-001', 
    CURRENT_DATE, 
    CURRENT_DATE + INTERVAL '30 days', 
    'draft', 
    5000.00, 
    900.00, 
    5900.00, 
    'Sample Customer', 
    'customer@example.com', 
    '27AAPFU0939F1ZV',
    auth.uid()
);

-- Get the invoice ID
DO $$
DECLARE
    invoice_id UUID;
BEGIN
    SELECT id INTO invoice_id FROM invoices WHERE invoice_number = 'INV-001' AND user_id = auth.uid();
    
    -- Sample invoice item
    INSERT INTO invoice_items (
        invoice_id,
        service_id,
        description,
        quantity,
        unit_price,
        hsn_code,
        gst_rate,
        subtotal,
        tax,
        total
    )
    VALUES (
        invoice_id,
        (SELECT id FROM services WHERE name = 'GST Consultation' AND user_id = auth.uid()),
        'GST Consultation Service',
        1,
        5000.00,
        '998231',
        18.00,
        5000.00,
        900.00,
        5900.00
    );
END $$;
*/

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE 'GST Invoice System database setup completed successfully!';
    RAISE NOTICE 'Tables created: services, invoices, invoice_items';
    RAISE NOTICE 'RLS enabled on all tables';
    RAISE NOTICE 'RLS policies created for all tables';
    RAISE NOTICE 'Triggers created to automatically set user_id';
END $$; 