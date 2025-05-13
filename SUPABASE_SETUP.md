# Supabase Setup Guide for Fitness Class Scheduler

This guide will help you set up your Supabase project for the Fitness Class Scheduler application.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in or create an account
2. Create a new project with a name of your choice
3. Choose a strong database password and save it securely
4. Select a region closest to your users
5. Wait for your database to be provisioned

## 2. Set Up Database Schema

You have two options for setting up the database schema:

### Option 1: Using the SQL Editor

1. In your Supabase dashboard, go to the SQL Editor
2. Create a new query
3. Copy and paste the contents of `/supabase/migrations/20250513_initial_schema.sql`
4. Run the query to create all necessary tables and security policies

### Option 2: Using the Supabase CLI

If you prefer using the Supabase CLI:

1. Install the Supabase CLI: `npm install -g supabase`
2. Log in to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Apply migrations: `supabase db push`

## 3. Get Your API Keys

1. In your Supabase dashboard, go to Project Settings > API
2. Copy the URL and anon key
3. Add these to your `.env` file:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 4. Set Up Row Level Security (RLS)

The migration script already sets up basic RLS policies, but you may want to customize them:

1. Go to Authentication > Policies in your Supabase dashboard
2. Review the policies for each table
3. Modify as needed for your security requirements

## 5. Initial Data Setup

For testing purposes, you may want to add some initial data:

1. Go to the Table Editor
2. Select the `instructors` table
3. Add a few sample instructors with their qualifications

## 6. Verify Connection

1. Start your application: `npm start`
2. Check the browser console for any connection errors
3. Try adding an instructor to verify data is being saved to Supabase

## Troubleshooting

- If you see CORS errors, check your Supabase project settings > API > CORS and ensure your app's URL is allowed
- If authentication fails, verify your API keys are correctly set in the `.env` file
- For database errors, check the SQL logs in your Supabase dashboard
