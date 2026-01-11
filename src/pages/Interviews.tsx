import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Calendar, Loader2, Search, Filter, Video, Phone, 
  MapPin, Clock, User, CheckCircle, XCircle, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarExportMenu } from "@/components/CalendarExportMenu";
import { InterviewFeedbackForm } from "@/components/InterviewFeedbackForm";
import { format, isToday, isTomorrow, isThisWeek, isPast, parseISO } from "date-fns";

interface Interview {
  id: string;
  pipeline_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  interview_type: string;
  location: string | null;
  interviewer_name: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface Candidate {
  id: string;
  candidate_name: string;
  candidate_email: string | null;
  team_id: string | null;
}

const getInterviewIcon = (type: string) => {
  switch (type) {
    case "video": return Video;
    case "phone": return Phone;
    case "in-person": return MapPin;
    default: return Video;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "scheduled": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    case "completed": return "bg-green-500/10 text-green-500 border-green-500/30";
    case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/30";
    default: return "bg-muted text-muted-foreground";
  }
};

const Interviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      const [interviewsRes, candidatesRes] = await Promise.all([
        supabase.from("interviews").select("*").order("scheduled_at", { ascending: true }),
        supabase.from("candidate_pipeline").select("id, candidate_name, candidate_email, team_id"),
      ]);

      if (interviewsRes.error) throw interviewsRes.error;
      if (candidatesRes.error) throw candidatesRes.error;

      setInterviews(interviewsRes.data || []);
      
      const candidateMap: Record<string, Candidate> = {};
      (candidatesRes.data || []).forEach(c => { candidateMap[c.id] = c; });
      setCandidates(candidateMap);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load interviews",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateInterviewStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("interviews")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setInterviews(interviews.map(i => i.id === id ? { ...i, status } : i));
      toast({ title: "Updated", description: `Interview marked as ${status}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update interview", variant: "destructive" });
    }
  };

  const filterInterviews = () => {
    return interviews.filter(interview => {
      const candidate = interview.pipeline_id ? candidates[interview.pipeline_id] : null;
      const candidateName = candidate?.candidate_name || "";
      const matchesSearch = candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        interview.interviewer_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || interview.status === statusFilter;

      const scheduledDate = parseISO(interview.scheduled_at);
      let matchesDate = true;
      if (dateFilter === "today") matchesDate = isToday(scheduledDate);
      else if (dateFilter === "tomorrow") matchesDate = isTomorrow(scheduledDate);
      else if (dateFilter === "this-week") matchesDate = isThisWeek(scheduledDate);
      else if (dateFilter === "past") matchesDate = isPast(scheduledDate);
      else if (dateFilter === "upcoming") matchesDate = !isPast(scheduledDate);

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const filteredInterviews = filterInterviews();
  const upcomingCount = interviews.filter(i => !isPast(parseISO(i.scheduled_at)) && i.status === "scheduled").length;
  const todayCount = interviews.filter(i => isToday(parseISO(i.scheduled_at))).length;
  const completedCount = interviews.filter(i => i.status === "completed").length;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Interviews</h1>
                  <p className="text-xs text-muted-foreground">{interviews.length} total interviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{upcomingCount}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{todayCount}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by candidate or interviewer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Interview List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {filteredInterviews.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No interviews found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            filteredInterviews.map((interview, index) => {
              const candidate = interview.pipeline_id ? candidates[interview.pipeline_id] : null;
              const InterviewIcon = getInterviewIcon(interview.interview_type);
              const scheduledDate = parseISO(interview.scheduled_at);
              const isPastInterview = isPast(scheduledDate);

              return (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors ${
                    isPastInterview && interview.status === "scheduled" ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <InterviewIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {candidate?.candidate_name || "Unknown Candidate"}
                          </h3>
                          <Badge variant="outline" className={getStatusColor(interview.status)}>
                            {interview.status}
                          </Badge>
                        </div>
                        {candidate?.candidate_email && (
                          <p className="text-sm text-muted-foreground mb-2">{candidate.candidate_email}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(scheduledDate, "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(scheduledDate, "h:mm a")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {interview.duration_minutes}min
                          </span>
                          {interview.interviewer_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {interview.interviewer_name}
                            </span>
                          )}
                        </div>
                        {interview.location && (
                          <p className="text-sm text-primary mt-2 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {interview.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <CalendarExportMenu
                        interview={{
                          candidateName: candidate?.candidate_name || "Candidate",
                          interviewType: interview.interview_type,
                          scheduledAt: scheduledDate,
                          durationMinutes: interview.duration_minutes,
                          location: interview.location,
                          interviewerName: interview.interviewer_name,
                          notes: interview.notes,
                        }}
                        size="sm"
                        variant="outline"
                      />
                      <InterviewFeedbackForm
                        interviewId={interview.id}
                        candidateName={candidate?.candidate_name || "Candidate"}
                        teamId={candidate?.team_id}
                      />
                      {interview.status === "scheduled" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-500 hover:text-green-600"
                            onClick={() => updateInterviewStatus(interview.id, "completed")}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => updateInterviewStatus(interview.id, "cancelled")}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Interviews;
