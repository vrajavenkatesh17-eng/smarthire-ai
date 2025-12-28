-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team memberships table
CREATE TABLE public.team_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create candidate notes table (shared across team)
CREATE TABLE public.candidate_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidate_pipeline(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create candidate ratings table
CREATE TABLE public.candidate_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidate_pipeline(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category TEXT NOT NULL DEFAULT 'overall',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, user_id, category)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_ratings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

-- Teams policies
CREATE POLICY "Users can view teams they belong to"
ON public.teams FOR SELECT
USING (public.is_team_member(auth.uid(), id) OR created_by = auth.uid());

CREATE POLICY "Users can create teams"
ON public.teams FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team creators can update their teams"
ON public.teams FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Team creators can delete their teams"
ON public.teams FOR DELETE
USING (auth.uid() = created_by);

-- Team memberships policies
CREATE POLICY "Users can view memberships of their teams"
ON public.team_memberships FOR SELECT
USING (public.is_team_member(auth.uid(), team_id) OR user_id = auth.uid());

CREATE POLICY "Team creators can manage memberships"
ON public.team_memberships FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND created_by = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Team creators can delete memberships"
ON public.team_memberships FOR DELETE
USING (EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND created_by = auth.uid()) OR user_id = auth.uid());

-- Candidate notes policies
CREATE POLICY "Team members can view notes"
ON public.candidate_notes FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can create notes"
ON public.candidate_notes FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Users can update their own notes"
ON public.candidate_notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.candidate_notes FOR DELETE
USING (auth.uid() = user_id);

-- Candidate ratings policies
CREATE POLICY "Team members can view ratings"
ON public.candidate_ratings FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can create ratings"
ON public.candidate_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Users can update their own ratings"
ON public.candidate_ratings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
ON public.candidate_ratings FOR DELETE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_notes_updated_at
BEFORE UPDATE ON public.candidate_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_ratings_updated_at
BEFORE UPDATE ON public.candidate_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add team_id to candidate_pipeline for team sharing
ALTER TABLE public.candidate_pipeline ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Update candidate_pipeline RLS to allow team access
CREATE POLICY "Team members can view team candidates"
ON public.candidate_pipeline FOR SELECT
USING (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id));