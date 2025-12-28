import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Users, Loader2, Plus, Calendar, MoreVertical,
  ChevronRight, UserPlus, Clock, CheckCircle, XCircle, Briefcase, MessageSquare, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { CandidateNotes } from "@/components/collaboration/CandidateNotes";
import { CandidateRatings } from "@/components/collaboration/CandidateRatings";

type CandidateStage = "new" | "screening" | "interview_scheduled" | "interviewed" | "offer" | "hired" | "rejected";

interface PipelineCandidate {
  id: string;
  user_id: string;
  resume_id: string | null;
  candidate_name: string;
  candidate_email: string | null;
  stage: CandidateStage;
  notes: string | null;
  created_at: string;
  updated_at: string;
  team_id: string | null;
}

interface Interview {
  id: string;
  pipeline_id: string;
  scheduled_at: string;
  duration_minutes: number;
  interview_type: string;
  location: string | null;
  interviewer_name: string | null;
  notes: string | null;
  status: string;
}

const STAGES: { key: CandidateStage; label: string; icon: typeof Users; color: string }[] = [
  { key: "new", label: "New", icon: UserPlus, color: "bg-blue-500" },
  { key: "screening", label: "Screening", icon: Users, color: "bg-purple-500" },
  { key: "interview_scheduled", label: "Interview Scheduled", icon: Calendar, color: "bg-yellow-500" },
  { key: "interviewed", label: "Interviewed", icon: Clock, color: "bg-orange-500" },
  { key: "offer", label: "Offer", icon: Briefcase, color: "bg-green-500" },
  { key: "hired", label: "Hired", icon: CheckCircle, color: "bg-emerald-600" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "bg-red-500" },
];

const TalentPipeline = () => {
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [candidateDetailsOpen, setCandidateDetailsOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<PipelineCandidate | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newCandidate, setNewCandidate] = useState({ name: "", email: "", notes: "", teamId: "" });
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [candidatesRes, interviewsRes] = await Promise.all([
        supabase.from("candidate_pipeline").select("*").order("created_at", { ascending: false }),
        supabase.from("interviews").select("*").order("scheduled_at", { ascending: true }),
      ]);

      if (candidatesRes.error) throw candidatesRes.error;
      if (interviewsRes.error) throw interviewsRes.error;

      setCandidates(candidatesRes.data || []);
      setInterviews(interviewsRes.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pipeline data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addCandidate = async () => {
    if (!newCandidate.name.trim() || !user) return;

    try {
      const { data, error } = await supabase.from("candidate_pipeline").insert({
        user_id: user.id,
        candidate_name: newCandidate.name,
        candidate_email: newCandidate.email || null,
        notes: newCandidate.notes || null,
        stage: "new" as CandidateStage,
        team_id: newCandidate.teamId || null,
      }).select().single();

      if (error) throw error;

      setCandidates([data, ...candidates]);
      setNewCandidate({ name: "", email: "", notes: "", teamId: "" });
      setAddDialogOpen(false);
      toast({ title: "Added", description: "Candidate added to pipeline" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add candidate", variant: "destructive" });
    }
  };

  const openCandidateDetails = (candidate: PipelineCandidate) => {
    setSelectedCandidate(candidate);
    setSelectedTeamId(candidate.team_id);
    setCandidateDetailsOpen(true);
  };

  const updateStage = async (candidateId: string, newStage: CandidateStage) => {
    try {
      const { error } = await supabase
        .from("candidate_pipeline")
        .update({ stage: newStage })
        .eq("id", candidateId);

      if (error) throw error;

      setCandidates(candidates.map(c => 
        c.id === candidateId ? { ...c, stage: newStage } : c
      ));
      toast({ title: "Updated", description: `Moved to ${STAGES.find(s => s.key === newStage)?.label}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update stage", variant: "destructive" });
    }
  };

  const deleteCandidate = async (id: string) => {
    try {
      const { error } = await supabase.from("candidate_pipeline").delete().eq("id", id);
      if (error) throw error;
      setCandidates(candidates.filter(c => c.id !== id));
      toast({ title: "Deleted", description: "Candidate removed from pipeline" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const getCandidatesByStage = (stage: CandidateStage) => 
    candidates.filter(c => c.stage === stage);

  const getUpcomingInterviews = () => 
    interviews.filter(i => new Date(i.scheduled_at) > new Date() && i.status === "scheduled");

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const upcomingInterviews = getUpcomingInterviews();

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/resume-history">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Talent Pipeline</h1>
                  <p className="text-xs text-muted-foreground">{candidates.length} candidates</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/teams">
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Teams
                </Button>
              </Link>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Candidate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Candidate to Pipeline</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={newCandidate.name}
                        onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                        placeholder="Candidate name"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newCandidate.email}
                        onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label>Team (for collaboration)</Label>
                      <Select 
                        value={newCandidate.teamId} 
                        onValueChange={(value) => setNewCandidate({ ...newCandidate, teamId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams?.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={newCandidate.notes}
                        onChange={(e) => setNewCandidate({ ...newCandidate, notes: e.target.value })}
                        placeholder="Initial notes about the candidate..."
                      />
                    </div>
                    <Button onClick={addCandidate} className="w-full" disabled={!newCandidate.name.trim()}>
                      Add to Pipeline
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-6 py-8">
        {/* Upcoming Interviews */}
        {upcomingInterviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-8"
          >
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Interviews ({upcomingInterviews.length})
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {upcomingInterviews.slice(0, 5).map((interview) => {
                const candidate = candidates.find(c => c.id === interview.pipeline_id);
                return (
                  <div key={interview.id} className="bg-card border border-border rounded-xl p-3 min-w-[200px]">
                    <p className="font-medium text-foreground">{candidate?.candidate_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(interview.scheduled_at).toLocaleDateString()} at{" "}
                      {new Date(interview.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-xs text-primary mt-1">{interview.interview_type} • {interview.duration_minutes}min</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Pipeline Stages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {STAGES.map((stage, stageIndex) => {
            const stageCandidates = getCandidatesByStage(stage.key);
            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: stageIndex * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 ${stage.color} rounded-lg flex items-center justify-center`}>
                    <stage.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{stage.label}</h3>
                    <p className="text-xs text-muted-foreground">{stageCandidates.length}</p>
                  </div>
                </div>

                <div className="space-y-2 min-h-[100px]">
                  {stageCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="bg-secondary/50 rounded-lg p-3 group cursor-pointer hover:bg-secondary/70 transition-colors"
                      onClick={() => openCandidateDetails(candidate)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground text-sm truncate">
                            {candidate.candidate_name}
                          </p>
                          {candidate.candidate_email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {candidate.candidate_email}
                            </p>
                          )}
                          {candidate.team_id && (
                            <div className="flex items-center gap-1 mt-1">
                              <Users className="w-3 h-3 text-primary" />
                              <span className="text-xs text-primary">Team</span>
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {STAGES.filter(s => s.key !== stage.key).map((s) => (
                              <DropdownMenuItem key={s.key} onClick={(e) => {
                                e.stopPropagation();
                                updateStage(candidate.id, s.key);
                              }}>
                                <ChevronRight className="w-3 h-3 mr-2" />
                                Move to {s.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCandidate(candidate.id);
                              }}
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Candidate Details Dialog with Notes & Ratings */}
        <Dialog open={candidateDetailsOpen} onOpenChange={setCandidateDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedCandidate?.candidate_name}
                {selectedCandidate?.team_id && (
                  <span className="text-sm font-normal text-primary flex items-center gap-1">
                    <Users className="w-4 h-4" /> Team Collaboration
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            {selectedCandidate && selectedTeamId ? (
              <div className="grid gap-4 md:grid-cols-2 pt-4">
                <CandidateNotes 
                  candidateId={selectedCandidate.id} 
                  teamId={selectedTeamId} 
                />
                <CandidateRatings 
                  candidateId={selectedCandidate.id} 
                  teamId={selectedTeamId} 
                />
              </div>
            ) : selectedCandidate ? (
              <div className="py-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  This candidate is not associated with a team.
                </p>
                <p className="text-sm text-muted-foreground">
                  Assign a team to enable collaborative notes and ratings.
                </p>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default TalentPipeline;
