import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, FileText, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

interface MatchResult {
  resumeId: string;
  candidateName: string;
  matchScore: number;
  breakdown: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    overallFit: number;
  };
  highlights: string[];
  gaps: string[];
}

const JobMatching = () => {
  const [resumes, setResumes] = useState<AnalyzedResume[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
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
        description: "Failed to load resumes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleResumeSelection = (id: string) => {
    setSelectedResumes(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const runJobMatching = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description to match against",
        variant: "destructive",
      });
      return;
    }

    if (selectedResumes.length === 0) {
      toast({
        title: "No resumes selected",
        description: "Please select at least one resume to match",
        variant: "destructive",
      });
      return;
    }

    setIsMatching(true);
    setMatchResults([]);

    try {
      const selectedData = resumes.filter(r => selectedResumes.includes(r.id));
      
      const response = await supabase.functions.invoke("match-job-description", {
        body: {
          jobDescription,
          resumes: selectedData.map(r => ({
            id: r.id,
            candidateName: r.candidate_name || r.file_name,
            analysisResult: r.analysis_result,
          })),
        },
      });

      if (response.error) throw response.error;

      setMatchResults(response.data.results || []);
      
      toast({
        title: "Matching complete",
        description: `Matched ${selectedData.length} resumes against job description`,
      });
    } catch (error) {
      console.error("Job matching error:", error);
      toast({
        title: "Error",
        description: "Failed to run job matching",
        variant: "destructive",
      });
    } finally {
      setIsMatching(false);
    }
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
              <Link to="/resume-analyzer">
                <Button variant="ghost" size="icon" className="hover-lift">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Job Matching</h1>
                  <p className="text-xs text-muted-foreground">Score resumes against requirements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Job Description & Resume Selection */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Job Description
              </h2>
              <Textarea
                placeholder="Paste the job description here. Include required skills, experience level, responsibilities, and any must-have qualifications..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Select Resumes ({selectedResumes.length} selected)
              </h2>
              
              {resumes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No analyzed resumes yet. <Link to="/resume-analyzer" className="text-primary">Upload some first</Link>.
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {resumes.map((resume) => (
                    <div
                      key={resume.id}
                      onClick={() => toggleResumeSelection(resume.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                        selectedResumes.includes(resume.id)
                          ? "bg-primary/10 border-primary"
                          : "bg-secondary/30 border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedResumes.includes(resume.id)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}>
                        {selectedResumes.includes(resume.id) && (
                          <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {resume.candidate_name || resume.file_name}
                        </p>
                        {resume.ai_score && (
                          <p className="text-xs text-muted-foreground">
                            Current score: {resume.ai_score}/100
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={runJobMatching}
                disabled={isMatching || selectedResumes.length === 0 || !jobDescription.trim()}
                className="w-full mt-4"
              >
                {isMatching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Matching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Run Job Matching
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Right: Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Match Results
            </h2>

            {matchResults.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select resumes and run matching to see results
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {matchResults
                  .sort((a, b) => b.matchScore - a.matchScore)
                  .map((result, index) => (
                    <div
                      key={result.resumeId}
                      className="p-4 bg-secondary/30 rounded-xl border border-border"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? "bg-yellow-500 text-yellow-950" :
                            index === 1 ? "bg-gray-400 text-gray-900" :
                            index === 2 ? "bg-amber-700 text-amber-100" :
                            "bg-secondary text-muted-foreground"
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-semibold text-foreground">
                            {result.candidateName}
                          </span>
                        </div>
                        <span className={`text-lg font-bold ${
                          result.matchScore >= 85 ? "text-green-500" :
                          result.matchScore >= 70 ? "text-primary" :
                          result.matchScore >= 50 ? "text-yellow-500" :
                          "text-orange-500"
                        }`}>
                          {result.matchScore}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <ScoreBar label="Skills" value={result.breakdown.skillsMatch} />
                        <ScoreBar label="Experience" value={result.breakdown.experienceMatch} />
                        <ScoreBar label="Education" value={result.breakdown.educationMatch} />
                        <ScoreBar label="Overall Fit" value={result.breakdown.overallFit} />
                      </div>

                      {result.highlights.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-green-500 mb-1">Highlights:</p>
                          <p className="text-xs text-muted-foreground">
                            {result.highlights.join(", ")}
                          </p>
                        </div>
                      )}

                      {result.gaps.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-orange-500 mb-1">Gaps:</p>
                          <p className="text-xs text-muted-foreground">
                            {result.gaps.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

const ScoreBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}%</span>
    </div>
    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          value >= 80 ? "bg-green-500" :
          value >= 60 ? "bg-primary" :
          value >= 40 ? "bg-yellow-500" :
          "bg-orange-500"
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export default JobMatching;
