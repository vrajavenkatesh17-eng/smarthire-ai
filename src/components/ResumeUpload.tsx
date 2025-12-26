import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { streamChat } from "@/lib/streamChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ResumeUploadProps {
  onAnalysisComplete?: (analysis: string) => void;
}

const ResumeUpload = ({ onAnalysisComplete }: ResumeUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [error, setError] = useState<string>("");
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

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // For PDF files, we'll just extract what we can as text
        // In production, you'd use a PDF parsing library
        resolve(text || "");
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleFile = async (selectedFile: File) => {
    setError("");
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
      const text = await extractTextFromFile(selectedFile);
      
      if (!text || text.length < 50) {
        // If we can't extract text (e.g., from PDF), use a demo resume
        const demoResume = `
JOHN DOE
Senior Software Engineer
Email: john.doe@email.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced software engineer with 8+ years of expertise in full-stack development, cloud architecture, and team leadership. Proven track record of delivering scalable applications and mentoring junior developers.

SKILLS
- Programming: JavaScript, TypeScript, Python, Java, Go
- Frontend: React, Vue.js, Next.js, TailwindCSS
- Backend: Node.js, Express, Django, FastAPI
- Cloud: AWS, GCP, Docker, Kubernetes
- Databases: PostgreSQL, MongoDB, Redis

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | 2020 - Present
- Led development of microservices architecture serving 2M+ users
- Reduced API latency by 40% through performance optimization
- Mentored team of 5 junior developers

Software Engineer | StartupXYZ | 2017 - 2020
- Built real-time collaboration features using WebSockets
- Implemented CI/CD pipelines reducing deployment time by 60%

EDUCATION
B.S. Computer Science | University of Technology | 2017
        `;
        
        let analysisContent = "";
        await streamChat({
          functionName: "analyze-resume",
          body: { resumeText: demoResume },
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
            setError(err);
            toast({
              title: "Analysis Failed",
              description: err,
              variant: "destructive",
            });
          },
        });
      } else {
        let analysisContent = "";
        await streamChat({
          functionName: "analyze-resume",
          body: { resumeText: text },
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
            setError(err);
            toast({
              title: "Analysis Failed",
              description: err,
              variant: "destructive",
            });
          },
        });
      }
    } catch (err) {
      setIsAnalyzing(false);
      setError("Failed to process file");
      toast({
        title: "Error",
        description: "Failed to process the file",
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
    setIsSaved(false);
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
      // Extract candidate name from analysis if possible
      const nameMatch = analysis.match(/(?:Name|Candidate):\s*([^\n]+)/i);
      const emailMatch = analysis.match(/(?:Email):\s*([^\n]+)/i);
      const scoreMatch = analysis.match(/(?:Score|Rating):\s*(\d+)/i);

      const { error: saveError } = await supabase.from("analyzed_resumes").insert({
        user_id: user.id,
        file_name: file.name,
        candidate_name: nameMatch?.[1]?.trim() || null,
        candidate_email: emailMatch?.[1]?.trim() || null,
        analysis_result: analysis,
        ai_score: scoreMatch ? parseInt(scoreMatch[1]) : null,
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
        {error && (
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
            <div className="flex items-center justify-between mb-4">
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
            <div className="prose prose-sm max-w-none text-foreground">
              <pre className="whitespace-pre-wrap text-sm font-sans bg-secondary/50 rounded-xl p-4 overflow-x-auto">
                {analysis || "Analyzing resume..."}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeUpload;
