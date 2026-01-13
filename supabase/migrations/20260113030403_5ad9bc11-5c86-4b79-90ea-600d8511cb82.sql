-- Add UPDATE policy for team_memberships to allow team creators to modify roles
CREATE POLICY "Team creators can update memberships"
ON public.team_memberships FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = team_memberships.team_id
    AND created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = team_memberships.team_id
    AND created_by = auth.uid()
  )
);