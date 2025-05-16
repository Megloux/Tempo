-- SQL Script to set up the tempo_app_data table in Supabase

-- Drop the table if it exists (comment this out if you want to preserve existing data)
-- DROP TABLE IF EXISTS public.tempo_app_data;

-- Create the tempo_app_data table with proper columns
CREATE TABLE IF NOT EXISTS public.tempo_app_data (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create or replace the trigger
DROP TRIGGER IF EXISTS update_tempo_app_data_timestamp ON public.tempo_app_data;
CREATE TRIGGER update_tempo_app_data_timestamp
BEFORE UPDATE ON public.tempo_app_data
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE public.tempo_app_data ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read the data
CREATE POLICY "Allow anyone to read tempo_app_data"
ON public.tempo_app_data
FOR SELECT
USING (true);

-- Create a policy that allows anyone to insert data
CREATE POLICY "Allow anyone to insert tempo_app_data"
ON public.tempo_app_data
FOR INSERT
WITH CHECK (true);

-- Create a policy that allows anyone to update data
CREATE POLICY "Allow anyone to update tempo_app_data"
ON public.tempo_app_data
FOR UPDATE
USING (true);

-- Create a policy that allows anyone to delete data (optional, can be removed if you don't want to allow deletion)
CREATE POLICY "Allow anyone to delete tempo_app_data"
ON public.tempo_app_data
FOR DELETE
USING (true);

-- Insert an empty record if the table is empty
INSERT INTO public.tempo_app_data (data)
SELECT '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.tempo_app_data LIMIT 1);

-- Grant permissions to the anon role (for public access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tempo_app_data TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.tempo_app_data_id_seq TO anon;

-- Note: Run this script in the Supabase SQL Editor to set up the table
-- After running, your table will be ready for use with the Tempo app
