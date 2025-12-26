import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Trash2, Clock, Loader2, Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AnalyzedResume {
  id: string;
  file_name: string;
  candidate_name: string | null;
  candidate_email: string | null;
  analysis_result: any;
  ai_score: number | null;
  created_at: string;
}

type SortOption = "date-desc" | "date-asc" | "score-desc" | "score-asc" | "name-asc" | "name-desc";
type ScoreFilter = "all" | "90+" | "80+" | "70+" | "below-70";

const ResumeHistory = () => {
  const [resumes, setResumes] = useState<AnalyzedResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<AnalyzedResume | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
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
      fetchResumes();
    }
  }, [user]);

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase
        .from("analyzed_resumes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load resume history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteResume = async (id: string) => {
    try {
      const { error } = await supabase
        .from("analyzed_resumes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setResumes(resumes.filter((r) => r.id !== id));
      if (selectedResume?.id === id) setSelectedResume(null);

      toast({
        title: "Deleted",
        description: "Resume analysis removed from history",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete resume",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAndSortedResumes = useMemo(() => {
    let filtered = resumes;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.candidate_name?.toLowerCase().includes(query) ||
          r.file_name.toLowerCase().includes(query) ||
          r.candidate_email?.toLowerCase().includes(query)
      );
    }

    // Apply score filter
    switch (scoreFilter) {
      case "90+":
        filtered = filtered.filter((r) => r.ai_score && r.ai_score >= 90);
        break;
      case "80+":
        filtered = filtered.filter((r) => r.ai_score && r.ai_score >= 80);
        break;
      case "70+":
        filtered = filtered.filter((r) => r.ai_score && r.ai_score >= 70);
        break;
      case "below-70":
        filtered = filtered.filter((r) => !r.ai_score || r.ai_score < 70);
        break;
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "date-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "score-desc":
          return (b.ai_score || 0) - (a.ai_score || 0);
        case "score-asc":
          return (a.ai_score || 0) - (b.ai_score || 0);
        case "name-asc":
          return (a.candidate_name || a.file_name).localeCompare(b.candidate_name || b.file_name);
        case "name-desc":
          return (b.candidate_name || b.file_name).localeCompare(a.candidate_name || a.file_name);
        default:
          return 0;
      }
    });
  }, [resumes, searchQuery, sortOption, scoreFilter]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/resume-analyzer">
                <Button variant="ghost" size="icon" className="hover-lift">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Analysis History
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {filteredAndSortedResumes.length} of {resumes.length} resume{resumes.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
            <Link to="/resume-analyzer">
              <Button>Analyze New Resume</Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {resumes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto bg-secondary/50 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No resumes analyzed yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Start by uploading a resume to analyze
            </p>
            <Link to="/resume-analyzer">
              <Button>Analyze Your First Resume</Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={scoreFilter} onValueChange={(v) => setScoreFilter(v as ScoreFilter)}>
                  <SelectTrigger className="w-[140px]">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="90+">90+ (Excellent)</SelectItem>
                    <SelectItem value="80+">80+ (Good)</SelectItem>
                    <SelectItem value="70+">70+ (Fair)</SelectItem>
                    <SelectItem value="below-70">Below 70</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                  <SelectTrigger className="w-[160px]">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="score-desc">Highest Score</SelectItem>
                    <SelectItem value="score-asc">Lowest Score</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Resume List */}
              <div className="lg:col-span-1 space-y-3">
                {filteredAndSortedResumes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No resumes match your filters
                  </div>
                ) : (
                  filteredAndSortedResumes.map((resume, index) => (
                    <motion.div
                      key={resume.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedResume(resume)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedResume?.id === resume.id
                          ? "bg-primary/10 border-primary"
                          : "bg-card border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {resume.candidate_name || resume.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(resume.created_at)}
                            </p>
                            {resume.ai_score && (
                              <div className="mt-1">
                                <span className={`text-xs font-medium ${
                                  resume.ai_score >= 90 ? "text-green-500" :
                                  resume.ai_score >= 80 ? "text-primary" :
                                  resume.ai_score >= 70 ? "text-yellow-500" :
                                  "text-orange-500"
                                }`}>
                                  Score: {resume.ai_score}/100
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteResume(resume.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Analysis Detail */}
              <div className="lg:col-span-2">
                {selectedResume ? (
                  <motion.div
                    key={selectedResume.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-foreground">
                          {selectedResume.candidate_name || selectedResume.file_name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Analyzed on {formatDate(selectedResume.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none text-foreground">
                      <pre className="whitespace-pre-wrap text-sm font-sans bg-secondary/50 rounded-xl p-4 overflow-x-auto">
                        {typeof selectedResume.analysis_result === "string"
                          ? selectedResume.analysis_result
                          : JSON.stringify(selectedResume.analysis_result, null, 2)}
                      </pre>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a resume to view its analysis
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ResumeHistory;
