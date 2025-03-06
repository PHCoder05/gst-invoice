-- Create a function to handle creating an invoice and its items in a single transaction
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

-- Create a function to handle updating an invoice and its items in a single transaction
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