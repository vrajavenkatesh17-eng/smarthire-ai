import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Users, Loader2, CheckCircle2, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScheduleInterviewDialog } from "@/components/ScheduleInterviewDialog";

interface AnalyzedResume {
  id: string;
  file_name: string;
  candidate_name: string | null;
  candidate_email: string | null;
  analysis_result: any;
  ai_score: number | null;
  created_at: string;
}

const CandidateComparison = () => {
  const [resumes, setResumes] = useState<AnalyzedResume[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<AnalyzedResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    if (ids.length > 0 && resumes.length > 0) {
      const preselected = resumes.filter(r => ids.includes(r.id));
      setSelectedResumes(preselected);
    }
  }, [searchParams, resumes]);

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
        description: "Failed to load resumes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (resume: AnalyzedResume) => {
    if (selectedResumes.find(r => r.id === resume.id)) {
      setSelectedResumes(prev => prev.filter(r => r.id !== resume.id));
    } else if (selectedResumes.length < 4) {
      setSelectedResumes(prev => [...prev, resume]);
    } else {
      toast({
        title: "Maximum reached",
        description: "You can compare up to 4 candidates at once",
        variant: "destructive",
      });
    }
  };

  const parseScores = (analysisResult: any): Record<string, number> => {
    const scores: Record<string, number> = {};
    const text = typeof analysisResult === "string" ? analysisResult : JSON.stringify(analysisResult);
    
    const patterns = [
      { key: "Technical Skills", regex: /technical\s*skills?\s*(?:match)?:?\s*(\d+)/i },
      { key: "Experience", regex: /experience\s*(?:relevance)?:?\s*(\d+)/i },
      { key: "Education", regex: /education\s*(?:&\s*certifications)?:?\s*(\d+)/i },
      { key: "Communication", regex: /communication:?\s*(\d+)/i },
      { key: "Overall", regex: /overall\s*(?:score)?:?\s*(\d+)/i },
    ];

    patterns.forEach(({ key, regex }) => {
      const match = text.match(regex);
      if (match) {
        scores[key] = parseInt(match[1], 10);
      }
    });

    return scores;
  };

  const extractStrengths = (analysisResult: any): string[] => {
    const text = typeof analysisResult === "string" ? analysisResult : JSON.stringify(analysisResult);
    const strengthsMatch = text.match(/strengths?[:\s]*\n?([\s\S]*?)(?=\n\n|potential|concerns|interview|$)/i);
    if (strengthsMatch) {
      return strengthsMatch[1]
        .split(/\n|•|✓|-/)
        .map(s => s.trim())
        .filter(s => s.length > 3)
        .slice(0, 5);
    }
    return [];
  };

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
              <Link to="/resume-history">
                <Button variant="ghost" size="icon" className="hover-lift">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Compare Candidates</h1>
                  <p className="text-xs text-muted-foreground">Side-by-side scoring breakdown</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-6 py-8">
        {/* Selection Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-4 mb-6"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Select candidates to compare (max 4):
            </span>
            <div className="flex flex-wrap gap-2 flex-1">
              {resumes.map((resume) => (
                <button
                  key={resume.id}
                  onClick={() => toggleSelection(resume)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1 ${
                    selectedResumes.find(r => r.id === resume.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {resume.candidate_name || resume.file_name.slice(0, 20)}
                  {selectedResumes.find(r => r.id === resume.id) && (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Comparison Grid */}
        {selectedResumes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Select candidates to compare
            </h2>
            <p className="text-muted-foreground">
              Choose 2-4 candidates from the list above to see a side-by-side comparison
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-6" style={{ 
            gridTemplateColumns: `repeat(${Math.min(selectedResumes.length, 4)}, 1fr)` 
          }}>
            {selectedResumes.map((resume, index) => {
              const scores = parseScores(resume.analysis_result);
              const strengths = extractStrengths(resume.analysis_result);

              return (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6 relative"
                >
                  <button
                    onClick={() => toggleSelection(resume)}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-secondary"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-hero rounded-full flex items-center justify-center mb-3">
                      <span className="text-2xl font-bold text-primary-foreground">
                        {(resume.candidate_name || resume.file_name)[0].toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {resume.candidate_name || resume.file_name}
                    </h3>
                    {resume.candidate_email && (
                      <p className="text-xs text-muted-foreground">{resume.candidate_email}</p>
                    )}
                  </div>

                  {/* Overall Score */}
                  <div className="text-center mb-6">
                    <div className={`text-4xl font-bold ${
                      (resume.ai_score || 0) >= 85 ? "text-green-500" :
                      (resume.ai_score || 0) >= 70 ? "text-primary" :
                      (resume.ai_score || 0) >= 50 ? "text-yellow-500" :
                      "text-orange-500"
                    }`}>
                      {resume.ai_score || scores.Overall || "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground">Overall Score</p>
                  </div>

                  {/* Score Breakdown */}
                  <div className="space-y-3 mb-6">
                    {Object.entries(scores).filter(([key]) => key !== "Overall").map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{key}</span>
                          <span className="font-medium text-foreground">{value}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              value >= 80 ? "bg-green-500" :
                              value >= 60 ? "bg-primary" :
                              value >= 40 ? "bg-yellow-500" :
                              "bg-orange-500"
                            }`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Strengths */}
                  {strengths.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-foreground mb-2">Top Strengths</h4>
                      <ul className="space-y-1">
                        {strengths.slice(0, 3).map((strength, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-green-500">✓</span>
                            {strength.slice(0, 60)}{strength.length > 60 ? "..." : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Schedule Interview Button */}
                  {user && (
                    <ScheduleInterviewDialog
                      candidateName={resume.candidate_name || resume.file_name}
                      candidateEmail={resume.candidate_email}
                      resumeId={resume.id}
                      userId={user.id}
                      trigger={
                        <Button variant="outline" size="sm" className="w-full">
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Interview
                        </Button>
                      }
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default CandidateComparison;
