-- Create enum for candidate pipeline stages
CREATE TYPE public.candidate_stage AS ENUM ('new', 'screening', 'interview_scheduled', 'interviewed', 'offer', 'hired', 'rejected');

-- Create candidate pipeline table
CREATE TABLE public.candidate_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_id UUID REFERENCES public.analyzed_resumes(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  stage candidate_stage NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interviews table
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pipeline_id UUID REFERENCES public.candidate_pipeline(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  interview_type TEXT NOT NULL DEFAULT 'video',
  location TEXT,
  interviewer_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidate_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for candidate_pipeline
CREATE POLICY "Users can view their own pipeline candidates"
ON public.candidate_pipeline FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pipeline candidates"
ON public.candidate_pipeline FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pipeline candidates"
ON public.candidate_pipeline FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pipeline candidates"
ON public.candidate_pipeline FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for interviews
CREATE POLICY "Users can view their own interviews"
ON public.interviews FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interviews"
ON public.interviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews"
ON public.interviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interviews"
ON public.interviews FOR DELETE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_candidate_pipeline_updated_at
BEFORE UPDATE ON public.candidate_pipeline
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
BEFORE UPDATE ON public.interviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();