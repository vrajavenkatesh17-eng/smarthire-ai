-- Add rank and role_category columns to analyzed_resumes
ALTER TABLE public.analyzed_resumes 
ADD COLUMN IF NOT EXISTS rank INTEGER,
ADD COLUMN IF NOT EXISTS role_category TEXT,
ADD COLUMN IF NOT EXISTS role_subcategory TEXT;

-- Create index for better filtering
CREATE INDEX IF NOT EXISTS idx_analyzed_resumes_role_category ON public.analyzed_resumes(role_category);
CREATE INDEX IF NOT EXISTS idx_analyzed_resumes_rank ON public.analyzed_resumes(rank);