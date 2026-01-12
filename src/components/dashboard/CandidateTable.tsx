import { motion } from "framer-motion";
import { MoreHorizontal, Star, Mail, ExternalLink, Trophy, Award, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Resume {
  id: string;
  candidate_name: string | null;
  candidate_email: string | null;
  ai_score: number | null;
  role_category: string | null;
  role_subcategory: string | null;
  rank: number | null;
  file_name: string;
  created_at: string;
}

interface DashboardFilters {
  search: string;
  roleCategory: string;
  stage: string;
  scoreRange: string;
}

interface CandidateTableProps {
  filters?: DashboardFilters;
  resumes?: Resume[];
}

// Mock data fallback
const mockCandidates = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Senior Software Engineer",
    email: "sarah.chen@email.com",
    stage: "Interview",
    score: 94,
    rank: 1,
    roleCategory: "frontend",
    applied: "2 days ago",
    avatar: "SC",
    skills: ["React", "TypeScript", "Node.js"],
  },
  {
    id: "2",
    name: "Marcus Johnson",
    role: "Product Designer",
    email: "marcus.j@email.com",
    stage: "Assessment",
    score: 88,
    rank: 2,
    roleCategory: "design",
    applied: "3 days ago",
    avatar: "MJ",
    skills: ["Figma", "UI/UX", "Prototyping"],
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "Data Scientist",
    email: "emily.r@email.com",
    stage: "Screening",
    score: 91,
    rank: 3,
    roleCategory: "data",
    applied: "1 day ago",
    avatar: "ER",
    skills: ["Python", "ML", "SQL"],
  },
  {
    id: "4",
    name: "David Kim",
    role: "DevOps Engineer",
    email: "david.kim@email.com",
    stage: "Interview",
    score: 86,
    rank: 4,
    roleCategory: "devops",
    applied: "4 days ago",
    avatar: "DK",
    skills: ["AWS", "Kubernetes", "Terraform"],
  },
  {
    id: "5",
    name: "Lisa Wang",
    role: "Frontend Developer",
    email: "lisa.w@email.com",
    stage: "Applied",
    score: 79,
    rank: 5,
    roleCategory: "frontend",
    applied: "5 days ago",
    avatar: "LW",
    skills: ["Vue.js", "CSS", "JavaScript"],
  },
];

const stageColors: Record<string, string> = {
  Applied: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  Screening: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Interview: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Assessment: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Hired: "bg-green-500/10 text-green-600 border-green-500/20",
};

const roleCategoryColors: Record<string, string> = {
  frontend: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  backend: "bg-green-500/10 text-green-600 border-green-500/20",
  fullstack: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  devops: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  data: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  design: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  product: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  other: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
  if (rank === 2) return <Award className="w-4 h-4 text-gray-400" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-700" />;
  return null;
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

const CandidateTable = ({ filters, resumes }: CandidateTableProps) => {
  // Use real data if available, otherwise use mock data
  const candidates = resumes && resumes.length > 0 
    ? resumes.map((resume, index) => ({
        id: resume.id,
        name: resume.candidate_name || "Unknown",
        role: resume.role_subcategory || resume.role_category || "Candidate",
        email: resume.candidate_email || "",
        stage: "Applied",
        score: resume.ai_score || 0,
        rank: resume.rank || index + 1,
        roleCategory: resume.role_category || "other",
        applied: formatTimeAgo(resume.created_at),
        avatar: (resume.candidate_name || "U").slice(0, 2).toUpperCase(),
        skills: [], // Could be extracted from analysis_result
      }))
    : mockCandidates;

  // Sort by score for ranking
  const sortedCandidates = [...candidates].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Top Candidates</h3>
            <p className="text-sm text-muted-foreground">
              {resumes && resumes.length > 0 
                ? `${resumes.length} candidates ranked by AI score`
                : "Highest scoring candidates in the pipeline"}
            </p>
          </div>
          <Link to="/resume-history">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Rank
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Candidate
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Role Category
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                AI Score
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCandidates.slice(0, 10).map((candidate, index) => (
              <motion.tr
                key={candidate.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors group"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    {getRankIcon(index + 1)}
                    <span className={cn(
                      "font-bold text-lg",
                      index === 0 && "text-yellow-500",
                      index === 1 && "text-gray-400",
                      index === 2 && "text-amber-700",
                      index > 2 && "text-muted-foreground"
                    )}>
                      #{index + 1}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {candidate.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground">{candidate.email || candidate.applied}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-medium capitalize",
                      roleCategoryColors[candidate.roleCategory] || roleCategoryColors.other
                    )}
                  >
                    {candidate.roleCategory}
                  </Badge>
                  {candidate.role !== candidate.roleCategory && (
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{candidate.role}</p>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="hsl(var(--secondary))"
                          strokeWidth="4"
                          fill="none"
                        />
                        <motion.circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke={candidate.score >= 90 ? "hsl(142, 76%, 36%)" : candidate.score >= 80 ? "hsl(45, 100%, 51%)" : "hsl(var(--primary))"}
                          strokeWidth="4"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: "0 126" }}
                          animate={{ strokeDasharray: `${(candidate.score / 100) * 126} 126` }}
                          transition={{ delay: index * 0.1, duration: 0.8 }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                        {candidate.score}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {candidate.email && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={`mailto:${candidate.email}`}>
                          <Mail className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Link to={`/resume-history`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidateTable;