import { motion } from "framer-motion";
import { 
  UserPlus, 
  FileCheck, 
  Video, 
  MessageSquare, 
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "new_application",
    message: "New application from Sarah Chen",
    time: "2 minutes ago",
    icon: UserPlus,
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    id: 2,
    type: "screening_complete",
    message: "AI screening completed for Marcus Johnson",
    time: "15 minutes ago",
    icon: FileCheck,
    color: "text-green-500 bg-green-500/10",
  },
  {
    id: 3,
    type: "interview_scheduled",
    message: "Interview scheduled with David Kim",
    time: "1 hour ago",
    icon: Video,
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    id: 4,
    type: "feedback",
    message: "New feedback added for Emily Rodriguez",
    time: "2 hours ago",
    icon: MessageSquare,
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    id: 5,
    type: "hired",
    message: "Alex Turner was hired!",
    time: "3 hours ago",
    icon: CheckCircle2,
    color: "text-green-500 bg-green-500/10",
  },
  {
    id: 6,
    type: "pending",
    message: "Awaiting response from Lisa Wang",
    time: "4 hours ago",
    icon: Clock,
    color: "text-slate-500 bg-slate-500/10",
  },
  {
    id: 7,
    type: "rejected",
    message: "Application declined for John Doe",
    time: "5 hours ago",
    icon: XCircle,
    color: "text-red-500 bg-red-500/10",
  },
];

const RecentActivity = () => {
  return (
    <div className="bg-card rounded-2xl border border-border h-full">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Latest hiring updates</p>
      </div>

      <div className="p-4 space-y-1 max-h-[400px] overflow-y-auto">
        {activities.map((activity, index) => (
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
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <button className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors">
          View all activity →
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;
