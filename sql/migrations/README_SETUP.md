# Database Setup Guide

This guide will help you set up your Supabase database for the GST Invoice System.

## Option 1: One-Shot Fix (Recommended)

The easiest way to set up your database is to run the one-shot fix script:

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Navigate to your project
3. Go to the SQL Editor
4. Copy the entire contents of the `one_shot_fix_final_fixed.sql` file
5. Paste it into the SQL Editor
6. Click "Run" to execute the script

This script will:
- Add `user_id` columns to existing tables if they don't exist
- Create indexes for the `user_id` columns
- Enable Row Level Security (RLS) on all tables
- Create RLS policies to ensure users can only access their own data
- Create triggers to automatically set the `user_id` when inserting new records
- Create a function to check if RLS is enabled on a table

## Option 2: Step-by-Step Setup

If you prefer to set up your database step by step, you can run the following scripts in order:

1. `000_create_schema.sql` - Creates the database tables
2. `001_create_rls_policies.sql` - Sets up RLS policies
3. `002_create_rls_check_function.sql` - Creates a function to check RLS status

## Verifying the Setup

After running the scripts, you can verify that the setup was successful by:

1. Checking that the required tables exist in your Supabase database
2. Verifying that RLS is enabled on all tables
3. Testing that you can only access your own data

## Troubleshooting

If you encounter any issues:

1. Check the SQL Editor for any error messages
2. Make sure you have the necessary permissions to create tables and policies
3. Verify that your Supabase project is on a plan that supports RLS
4. If you're still having issues, try running the scripts one by one to identify where the problem is occurring

## Going Live

Once you've verified that everything is working correctly, your database is ready for production use. Make sure to:

1. Use strong passwords for your Supabase project
2. Keep your Supabase URL and Anon Key secure
3. Regularly backup your database
4. Monitor your database usage to avoid hitting any limits

## Additional Tables Setup

If you're experiencing errors related to missing tables (like "transactions"), you need to run the additional table setup scripts:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Navigate to the SQL Editor
3. Copy the contents of `sql/migrations/add_transactions_table.sql`
4. Paste it into the SQL Editor and click "Run"

This will create the transactions and transaction_items tables needed by some parts of the application 