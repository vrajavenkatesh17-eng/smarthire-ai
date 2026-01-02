-- Fix interview_feedback INSERT policy to require team membership verification
DROP POLICY IF EXISTS "Users can create feedback" ON public.interview_feedback;

CREATE POLICY "Users can create feedback with team verification"
ON public.interview_feedback
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (team_id IS NULL OR is_team_member(auth.uid(), team_id))
);

-- Add team-based SELECT policy to interviews table
-- First, we need to check if the interview's pipeline_id links to a candidate in a team the user belongs to
CREATE POLICY "Team members can view team interviews"
ON public.interviews
FOR SELECT
USING (
  pipeline_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.candidate_pipeline cp
    WHERE cp.id = interviews.pipeline_id
    AND cp.team_id IS NOT NULL
    AND is_team_member(auth.uid(), cp.team_id)
  )
);