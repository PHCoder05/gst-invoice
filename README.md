# GST Invoice System

A modern invoice management system with GST support, built with Next.js, Supabase, and Razorpay.

## Features

- Create and manage services with HSN codes and GST rates
- Manage clients with GSTIN information
- Generate GST-compliant invoices with proper tax calculations
- Process payments through Razorpay
- Responsive design for all devices
- Row Level Security (RLS) to ensure data privacy

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/gst-invoice-system.git
cd gst-invoice-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Get your project URL and anon key from the Supabase dashboard
3. Create the required tables in your Supabase project:
   - Go to the SQL Editor in your Supabase dashboard
   - Run the SQL scripts in the `sql/migrations` directory in order (000 first, then 001, then 002)

### 4. Configure environment variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Razorpay credentials
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Application URL for callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the development server

```bash
npm run dev
```

## Row Level Security (RLS)

This application uses Supabase's Row Level Security to ensure that users can only access their own data. The RLS policies are defined in the `sql/migrations/001_create_rls_policies.sql` file.

Key security features:

1. Each table has RLS enabled
2. Users can only see, update, and delete their own data
3. When inserting new records, the user_id is automatically set to the authenticated user's ID
4. For invoice_items, access is controlled based on the parent invoice's user_id

## GST-Specific Features

This invoice system is designed specifically for GST compliance:

1. Services include HSN codes and GST rates
2. Clients can have GSTIN information stored
3. Invoices calculate GST correctly based on the rates
4. Invoice PDFs include all required GST information

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure the environment variables in Vercel
4. Deploy

## Troubleshooting

If you encounter issues with Supabase connection:

1. Check that your environment variables are correctly set
2. Ensure that Row Level Security policies are properly configured
3. Check the browser console for any errors

For RLS-specific issues:

1. Ensure you're properly authenticated with a valid user session
2. Check that the user_id column exists in all tables
3. Verify that the RLS policies have been correctly applied
4. Check the Supabase logs for any error messages

## Local Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Environment Variables

Create a `.env.local` file with the following variables:

```
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Razorpay credentials
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

## Deployment

This project can be deployed to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourname%2Fgst-invoice-system) 