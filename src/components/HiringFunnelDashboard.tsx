import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  UserCheck, 
  Calendar,
  BarChart3,
  Target,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, differenceInDays, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

interface TimeToHireMetric {
  stage: string;
  avgDays: number;
}

interface HiringTrend {
  date: string;
  hired: number;
  rejected: number;
  inProgress: number;
}

const STAGE_COLORS = {
  new: "#3B82F6",
  screening: "#8B5CF6",
  interview_scheduled: "#F59E0B",
  interviewed: "#10B981",
  offer: "#EC4899",
  hired: "#22C55E",
  rejected: "#EF4444",
};

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  screening: "Screening",
  interview_scheduled: "Interview Scheduled",
  interviewed: "Interviewed",
  offer: "Offer Extended",
  hired: "Hired",
  rejected: "Rejected",
};

const HiringFunnelDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [timeToHire, setTimeToHire] = useState<number>(0);
  const [stageMetrics, setStageMetrics] = useState<TimeToHireMetric[]>([]);
  const [trends, setTrends] = useState<HiringTrend[]>([]);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    hiredThisMonth: 0,
    avgTimeToHire: 0,
    conversionRate: 0,
    interviewRate: 0,
    offerRate: 0,
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch pipeline data
      const { data: pipeline, error: pipelineError } = await supabase
        .from("candidate_pipeline")
        .select("*")
        .order("created_at", { ascending: false });

      if (pipelineError) throw pipelineError;

      const candidates = pipeline || [];
      const totalCandidates = candidates.length;

      // Calculate funnel stages
      const stageCounts: Record<string, number> = {
        new: 0,
        screening: 0,
        interview_scheduled: 0,
        interviewed: 0,
        offer: 0,
        hired: 0,
        rejected: 0,
      };

      candidates.forEach((c) => {
        if (stageCounts[c.stage] !== undefined) {
          stageCounts[c.stage]++;
        }
      });

      const funnel: FunnelStage[] = Object.entries(stageCounts)
        .filter(([stage]) => stage !== "rejected")
        .map(([stage, count]) => ({
          stage: STAGE_LABELS[stage] || stage,
          count,
          percentage: totalCandidates > 0 ? Math.round((count / totalCandidates) * 100) : 0,
          color: STAGE_COLORS[stage as keyof typeof STAGE_COLORS] || "#6B7280",
        }));

      setFunnelData(funnel);

      // Calculate time-to-hire for hired candidates
      const hiredCandidates = candidates.filter((c) => c.stage === "hired");
      const hiredThisMonth = hiredCandidates.filter((c) => {
        const hiredDate = new Date(c.updated_at);
        const monthAgo = subDays(new Date(), 30);
        return hiredDate >= monthAgo;
      }).length;

      let avgTimeToHire = 0;
      if (hiredCandidates.length > 0) {
        const totalDays = hiredCandidates.reduce((acc, c) => {
          const created = new Date(c.created_at);
          const updated = new Date(c.updated_at);
          return acc + differenceInDays(updated, created);
        }, 0);
        avgTimeToHire = Math.round(totalDays / hiredCandidates.length);
      }

      setTimeToHire(avgTimeToHire);

      // Calculate conversion rates
      const screened = stageCounts.screening + stageCounts.interview_scheduled + stageCounts.interviewed + stageCounts.offer + stageCounts.hired;
      const interviewed = stageCounts.interviewed + stageCounts.offer + stageCounts.hired;
      const offered = stageCounts.offer + stageCounts.hired;

      const conversionRate = totalCandidates > 0 ? Math.round((stageCounts.hired / totalCandidates) * 100) : 0;
      const interviewRate = screened > 0 ? Math.round((interviewed / screened) * 100) : 0;
      const offerRate = interviewed > 0 ? Math.round((stageCounts.hired / interviewed) * 100) : 0;

      setStats({
        totalCandidates,
        hiredThisMonth,
        avgTimeToHire,
        conversionRate,
        interviewRate,
        offerRate,
      });

      // Generate trend data (last 7 days)
      const trendData: HiringTrend[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "MMM d");
        
        const hiredOnDay = candidates.filter((c) => 
          c.stage === "hired" && 
          format(new Date(c.updated_at), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
        ).length;

        const rejectedOnDay = candidates.filter((c) => 
          c.stage === "rejected" && 
          format(new Date(c.updated_at), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
        ).length;

        const inProgressOnDay = candidates.filter((c) => 
          !["hired", "rejected"].includes(c.stage) && 
          format(new Date(c.updated_at), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
        ).length;

        trendData.push({
          date: dateStr,
          hired: hiredOnDay,
          rejected: rejectedOnDay,
          inProgress: inProgressOnDay,
        });
      }
      setTrends(trendData);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Hiring Funnel Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Track your hiring pipeline performance and time-to-hire metrics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalCandidates}</p>
                  <p className="text-xs text-muted-foreground">Total Candidates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <UserCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.hiredThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Hired (30 days)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgTimeToHire}</p>
                  <p className="text-xs text-muted-foreground">Avg Days to Hire</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Target className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Funnel Visualization */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Hiring Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnelData.map((stage, index) => (
                  <motion.div
                    key={stage.stage}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{stage.stage}</span>
                      <span className="text-muted-foreground">{stage.count} ({stage.percentage}%)</span>
                    </div>
                    <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.2 * index }}
                        className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end pr-2"
                        style={{ backgroundColor: stage.color }}
                      >
                        {stage.percentage > 10 && (
                          <span className="text-xs font-medium text-white">{stage.count}</span>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                7-Day Activity Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hired" 
                    stroke="#22C55E" 
                    strokeWidth={2}
                    dot={{ fill: "#22C55E" }}
                    name="Hired"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="inProgress" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: "#3B82F6" }}
                    name="In Progress"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Conversion Rates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Conversion Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/30 rounded-xl">
                <div className="text-3xl font-bold text-primary mb-1">{stats.interviewRate}%</div>
                <div className="text-sm text-muted-foreground">Screening → Interview</div>
                <Progress value={stats.interviewRate} className="mt-2 h-2" />
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-xl">
                <div className="text-3xl font-bold text-success mb-1">{stats.offerRate}%</div>
                <div className="text-sm text-muted-foreground">Interview → Hire</div>
                <Progress value={stats.offerRate} className="mt-2 h-2" />
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-xl">
                <div className="text-3xl font-bold text-accent mb-1">{stats.conversionRate}%</div>
                <div className="text-sm text-muted-foreground">Overall Conversion</div>
                <Progress value={stats.conversionRate} className="mt-2 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default HiringFunnelDashboard;
