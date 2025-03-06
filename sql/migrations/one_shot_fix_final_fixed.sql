-- ONE-SHOT FIX FOR EXISTING TABLES
-- This script will:
-- 1. Add user_id columns to existing tables if they don't exist
-- 2. Create indexes for the user_id columns
-- 3. Enable RLS on all tables
-- 4. Create RLS policies
-- 5. Create triggers to set user_id on insert
-- 6. Create the RLS check function

-- Step 1: Check if tables exist and add user_id columns if needed
DO $$
DECLARE
    services_exists BOOLEAN;
    invoices_exists BOOLEAN;
    invoice_items_exists BOOLEAN;
    services_has_user_id BOOLEAN;
    invoices_has_user_id BOOLEAN;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'services'
    ) INTO services_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'invoices'
    ) INTO invoices_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'invoice_items'
    ) INTO invoice_items_exists;
    
    -- Check if user_id columns exist
    IF services_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'services' AND column_name = 'user_id'
        ) INTO services_has_user_id;
        
        IF NOT services_has_user_id THEN
            ALTER TABLE services ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added user_id column to services table';
        END IF;
    END IF;
    
    IF invoices_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'user_id'
        ) INTO invoices_has_user_id;
        
        IF NOT invoices_has_user_id THEN
            ALTER TABLE invoices ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added user_id column to invoices table';
        END IF;
    END IF;
    
    -- Create indexes
    IF services_exists THEN
        CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
        RAISE NOTICE 'Created index on services.user_id';
    END IF;
    
    IF invoices_exists THEN
        CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
        RAISE NOTICE 'Created index on invoices.user_id';
    END IF;
    
    IF invoice_items_exists AND invoices_exists THEN
        CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
        RAISE NOTICE 'Created index on invoice_items.invoice_id';
    END IF;
    
    IF invoice_items_exists AND services_exists THEN
        CREATE INDEX IF NOT EXISTS idx_invoice_items_service_id ON invoice_items(service_id);
        RAISE NOTICE 'Created index on invoice_items.service_id';
    END IF;
    
    -- Enable RLS
    IF services_exists THEN
        ALTER TABLE services ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on services table';
    END IF;
    
    IF invoices_exists THEN
        ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on invoices table';
    END IF;
    
    IF invoice_items_exists THEN
        ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on invoice_items table';
    END IF;
END $$;

-- Step 2: Create RLS policies for services table
DO $$
DECLARE
    services_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'services'
    ) INTO services_exists;
    
    IF services_exists THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS select_services ON services;
        DROP POLICY IF EXISTS insert_services ON services;
        DROP POLICY IF EXISTS update_services ON services;
        DROP POLICY IF EXISTS delete_services ON services;
        
        -- Create new policies
        CREATE POLICY select_services ON services
            FOR SELECT
            USING (auth.uid() = user_id OR user_id IS NULL);
            
        CREATE POLICY insert_services ON services
            FOR INSERT
            WITH CHECK (true);
            
        CREATE POLICY update_services ON services
            FOR UPDATE
            USING (auth.uid() = user_id OR user_id IS NULL);
            
        CREATE POLICY delete_services ON services
            FOR DELETE
            USING (auth.uid() = user_id OR user_id IS NULL);
            
        RAISE NOTICE 'Created RLS policies for services table';
    END IF;
END $$;

-- Step 3: Create RLS policies for invoices table
DO $$
DECLARE
    invoices_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'invoices'
    ) INTO invoices_exists;
    
    IF invoices_exists THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS select_invoices ON invoices;
        DROP POLICY IF EXISTS insert_invoices ON invoices;
        DROP POLICY IF EXISTS update_invoices ON invoices;
        DROP POLICY IF EXISTS delete_invoices ON invoices;
        
        -- Create new policies
        CREATE POLICY select_invoices ON invoices
            FOR SELECT
            USING (auth.uid() = user_id OR user_id IS NULL);
            
        CREATE POLICY insert_invoices ON invoices
            FOR INSERT
            WITH CHECK (true);
            
        CREATE POLICY update_invoices ON invoices
            FOR UPDATE
            USING (auth.uid() = user_id OR user_id IS NULL);
            
        CREATE POLICY delete_invoices ON invoices
            FOR DELETE
            USING (auth.uid() = user_id OR user_id IS NULL);
            
        RAISE NOTICE 'Created RLS policies for invoices table';
    END IF;
END $$;

-- Step 4: Create RLS policies for invoice_items table
DO $$
DECLARE
    invoice_items_exists BOOLEAN;
    invoices_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'invoice_items'
    ) INTO invoice_items_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'invoices'
    ) INTO invoices_exists;
    
    IF invoice_items_exists AND invoices_exists THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS select_invoice_items ON invoice_items;
        DROP POLICY IF EXISTS insert_invoice_items ON invoice_items;
        DROP POLICY IF EXISTS update_invoice_items ON invoice_items;
        DROP POLICY IF EXISTS delete_invoice_items ON invoice_items;
        
        -- Create new policies
        CREATE POLICY select_invoice_items ON invoice_items
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM invoices
                    WHERE invoices.id = invoice_items.invoice_id
                    AND (invoices.user_id = auth.uid() OR invoices.user_id IS NULL)
                )
            );
            
        CREATE POLICY insert_invoice_items ON invoice_items
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM invoices
                    WHERE invoices.id = invoice_items.invoice_id
                    AND (invoices.user_id = auth.uid() OR invoices.user_id IS NULL)
                )
            );
            
        CREATE POLICY update_invoice_items ON invoice_items
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM invoices
                    WHERE invoices.id = invoice_items.invoice_id
                    AND (invoices.user_id = auth.uid() OR invoices.user_id IS NULL)
                )
            );
            
        CREATE POLICY delete_invoice_items ON invoice_items
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM invoices
                    WHERE invoices.id = invoice_items.invoice_id
                    AND (invoices.user_id = auth.uid() OR invoices.user_id IS NULL)
                )
            );
            
        RAISE NOTICE 'Created RLS policies for invoice_items table';
    END IF;
END $$;

-- Step 5: Create trigger functions outside of DO blocks to avoid nesting issues

-- First check if services table exists
DO $$
DECLARE
    services_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'services'
    ) INTO services_exists;
    
    IF services_exists THEN
        -- Drop existing function and trigger if they exist
        DROP FUNCTION IF EXISTS set_service_user_id() CASCADE;
        RAISE NOTICE 'Dropped existing service trigger function if it existed';
    END IF;
END $$;

-- Create service trigger function (only if services table exists)
DO $$
DECLARE
    services_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'services'
    ) INTO services_exists;
    
    IF services_exists THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION set_service_user_id()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.user_id = auth.uid();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        ';
        
        EXECUTE '
        DROP TRIGGER IF EXISTS set_service_user_id_trigger ON services;
        CREATE TRIGGER set_service_user_id_trigger
            BEFORE INSERT ON services
            FOR EACH ROW
            EXECUTE FUNCTION set_service_user_id();
        ';
        
        RAISE NOTICE 'Created trigger for services table';
    END IF;
END $$;

-- First check if invoices table exists
DO $$
DECLARE
    invoices_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'invoices'
    ) INTO invoices_exists;
    
    IF invoices_exists THEN
        -- Drop existing function and trigger if they exist
        DROP FUNCTION IF EXISTS set_invoice_user_id() CASCADE;
        RAISE NOTICE 'Dropped existing invoice trigger function if it existed';
    END IF;
END $$;

-- Create invoice trigger function (only if invoices table exists)
DO $$
DECLARE
    invoices_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'invoices'
    ) INTO invoices_exists;
    
    IF invoices_exists THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION set_invoice_user_id()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.user_id = auth.uid();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        ';
        
        EXECUTE '
        DROP TRIGGER IF EXISTS set_invoice_user_id_trigger ON invoices;
        CREATE TRIGGER set_invoice_user_id_trigger
            BEFORE INSERT ON invoices
            FOR EACH ROW
            EXECUTE FUNCTION set_invoice_user_id();
        ';
        
        RAISE NOTICE 'Created trigger for invoices table';
    END IF;
END $$;

-- Step 7: Create the RLS check function
DO $$
BEGIN
    DROP FUNCTION IF EXISTS check_rls_enabled(text);
    
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
    
    RAISE NOTICE 'Created check_rls_enabled function';
END $$;

-- Step 8: Set user_id for existing records (optional - only if you want to assign existing records to the current user)
-- Uncomment and run this section separately if needed
/*
DO $$
DECLARE
  current_user_id UUID;
  services_exists BOOLEAN;
  invoices_exists BOOLEAN;
BEGIN
  -- Get the current user ID (you'll need to be logged in for this to work)
  current_user_id := auth.uid();
  
  SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'services'
  ) INTO services_exists;
  
  SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'invoices'
  ) INTO invoices_exists;
  
  IF current_user_id IS NOT NULL THEN
    -- Update existing records in services
    IF services_exists THEN
        UPDATE services SET user_id = current_user_id WHERE user_id IS NULL;
        RAISE NOTICE 'Updated user_id for existing services';
    END IF;
    
    -- Update existing records in invoices
    IF invoices_exists THEN
        UPDATE invoices SET user_id = current_user_id WHERE user_id IS NULL;
        RAISE NOTICE 'Updated user_id for existing invoices';
    END IF;
  END IF;
END $$;
*/ 