-- Create instructors table
CREATE TABLE IF NOT EXISTS public.instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    min_classes INTEGER DEFAULT 0,
    max_classes INTEGER DEFAULT 10,
    qualifications JSONB DEFAULT '[]'::jsonb,
    availability JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create schedule table
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create locked_assignments table
CREATE TABLE IF NOT EXISTS public.locked_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignments JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locked_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users full access to instructors"
    ON public.instructors
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to schedule"
    ON public.schedule
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to locked_assignments"
    ON public.locked_assignments
    USING (auth.role() = 'authenticated');

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_instructors_updated_at
BEFORE UPDATE ON public.instructors
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_schedule_updated_at
BEFORE UPDATE ON public.schedule
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_locked_assignments_updated_at
BEFORE UPDATE ON public.locked_assignments
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
