-- CREATE TRANSACTIONS TABLE
-- This script adds the transactions table to match the frontend code's expectations

-- Create the transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_gstin TEXT,
    customer_address TEXT,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    taxable_amount NUMERIC(12, 2) NOT NULL,
    cgst_amount NUMERIC(12, 2) NOT NULL,
    sgst_amount NUMERIC(12, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
    payment_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on user_id for better performance with RLS
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_invoice_number_idx ON transactions(invoice_number);
CREATE INDEX IF NOT EXISTS transactions_payment_status_idx ON transactions(payment_status);

-- Create table for transaction items
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_description TEXT,
    hsn_code TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transaction_items_transaction_id_idx ON transaction_items(transaction_id);

-- Enable Row Level Security (RLS) on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions table
CREATE POLICY transactions_select_policy ON transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY transactions_insert_policy ON transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY transactions_update_policy ON transactions
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY transactions_delete_policy ON transactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for transaction_items table
CREATE POLICY transaction_items_select_policy ON transaction_items
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM transactions 
      WHERE transactions.id = transaction_items.transaction_id 
      AND transactions.user_id = auth.uid()
    ));

CREATE POLICY transaction_items_insert_policy ON transaction_items
    FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM transactions 
      WHERE transactions.id = transaction_items.transaction_id 
      AND transactions.user_id = auth.uid()
    ));

CREATE POLICY transaction_items_update_policy ON transaction_items
    FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM transactions 
      WHERE transactions.id = transaction_items.transaction_id 
      AND transactions.user_id = auth.uid()
    ));

CREATE POLICY transaction_items_delete_policy ON transaction_items
    FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM transactions 
      WHERE transactions.id = transaction_items.transaction_id 
      AND transactions.user_id = auth.uid()
    ));

-- Create trigger function to set user_id on insert
CREATE OR REPLACE FUNCTION set_transaction_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set user_id on insert
CREATE TRIGGER set_transaction_user_id_trigger
BEFORE INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_transaction_user_id();

-- Notify completion
DO $$
BEGIN
  RAISE NOTICE 'Transactions tables created successfully.';
END $$; 