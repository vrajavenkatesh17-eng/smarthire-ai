-- Create interview feedback table
CREATE TABLE public.interview_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  
  -- Overall recommendation
  recommendation TEXT NOT NULL CHECK (recommendation IN ('strong_hire', 'hire', 'no_hire', 'strong_no_hire')),
  
  -- Ratings (1-5)
  technical_skills INTEGER CHECK (technical_skills >= 1 AND technical_skills <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  problem_solving INTEGER CHECK (problem_solving >= 1 AND problem_solving <= 5),
  culture_fit INTEGER CHECK (culture_fit >= 1 AND culture_fit <= 5),
  experience_relevance INTEGER CHECK (experience_relevance >= 1 AND experience_relevance <= 5),
  
  -- Text feedback
  strengths TEXT,
  areas_for_improvement TEXT,
  additional_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One feedback per user per interview
  UNIQUE(interview_id, user_id)
);

-- Enable RLS
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own feedback"
ON public.interview_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Team members can view team feedback"
ON public.interview_feedback FOR SELECT
USING (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Users can create feedback"
ON public.interview_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
ON public.interview_feedback FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
ON public.interview_feedback FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_interview_feedback_updated_at
BEFORE UPDATE ON public.interview_feedback
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();