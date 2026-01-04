import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, FileText, Zap, Shield, BarChart3, Files, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ResumeUpload from "@/components/ResumeUpload";
import BulkResumeUpload from "@/components/BulkResumeUpload";
import { useAuth } from "@/hooks/useAuth";

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
  const [jobDescription, setJobDescription] = useState("");
  const [isJobDescOpen, setIsJobDescOpen] = useState(false);
  
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
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Paste a job description to get tailored candidate matching scores and recommendations.
                  </p>
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
    </div>
  );
};

export default ResumeAnalyzer;
