import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Sparkles, FileText, Zap, Shield, BarChart3, Files, Briefcase, ChevronDown, ChevronUp, AlertTriangle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ResumeUpload from "@/components/ResumeUpload";
import BulkResumeUpload from "@/components/BulkResumeUpload";
import { JobDescriptionTemplates } from "@/components/JobDescriptionTemplates";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { PasskeyDialog } from "@/components/PasskeyDialog";

const features = [
  {
    icon: Zap,
    title: "Instant Analysis",
    description: "Get comprehensive resume insights in seconds"
  },
  {
    icon: BarChart3,
    title: "Skills Scoring",
    description: "AI-powered skill matching and scoring"
  },
  {
    icon: Shield,
    title: "Bias-Free",
    description: "Objective evaluation focused on qualifications"
  }
];

const ResumeAnalyzer = () => {
  const { user } = useAuth();
  const { isCompany } = useUserRole();
  const location = useLocation();
  const [jobDescription, setJobDescription] = useState("");
  const [isJobDescOpen, setIsJobDescOpen] = useState(false);
  const [showPasskeyDialog, setShowPasskeyDialog] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    if (location.state?.accessDenied) {
      setShowAccessDenied(true);
      // Clear the state after showing
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
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
              <Link to="/">
                <Button variant="ghost" size="icon" className="hover-lift">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Resume Analyzer</h1>
                  <p className="text-xs text-muted-foreground">AI-Powered Screening</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <Link to="/resume-history">
                  <Button variant="outline" size="sm">
                    View History
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Access Denied Alert */}
      {showAccessDenied && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-6 pt-6"
        >
          <Alert variant="destructive" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">Company Access Required</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              That feature requires Company access. Enter your passkey to unlock all features including 
              Dashboard, Talent Pipeline, Job Matching, Interviews, and Team Collaboration.
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 border-amber-600 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
                  onClick={() => {
                    setShowPasskeyDialog(true);
                    setShowAccessDenied(false);
                  }}
                >
                  <Key className="w-4 h-4" />
                  Enter Passkey
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 mx-auto bg-gradient-hero rounded-2xl flex items-center justify-center mb-6"
            >
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            <h2 className="text-heading md:text-display-sm text-foreground mb-4">
              Upload & Analyze <span className="text-gradient">Resumes</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI instantly evaluates resumes, extracting key skills, experience, and providing 
              actionable hiring recommendations. Just drag and drop to get started.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-secondary/30 border border-border rounded-xl p-4 text-center"
              >
                <div className="w-10 h-10 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Job Description Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Collapsible open={isJobDescOpen} onOpenChange={setIsJobDescOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Add Job Description (Optional)</span>
                    {jobDescription && <span className="text-xs text-primary ml-2">• Added</span>}
                  </div>
                  {isJobDescOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Paste a job description to get tailored candidate matching scores.
                    </p>
                    <JobDescriptionTemplates
                      jobDescription={jobDescription}
                      onSelectTemplate={(desc) => setJobDescription(desc)}
                      onSaveTemplate={() => {}}
                    />
                  </div>
                  <Textarea
                    placeholder="Paste the job description here to compare candidates against specific requirements..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[150px] resize-y"
                  />
                  {jobDescription && (
                    <Button variant="ghost" size="sm" onClick={() => setJobDescription("")}>
                      Clear
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>

          {/* Upload Component with Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="single" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Single Resume
                </TabsTrigger>
                <TabsTrigger value="bulk" className="gap-2">
                  <Files className="w-4 h-4" />
                  Bulk Upload
                </TabsTrigger>
              </TabsList>
              <TabsContent value="single">
                <ResumeUpload jobDescription={jobDescription} />
              </TabsContent>
              <TabsContent value="bulk">
                <BulkResumeUpload jobDescription={jobDescription} />
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-3">Tips for Best Results</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Upload resumes in PDF or plain text format for best extraction
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                The AI analyzes skills, experience, education, and overall fit
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Get interview question recommendations tailored to each candidate
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                View detailed scoring on technical skills, experience, and culture fit
              </li>
            </ul>
          </motion.div>
        </div>
      </main>

      <PasskeyDialog open={showPasskeyDialog} onOpenChange={setShowPasskeyDialog} />
    </div>
  );
};

export default ResumeAnalyzer;
