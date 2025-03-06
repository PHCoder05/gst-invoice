# GST Invoice System - Local Setup Guide

This guide will help you set up the GST Invoice System to run locally on your machine.

## Step 1: Environment Variables

Make sure your `.env.local` file has the following variables correctly set:

```
# Supabase credentials (production)
NEXT_PUBLIC_SUPABASE_URL=https://bctyvhykgrytmtmubwvt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjdHl2aHlrZ3J5dG10bXVid3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5Nzc5OTYsImV4cCI6MjA1NjU1Mzk5Nn0.68qXejaJkfXgGk6Q9UG1UiE2iCk1S_HxJl1p2GixaNc

# Razorpay credentials (production)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_eF04QnCqujCHIQ
RAZORPAY_KEY_SECRET=JKgTQtBCzvhmxri4L9xjLPbU

# Application URL for callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

Make sure there are no trailing spaces after any of the values.

## Step 2: Set Up Supabase Database

You need to set up the required tables and RLS policies in your Supabase database:

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Navigate to your project
3. Go to the SQL Editor
4. Run the following SQL scripts in order:
   - `sql/migrations/000_create_schema.sql` - Creates the database tables
   - `sql/migrations/001_create_rls_policies.sql` - Sets up RLS policies
   - `sql/migrations/002_create_rls_check_function.sql` - Creates a function to check RLS status

Alternatively, you can run the one-shot fix script:
- `sql/migrations/one_shot_fix_final_fixed.sql` - This will add user_id columns, create indexes, enable RLS, and set up policies and triggers

## Step 3: Run the Development Server

```bash
npm run dev
```

The application should now be running at http://localhost:3000 or http://localhost:3001 (if port 3000 is already in use).

## Step 4: Verify Database Connection

1. Visit the homepage at http://localhost:3001 (or whichever port it's running on)
2. Navigate to the Services page
3. If you see "Loading items..." for a long time, there might be an issue with the Supabase connection

## Troubleshooting

### Database Connection Issues

1. Check the browser console for any errors (F12 > Console)
2. Verify that your Supabase URL and Anon Key are correct
3. Make sure the required tables exist in your Supabase database
4. Check that RLS policies are properly configured

### Port Conflicts

If port 3000 is already in use, the application will automatically use port 3001. You can update the `NEXT_PUBLIC_APP_URL` in your `.env.local` file to match the port being used.

### Authentication Issues

The application uses Supabase authentication. If you're having trouble with authentication:

1. Make sure you have created a user in your Supabase project
2. Check that the RLS policies are correctly set up to allow access to your user

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Razorpay Documentation](https://razorpay.com/docs) 