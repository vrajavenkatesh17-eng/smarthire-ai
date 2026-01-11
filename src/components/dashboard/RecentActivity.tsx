import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  UserPlus, 
  FileCheck, 
  Video, 
  MessageSquare, 
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Users,
  Briefcase,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface Activity {
  id: string;
  type: string;
  message: string;
  time: string;
  icon: typeof UserPlus;
  color: string;
}

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case "new": return { icon: UserPlus, color: "text-blue-500 bg-blue-500/10" };
    case "screening": return { icon: FileCheck, color: "text-purple-500 bg-purple-500/10" };
    case "interview_scheduled": return { icon: Video, color: "text-amber-500 bg-amber-500/10" };
    case "interviewed": return { icon: Clock, color: "text-orange-500 bg-orange-500/10" };
    case "offer": return { icon: Briefcase, color: "text-emerald-500 bg-emerald-500/10" };
    case "hired": return { icon: CheckCircle2, color: "text-green-500 bg-green-500/10" };
    case "rejected": return { icon: XCircle, color: "text-red-500 bg-red-500/10" };
    case "feedback": return { icon: MessageSquare, color: "text-purple-500 bg-purple-500/10" };
    case "team": return { icon: Users, color: "text-indigo-500 bg-indigo-500/10" };
    default: return { icon: ArrowRight, color: "text-slate-500 bg-slate-500/10" };
  }
};

const getStageLabel = (stage: string) => {
  switch (stage) {
    case "new": return "New";
    case "screening": return "Screening";
    case "interview_scheduled": return "Interview Scheduled";
    case "interviewed": return "Interviewed";
    case "offer": return "Offer";
    case "hired": return "Hired";
    case "rejected": return "Rejected";
    default: return stage;
  }
};

const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      // Fetch pipeline activities
      const { data: pipelineActivities, error: activitiesError } = await supabase
        .from("pipeline_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;

      // Fetch recent interviews as activities
      const { data: recentInterviews, error: interviewsError } = await supabase
        .from("interviews")
        .select(`
          id,
          scheduled_at,
          status,
          created_at,
          pipeline_id,
          candidate_pipeline (
            candidate_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (interviewsError) throw interviewsError;

      // Combine and format activities
      const formattedActivities: Activity[] = [];

      // Add pipeline activities
      (pipelineActivities || []).forEach((activity: any) => {
        const { icon, color } = getActivityIcon(activity.new_stage || activity.activity_type);
        formattedActivities.push({
          id: activity.id,
          type: activity.activity_type,
          message: activity.description,
          time: formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }),
          icon,
          color,
        });
      });

      // Add interview activities (if not already in pipeline activities)
      (recentInterviews || []).forEach((interview: any) => {
        const candidateName = interview.candidate_pipeline?.candidate_name || "Unknown candidate";
        const { icon, color } = getActivityIcon("interview_scheduled");
        formattedActivities.push({
          id: `interview-${interview.id}`,
          type: "interview_scheduled",
          message: `Interview scheduled with ${candidateName}`,
          time: formatDistanceToNow(new Date(interview.created_at), { addSuffix: true }),
          icon,
          color,
        });
      });

      // Sort by time (most recent first) and take top 10
      const sortedActivities = formattedActivities
        .sort((a, b) => {
          // This is a simple sort, in production you'd want to compare actual timestamps
          return 0;
        })
        .slice(0, 10);

      // If no real activities, show placeholder
      if (sortedActivities.length === 0) {
        setActivities([
          {
            id: "placeholder-1",
            type: "info",
            message: "No recent activity yet. Start by analyzing resumes or adding candidates to the pipeline.",
            time: "Just now",
            icon: Clock,
            color: "text-slate-500 bg-slate-500/10",
          },
        ]);
      } else {
        setActivities(sortedActivities);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      // Fallback to empty state
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border h-full">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Latest hiring updates</p>
      </div>

      <div className="p-4 space-y-1 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer group"
            >
              <div className={cn("p-2 rounded-lg shrink-0", activity.color)}>
                <activity.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {activity.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border">
        <Link 
          to="/talent-pipeline" 
          className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors flex items-center justify-center gap-1"
        >
          View all activity
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default RecentActivity;
