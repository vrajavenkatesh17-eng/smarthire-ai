import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { streamChat } from "@/lib/streamChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { extractTextFromFile } from "@/lib/documentParser";
import AuthErrorBanner from "@/components/AuthErrorBanner";
import AnalysisResultDisplay from "@/components/AnalysisResultDisplay";

interface ResumeUploadProps {
  onAnalysisComplete?: (analysis: string) => void;
  jobDescription?: string;
}

const ResumeUpload = ({ onAnalysisComplete, jobDescription }: ResumeUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFile = async (selectedFile: File) => {
    setError("");
    setAuthError(null);
    setAnalysis("");
    
    // Validate file type
    const validTypes = ["application/pdf", "text/plain", "application/msword", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".txt")) {
      setError("Please upload a PDF, DOC, DOCX, or TXT file");
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, DOCX, or TXT file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setIsAnalyzing(true);

    try {
      // Use proper document parsing
      const text = await extractTextFromFile(selectedFile);
      
      if (!text || text.trim().length < 50) {
        setError("Could not extract enough text from this file. Please try a different format.");
        setIsAnalyzing(false);
        toast({
          title: "Extraction Failed",
          description: "Could not extract text from this file. Try PDF or DOCX format.",
          variant: "destructive",
        });
        return;
      }

      let analysisContent = "";
      await streamChat({
        functionName: "analyze-resume",
        body: { resumeText: text, jobDescription: jobDescription || undefined },
        onDelta: (chunk) => {
          analysisContent += chunk;
          setAnalysis(analysisContent);
        },
        onDone: () => {
          setIsAnalyzing(false);
          onAnalysisComplete?.(analysisContent);
          toast({
            title: "Analysis Complete",
            description: "Resume has been analyzed successfully!",
          });
        },
        onError: (err) => {
          setIsAnalyzing(false);
          // Check if it's an auth error
          if (
            err.toLowerCase().includes("auth") ||
            err.toLowerCase().includes("sign in") ||
            err.toLowerCase().includes("session")
          ) {
            setAuthError(err);
          } else {
            setError(err);
          }
          toast({
            title: "Analysis Failed",
            description: err,
            variant: "destructive",
          });
        },
      });
    } catch (err) {
      setIsAnalyzing(false);
      const errorMessage = err instanceof Error ? err.message : "Failed to process file";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setAnalysis("");
    setError("");
    setAuthError(null);
    setIsSaved(false);
  };

  const retryAnalysis = () => {
    if (file) {
      handleFile(file);
    }
  };

  const saveAnalysis = async () => {
    if (!user || !file || !analysis) {
      toast({
        title: "Cannot Save",
        description: user ? "No analysis to save" : "Please sign in to save analyses",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Extract candidate info from analysis using improved patterns
      const namePatterns = [
        /\*\*CANDIDATE_NAME:\*\*\s*\[?\s*([^\]\n*]+)/i,
        /CANDIDATE_NAME:\s*\[?\s*([^\]\n]+)/i,
        /\*\*Name:\*\*\s*([^\n]+)/i,
        /(?:Name|Candidate):\s*([^\n]+)/i,
      ];
      
      let candidateName: string | null = null;
      for (const pattern of namePatterns) {
        const match = analysis.match(pattern);
        if (match && match[1]) {
          const name = match[1].replace(/\*+/g, '').trim();
          if (name && name.length > 1 && name.toLowerCase() !== 'not provided' && !name.includes('[')) {
            candidateName = name;
            break;
          }
        }
      }

      // Extract email with multiple patterns
      const emailPatterns = [
        /\*\*CANDIDATE_EMAIL:\*\*\s*\[?\s*([^\]\n*]+)/i,
        /CANDIDATE_EMAIL:\s*\[?\s*([^\]\n]+)/i,
        /\*\*Email:\*\*\s*([^\n]+)/i,
        /Email:\s*([^\s\n]+@[^\s\n]+)/i,
      ];
      
      let candidateEmail: string | null = null;
      for (const pattern of emailPatterns) {
        const match = analysis.match(pattern);
        if (match && match[1]) {
          const email = match[1].replace(/\*+/g, '').trim();
          if (email && email.includes('@') && email.includes('.') && 
              email.toLowerCase() !== 'not provided' && !email.includes('[')) {
            candidateEmail = email;
            break;
          }
        }
      }
      
      // Fallback: search for any email pattern in the analysis
      if (!candidateEmail) {
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const emailMatch = analysis.match(emailPattern);
        if (emailMatch) {
          candidateEmail = emailMatch[0];
        }
      }

      const scoreMatch = analysis.match(/(?:HIRING\s*SCORE|Score|Rating):\s*(\d+)/i);
      
      // Extract role category
      const roleCategoryMatch = analysis.match(/\*\*ROLE_CATEGORY:\*\*\s*\[?\s*([a-zA-Z]+)\s*\]?/i) ||
                                 analysis.match(/ROLE_CATEGORY:\s*\[?\s*([a-zA-Z]+)\s*\]?/i);
      const roleSubcategoryMatch = analysis.match(/\*\*ROLE_SUBCATEGORY:\*\*\s*\[?\s*([^\n\]]+)\s*\]?/i) ||
                                    analysis.match(/ROLE_SUBCATEGORY:\s*\[?\s*([^\n\]]+)\s*\]?/i);

      const roleCategory = roleCategoryMatch?.[1]?.trim().toLowerCase() || null;
      const roleSubcategory = roleSubcategoryMatch?.[1]?.trim() || null;
      const aiScore = scoreMatch ? parseInt(scoreMatch[1]) : null;

      // Calculate rank based on score (will be updated when fetching all resumes)
      let rank = null;
      if (aiScore) {
        // Get count of resumes with higher score for ranking
        const { count } = await supabase
          .from("analyzed_resumes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gt("ai_score", aiScore);
        
        rank = (count || 0) + 1;
      }

      const { error: saveError } = await supabase.from("analyzed_resumes").insert({
        user_id: user.id,
        file_name: file.name,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        analysis_result: analysis,
        ai_score: aiScore,
        role_category: roleCategory,
        role_subcategory: roleSubcategory,
        rank: rank,
      });

      if (saveError) throw saveError;

      setIsSaved(true);
      toast({
        title: "Saved",
        description: "Analysis saved to your history",
      });
    } catch (err) {
      toast({
        title: "Save Failed",
        description: "Could not save analysis",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Auth Error Banner */}
      <AuthErrorBanner
        error={authError}
        onRetry={retryAnalysis}
        onClear={() => setAuthError(null)}
      />

      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? "hsl(var(--primary))" : "hsl(var(--border))",
        }}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          isDragging ? "bg-primary/5" : "bg-secondary/30"
        } ${file ? "border-success" : ""}`}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isAnalyzing}
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ y: isDragging ? -5 : 0 }}
                className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center"
              >
                <Upload className="w-8 h-8 text-primary" />
              </motion.div>
              <div>
                <p className="text-lg font-medium text-foreground">
                  Drop your resume here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse (PDF, DOC, DOCX, TXT)
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center gap-4"
            >
              <div className="flex items-center gap-3 bg-background rounded-xl px-4 py-3 border border-border">
                <FileText className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground text-sm truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {isAnalyzing ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : error ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                )}
              </div>
              {!isAnalyzing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="h-10 w-10"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && !authError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-destructive text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Result */}
      <AnimatePresence>
        {(analysis || isAnalyzing) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">AI Analysis</h3>
                {isAnalyzing && (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                )}
              </div>
              {analysis && !isAnalyzing && (
                <Button
                  variant={isSaved ? "outline" : "default"}
                  size="sm"
                  onClick={saveAnalysis}
                  disabled={isSaving || isSaved || !user}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : isSaved ? (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaved ? "Saved" : user ? "Save Analysis" : "Sign in to Save"}
                </Button>
              )}
            </div>
            
            {isAnalyzing && !analysis ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Analyzing resume...</p>
                </div>
              </div>
            ) : analysis ? (
              <AnalysisResultDisplay
                analysis={analysis}
                candidateName={null}
                candidateEmail={null}
                aiScore={null}
                showScheduleInterview={false}
              />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeUpload;
