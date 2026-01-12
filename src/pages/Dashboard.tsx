import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  BarChart3,
  PieChart,
  Filter,
  Download,
  Search,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import MetricCard from "@/components/dashboard/MetricCard";
import PipelineVisualization from "@/components/dashboard/PipelineVisualization";
import CandidateTable from "@/components/dashboard/CandidateTable";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface DashboardFilters {
  search: string;
  roleCategory: string;
  stage: string;
  scoreRange: string;
}

interface DashboardMetrics {
  totalCandidates: number;
  resumesScreened: number;
  interviewRate: number;
  avgTimeToHire: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<DashboardFilters>({
    search: "",
    roleCategory: "all",
    stage: "all",
    scoreRange: "all",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch real data from Supabase
  const { data: candidatesData } = useQuery({
    queryKey: ["dashboard-candidates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidate_pipeline")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: resumesData } = useQuery({
    queryKey: ["dashboard-resumes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyzed_resumes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: interviewsData } = useQuery({
    queryKey: ["dashboard-interviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate metrics
  const metrics: DashboardMetrics = {
    totalCandidates: candidatesData?.length || 0,
    resumesScreened: resumesData?.length || 0,
    interviewRate: candidatesData?.length 
      ? Math.round((candidatesData.filter(c => 
          ["interview_scheduled", "interviewed", "offer", "hired"].includes(c.stage)
        ).length / candidatesData.length) * 100) 
      : 0,
    avgTimeToHire: candidatesData?.filter(c => c.stage === "hired").length || 0 > 0 
      ? 12 
      : 0,
  };

  // Get unique role categories for filter
  const roleCategories = [...new Set(resumesData?.map(r => r.role_category).filter(Boolean) || [])];

  // Filter resumes based on filters
  const filteredResumes = resumesData?.filter(resume => {
    const matchesSearch = !filters.search || 
      resume.candidate_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      resume.file_name?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesRole = filters.roleCategory === "all" || 
      resume.role_category === filters.roleCategory;
    
    const matchesScore = filters.scoreRange === "all" || (() => {
      const score = resume.ai_score || 0;
      switch (filters.scoreRange) {
        case "90-100": return score >= 90;
        case "80-89": return score >= 80 && score < 90;
        case "70-79": return score >= 70 && score < 80;
        case "below-70": return score < 70;
        default: return true;
      }
    })();

    return matchesSearch && matchesRole && matchesScore;
  }) || [];

  const activeFilterCount = [
    filters.roleCategory !== "all",
    filters.stage !== "all",
    filters.scoreRange !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      search: "",
      roleCategory: "all",
      stage: "all",
      scoreRange: "all",
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

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
              <div>
                <h1 className="text-2xl font-bold text-foreground">Hiring Dashboard</h1>
                <p className="text-sm text-muted-foreground">Track candidates and analyze hiring metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search candidates..." 
                  className="pl-10 w-64 bg-secondary/50"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              
              {/* Filters Popover */}
              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">Filter Candidates</h4>
                      {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                          <X className="w-3 h-3 mr-1" />
                          Clear all
                        </Button>
                      )}
                    </div>
                    
                    {/* Role Category Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Role Category</label>
                      <Select 
                        value={filters.roleCategory} 
                        onValueChange={(value) => setFilters({ ...filters, roleCategory: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="frontend">Frontend</SelectItem>
                          <SelectItem value="backend">Backend</SelectItem>
                          <SelectItem value="fullstack">Full Stack</SelectItem>
                          <SelectItem value="devops">DevOps</SelectItem>
                          <SelectItem value="data">Data Science</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          {roleCategories.map(cat => (
                            !["frontend", "backend", "fullstack", "devops", "data", "design", "product", "other"].includes(cat as string) && (
                              <SelectItem key={cat} value={cat as string}>{cat}</SelectItem>
                            )
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Stage Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Pipeline Stage</label>
                      <Select 
                        value={filters.stage} 
                        onValueChange={(value) => setFilters({ ...filters, stage: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All stages" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Stages</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="screening">Screening</SelectItem>
                          <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                          <SelectItem value="interviewed">Interviewed</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Score Range Filter */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">AI Score Range</label>
                      <Select 
                        value={filters.scoreRange} 
                        onValueChange={(value) => setFilters({ ...filters, scoreRange: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All scores" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Scores</SelectItem>
                          <SelectItem value="90-100">Excellent (90-100)</SelectItem>
                          <SelectItem value="80-89">Good (80-89)</SelectItem>
                          <SelectItem value="70-79">Average (70-79)</SelectItem>
                          <SelectItem value="below-70">Below Average (&lt;70)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Link to="/interviews">
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Interviews
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Metric Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Candidates"
              value={metrics.totalCandidates}
              change={+12.5}
              icon={Users}
              color="primary"
            />
            <MetricCard
              title="Resumes Screened"
              value={metrics.resumesScreened}
              change={+8.3}
              icon={FileText}
              color="success"
            />
            <MetricCard
              title="Interview Rate"
              value={`${metrics.interviewRate}%`}
              change={+5.2}
              icon={TrendingUp}
              color="warning"
            />
            <MetricCard
              title="Interviews Scheduled"
              value={interviewsData?.filter(i => i.status === "scheduled").length || 0}
              change={-15.0}
              icon={Clock}
              color="info"
            />
          </motion.div>

          {/* Pipeline Visualization */}
          <motion.div variants={itemVariants}>
            <PipelineVisualization />
          </motion.div>

          {/* Charts Section */}
          <motion.div variants={itemVariants}>
            <AnalyticsCharts />
          </motion.div>

          {/* Bottom Grid: Candidates Table & Recent Activity */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <CandidateTable 
                filters={filters} 
                resumes={filteredResumes}
              />
            </div>
            <div>
              <RecentActivity />
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
