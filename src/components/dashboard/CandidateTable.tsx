import { motion } from "framer-motion";
import { MoreHorizontal, Star, Mail, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const candidates = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Senior Software Engineer",
    email: "sarah.chen@email.com",
    stage: "Interview",
    score: 94,
    applied: "2 days ago",
    avatar: "SC",
    skills: ["React", "TypeScript", "Node.js"],
  },
  {
    id: 2,
    name: "Marcus Johnson",
    role: "Product Designer",
    email: "marcus.j@email.com",
    stage: "Assessment",
    score: 88,
    applied: "3 days ago",
    avatar: "MJ",
    skills: ["Figma", "UI/UX", "Prototyping"],
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Data Scientist",
    email: "emily.r@email.com",
    stage: "Screening",
    score: 91,
    applied: "1 day ago",
    avatar: "ER",
    skills: ["Python", "ML", "SQL"],
  },
  {
    id: 4,
    name: "David Kim",
    role: "DevOps Engineer",
    email: "david.kim@email.com",
    stage: "Interview",
    score: 86,
    applied: "4 days ago",
    avatar: "DK",
    skills: ["AWS", "Kubernetes", "Terraform"],
  },
  {
    id: 5,
    name: "Lisa Wang",
    role: "Frontend Developer",
    email: "lisa.w@email.com",
    stage: "Applied",
    score: 79,
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

const CandidateTable = () => {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Top Candidates</h3>
            <p className="text-sm text-muted-foreground">Highest scoring candidates in the pipeline</p>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Candidate
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Role
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Stage
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                AI Score
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Skills
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate, index) => (
              <motion.tr
                key={candidate.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors group"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {candidate.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground">{candidate.applied}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <p className="text-sm text-foreground">{candidate.role}</p>
                </td>
                <td className="py-4 px-6">
                  <Badge 
                    variant="outline" 
                    className={cn("font-medium", stageColors[candidate.stage])}
                  >
                    {candidate.stage}
                  </Badge>
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
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 2).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{candidate.skills.length - 2}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
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
