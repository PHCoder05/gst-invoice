# Database Migrations

This directory contains SQL migration files for setting up the database schema and Row Level Security (RLS) policies for the GST Invoice System.

## Migration Files

- `000_create_schema.sql`: Creates the database tables with the necessary columns, including `user_id` for RLS.
- `001_create_rls_policies.sql`: Sets up RLS policies to ensure users can only access their own data.
- `002_create_rls_check_function.sql`: Creates a function to check if RLS is enabled on a table.

## How to Apply Migrations

### Option 1: Using the Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of each migration file, in order (000 first, then 001, then 002)
4. Execute the SQL statements

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can apply migrations using:

```bash
supabase db push
```

## Schema Overview

The database consists of the following tables:

1. **services**: Stores service information including name, price, HSN code, and GST rate
2. **clients**: Stores client information including name, contact details, and GSTIN
3. **invoices**: Stores invoice headers with client reference, totals, and status
4. **invoice_items**: Stores line items for each invoice with service details

## Row Level Security (RLS)

The RLS policies ensure that:

1. Users can only see, update, and delete their own data
2. When inserting new records, the user_id is automatically set to the authenticated user's ID
3. For invoice_items, access is controlled based on the parent invoice's user_id

## Helper Functions

- `check_rls_enabled(table_name text)`: A function that returns a boolean indicating whether RLS is enabled on the specified table.

## Troubleshooting

If you encounter issues with RLS policies:

1. Ensure you're properly authenticated with a valid user session
2. Check that the user_id column exists in all tables
3. Verify that the RLS policies have been correctly applied
4. Check the Supabase logs for any error messages

For more information on Supabase RLS, refer to the [official documentation](https://supabase.com/docs/guides/auth/row-level-security). 