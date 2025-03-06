-- Enable Row Level Security on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for services table
-- Policy for selecting services: Users can only see services created by them
CREATE POLICY select_services ON services
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for inserting services: Users can insert services and they will be associated with their user_id
CREATE POLICY insert_services ON services
    FOR INSERT
    WITH CHECK (true);

-- Trigger to set user_id on insert
CREATE OR REPLACE FUNCTION set_service_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_service_user_id_trigger
    BEFORE INSERT ON services
    FOR EACH ROW
    EXECUTE FUNCTION set_service_user_id();

-- Policy for updating services: Users can only update their own services
CREATE POLICY update_services ON services
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for deleting services: Users can only delete their own services
CREATE POLICY delete_services ON services
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create similar policies for clients table
CREATE POLICY select_clients ON clients
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY insert_clients ON clients
    FOR INSERT
    WITH CHECK (true);

CREATE OR REPLACE FUNCTION set_client_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_client_user_id_trigger
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION set_client_user_id();

CREATE POLICY update_clients ON clients
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY delete_clients ON clients
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create similar policies for invoices table
CREATE POLICY select_invoices ON invoices
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY insert_invoices ON invoices
    FOR INSERT
    WITH CHECK (true);

CREATE OR REPLACE FUNCTION set_invoice_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_user_id_trigger
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_user_id();

CREATE POLICY update_invoices ON invoices
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY delete_invoices ON invoices
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create similar policies for invoice_items table
-- For invoice_items, we need to check the parent invoice's user_id
CREATE POLICY select_invoice_items ON invoice_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY insert_invoice_items ON invoice_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY update_invoice_items ON invoice_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY delete_invoice_items ON invoice_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    ); 