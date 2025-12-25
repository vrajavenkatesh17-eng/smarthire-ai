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
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MetricCard from "@/components/dashboard/MetricCard";
import PipelineVisualization from "@/components/dashboard/PipelineVisualization";
import CandidateTable from "@/components/dashboard/CandidateTable";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import RecentActivity from "@/components/dashboard/RecentActivity";

const Dashboard = () => {
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
                />
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
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
              value={1247}
              change={+12.5}
              icon={Users}
              color="primary"
            />
            <MetricCard
              title="Resumes Screened"
              value={892}
              change={+8.3}
              icon={FileText}
              color="success"
            />
            <MetricCard
              title="Interview Rate"
              value="34%"
              change={+5.2}
              icon={TrendingUp}
              color="warning"
            />
            <MetricCard
              title="Avg. Time to Hire"
              value="12 days"
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
              <CandidateTable />
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
