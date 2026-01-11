-- Create pipeline_activities table to track stage changes for activity feed
CREATE TABLE public.pipeline_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  candidate_id UUID REFERENCES public.candidate_pipeline(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  old_stage TEXT,
  new_stage TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipeline_activities ENABLE ROW LEVEL SECURITY;

-- Users can view their own activities
CREATE POLICY "Users can view their own activities"
ON public.pipeline_activities
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own activities
CREATE POLICY "Users can insert their own activities"
ON public.pipeline_activities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Team members can view team activities
CREATE POLICY "Team members can view team candidate activities"
ON public.pipeline_activities
FOR SELECT
USING (
  candidate_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.candidate_pipeline cp 
    WHERE cp.id = pipeline_activities.candidate_id 
    AND cp.team_id IS NOT NULL 
    AND is_team_member(auth.uid(), cp.team_id)
  )
);

-- Create index for faster queries
CREATE INDEX idx_pipeline_activities_user_id ON public.pipeline_activities(user_id);
CREATE INDEX idx_pipeline_activities_created_at ON public.pipeline_activities(created_at DESC);