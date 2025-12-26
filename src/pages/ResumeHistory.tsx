import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Trash2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const ResumeHistory = () => {
  const [resumes, setResumes] = useState<AnalyzedResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<AnalyzedResume | null>(null);
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
                    {resumes.length} resume{resumes.length !== 1 ? "s" : ""} analyzed
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
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Resume List */}
            <div className="lg:col-span-1 space-y-3">
              {resumes.map((resume, index) => (
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
                            <span className="text-xs font-medium text-primary">
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
              ))}
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
        )}
      </main>
    </div>
  );
};

export default ResumeHistory;
