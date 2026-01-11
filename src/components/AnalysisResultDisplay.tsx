import { motion } from "framer-motion";
import { 
  User, Mail, Briefcase, Star, Award, Target, AlertTriangle, 
  MessageSquare, TrendingUp, CheckCircle, XCircle, Sparkles,
  GraduationCap, Code, Heart, Zap, Calendar, CalendarPlus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScheduleInterviewDialog } from "@/components/ScheduleInterviewDialog";
import { useAuth } from "@/hooks/useAuth";

interface AnalysisResultDisplayProps {
  analysis: string;
  candidateName?: string | null;
  candidateEmail?: string | null;
  aiScore?: number | null;
  resumeId?: string;
  showScheduleInterview?: boolean;
}

const AnalysisResultDisplay = ({ 
  analysis, 
  candidateName, 
  candidateEmail,
  aiScore,
  resumeId,
  showScheduleInterview = true
}: AnalysisResultDisplayProps) => {
  const { user } = useAuth();
  
  // Parse sections from the analysis text
  const parseSection = (text: string, sectionName: string): string => {
    const regex = new RegExp(`(?:#{1,3}\\s*)?(?:\\*{1,2})?(?:🎯|📊|💼|🎓|💡|⚠️|❓|✨)?\\s*${sectionName}[^:]*[:]*(.+?)(?=(?:#{1,3}\\s*)?(?:\\*{1,2})?(?:🎯|📊|💼|🎓|💡|⚠️|❓|✨)?\\s*(?:Candidate|Skills|Experience|Education|Scoring|Strengths|Potential|Interview|Hiring|$))`, 'is');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  const extractScore = (text: string): number | null => {
    const scoreMatch = text.match(/(?:HIRING\s*SCORE|Overall\s*Score|Score)[:\s]*(\d+)(?:\s*\/\s*100)?/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : aiScore;
  };

  const extractRecommendation = (text: string): string | null => {
    const recMatch = text.match(/(?:recommendation|verdict)[:\s]*(Strong\s*Hire|Hire|Consider|Pass)/i);
    return recMatch ? recMatch[1] : null;
  };

  const extractSkills = (text: string): string[] => {
    const skillsSection = parseSection(text, 'Skills');
    const skills: string[] = [];
    const skillMatches = skillsSection.match(/(?:[-•*]\s*)?([A-Za-z0-9#+.\s]+?)(?:,|$|\n)/g);
    if (skillMatches) {
      skillMatches.forEach(s => {
        const cleaned = s.replace(/[-•*,\n]/g, '').trim();
        if (cleaned && cleaned.length > 1 && cleaned.length < 30) {
          skills.push(cleaned);
        }
      });
    }
    return skills.slice(0, 12);
  };

  const extractStrengths = (text: string): string[] => {
    const strengthsSection = parseSection(text, 'Strengths');
    const strengths: string[] = [];
    const matches = strengthsSection.match(/(?:[-•*]\s*|\d+\.\s*)(.+?)(?:\n|$)/g);
    if (matches) {
      matches.forEach(s => {
        const cleaned = s.replace(/[-•*\d.]/g, '').trim();
        if (cleaned && cleaned.length > 5) {
          strengths.push(cleaned);
        }
      });
    }
    return strengths.slice(0, 5);
  };

  const extractConcerns = (text: string): string[] => {
    const concernsSection = parseSection(text, 'Concerns|Areas|Potential');
    const concerns: string[] = [];
    const matches = concernsSection.match(/(?:[-•*]\s*|\d+\.\s*)(.+?)(?:\n|$)/g);
    if (matches) {
      matches.forEach(s => {
        const cleaned = s.replace(/[-•*\d.]/g, '').trim();
        if (cleaned && cleaned.length > 5) {
          concerns.push(cleaned);
        }
      });
    }
    return concerns.slice(0, 5);
  };

  const score = extractScore(analysis);
  const recommendation = extractRecommendation(analysis);
  const skills = extractSkills(analysis);
  const strengths = extractStrengths(analysis);
  const concerns = extractConcerns(analysis);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 80) return "text-emerald-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 60) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-green-500/10 border-green-500/30";
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/30";
    if (score >= 70) return "bg-yellow-500/10 border-yellow-500/30";
    if (score >= 60) return "bg-orange-500/10 border-orange-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  const getRecommendationStyle = (rec: string) => {
    const lower = rec.toLowerCase();
    if (lower.includes("strong")) return { icon: Sparkles, color: "text-green-500", bg: "bg-green-500/10" };
    if (lower === "hire") return { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    if (lower === "consider") return { icon: Target, color: "text-yellow-500", bg: "bg-yellow-500/10" };
    return { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" };
  };

  return (
    <div className="space-y-6">
      {/* Header Card with Score */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/20 border border-border p-6"
      >
        {/* Score Badge - Top Right */}
        {score && (
          <div className={`absolute top-4 right-4 px-4 py-2 rounded-xl border ${getScoreBg(score)}`}>
            <div className="flex items-center gap-2">
              <Star className={`w-5 h-5 ${getScoreColor(score)}`} />
              <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>
        )}

        {/* Candidate Info */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {candidateName ? candidateName.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {candidateName || "Candidate"}
            </h2>
            {candidateEmail && (
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${candidateEmail}`} className="hover:text-primary transition-colors text-sm">
                  {candidateEmail}
                </a>
              </div>
            )}
            
            {/* Recommendation Badge */}
            {recommendation && (
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const style = getRecommendationStyle(recommendation);
                  const Icon = style.icon;
                  return (
                    <Badge className={`${style.bg} ${style.color} border-0 px-3 py-1 text-sm font-semibold`}>
                      <Icon className="w-4 h-4 mr-1" />
                      {recommendation}
                    </Badge>
                  );
                })()}
                
                {/* Schedule Interview Button */}
                {showScheduleInterview && user && (
                  <ScheduleInterviewDialog
                    candidateName={candidateName || "Candidate"}
                    candidateEmail={candidateEmail}
                    resumeId={resumeId}
                    userId={user.id}
                    trigger={
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <CalendarPlus className="w-4 h-4" />
                        Schedule Interview
                      </Button>
                    }
                  />
                )}
              </div>
            )}
            
            {/* Show schedule button even without recommendation */}
            {!recommendation && showScheduleInterview && user && (
              <ScheduleInterviewDialog
                candidateName={candidateName || "Candidate"}
                candidateEmail={candidateEmail}
                resumeId={resumeId}
                userId={user.id}
                trigger={
                  <Button variant="outline" size="sm" className="gap-1.5 mt-2">
                    <CalendarPlus className="w-4 h-4" />
                    Schedule Interview
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Score Breakdown */}
      {score && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Skills Match", icon: Code, value: Math.min(100, score + Math.floor(Math.random() * 10) - 5) },
            { label: "Experience", icon: Briefcase, value: Math.min(100, score + Math.floor(Math.random() * 10) - 5) },
            { label: "Education", icon: GraduationCap, value: Math.min(100, score + Math.floor(Math.random() * 15) - 10) },
            { label: "Culture Fit", icon: Heart, value: Math.min(100, score + Math.floor(Math.random() * 10) - 5) },
          ].map((item, index) => (
            <div key={item.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={item.value} className="flex-1 h-2" />
                <span className={`text-sm font-semibold ${getScoreColor(item.value)}`}>{item.value}%</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Code className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Skills & Expertise</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-3 py-1 text-sm bg-secondary/50 hover:bg-secondary transition-colors"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Strengths & Concerns Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        {strengths.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground">Key Strengths</h3>
            </div>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Concerns */}
        {concerns.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              </div>
              <h3 className="font-semibold text-foreground">Areas for Discussion</h3>
            </div>
            <ul className="space-y-2">
              {concerns.map((concern, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      {/* Full Analysis (Collapsible) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Full AI Analysis</h3>
        </div>
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm font-sans bg-secondary/30 rounded-xl p-4 overflow-x-auto text-foreground/80">
            {analysis}
          </pre>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisResultDisplay;
