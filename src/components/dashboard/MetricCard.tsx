import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "info";
}

const colorClasses = {
  primary: "from-primary/20 to-primary/5 border-primary/20",
  success: "from-green-500/20 to-green-500/5 border-green-500/20",
  warning: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
  info: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
};

const iconColorClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-green-500/10 text-green-600",
  warning: "bg-amber-500/10 text-amber-600",
  info: "bg-blue-500/10 text-blue-600",
};

const MetricCard = ({ title, value, change, icon: Icon, color }: MetricCardProps) => {
  const isPositive = change >= 0;
  const isNegativeGood = title.includes("Time"); // Lower time is better

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative p-6 rounded-2xl border bg-gradient-to-br backdrop-blur-sm overflow-hidden group",
        colorClasses[color]
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-current rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-xl", iconColorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              (isPositive && !isNegativeGood) || (!isPositive && isNegativeGood)
                ? "bg-green-500/10 text-green-600"
                : "bg-red-500/10 text-red-600"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change)}%
          </motion.div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-foreground"
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
