-- Create a test transaction with authenticated user for testing payment flow

DO $$
DECLARE
  transaction_id UUID := '77e80e66-01d6-4d45-b566-11438b2684b8'; -- The specific ID shown in error logs
  user_id UUID;
  current_time TIMESTAMP := NOW();
BEGIN
  -- Get the authenticated user ID (first user from auth.users table)
  SELECT id INTO user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  
  -- If no user found, raise notice and exit
  IF user_id IS NULL THEN
    RAISE NOTICE 'No authenticated users found in the database. Please create a user first.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Creating transaction for user ID: %', user_id;
  
  -- Delete existing transaction with this ID if it exists
  DELETE FROM transaction_items WHERE transaction_id = transaction_id;
  DELETE FROM transactions WHERE id = transaction_id;
  
  -- Insert the transaction with the specified ID and user_id
  INSERT INTO transactions (
    id, 
    user_id,
    customer_name, 
    customer_email, 
    customer_gstin, 
    customer_address,
    invoice_number, 
    invoice_date, 
    subtotal, 
    discount_type, 
    discount_value, 
    discount_amount,
    taxable_amount, 
    cgst_amount, 
    sgst_amount, 
    total_amount, 
    payment_status,
    created_at
  ) VALUES (
    transaction_id,
    user_id,  -- Using the retrieved user_id
    'Test Customer',
    'test@example.com',
    'GSTIN12345',
    '123 Test Street, Test City',
    'TEST-001',
    current_time::date,
    1000.00,
    'fixed',
    0.00,
    0.00,
    1000.00,
    90.00,
    90.00,
    1180.00,
    'pending',
    current_time
  );
  
  -- Insert a test transaction item
  INSERT INTO transaction_items (
    transaction_id,
    service_id,
    service_name,
    service_description,
    hsn_code,
    price,
    gst_rate,
    quantity
  ) VALUES (
    transaction_id,
    '00000000-0000-0000-0000-000000000001', -- Example service ID
    'Test Service',
    'Test Service Description',
    '9983',
    1000.00,
    18.00,
    1
  );
  
  RAISE NOTICE 'Test transaction created successfully with ID: % for user: %', transaction_id, user_id;
END $$; 