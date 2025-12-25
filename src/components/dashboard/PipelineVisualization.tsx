import { motion } from "framer-motion";
import { 
  FileText, 
  Search, 
  Video, 
  ClipboardCheck, 
  Award,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const pipelineStages = [
  { 
    name: "Applied", 
    count: 486, 
    icon: FileText, 
    color: "bg-slate-500",
    bgColor: "bg-slate-500/10",
    percentage: 100 
  },
  { 
    name: "Screening", 
    count: 324, 
    icon: Search, 
    color: "bg-blue-500",
    bgColor: "bg-blue-500/10",
    percentage: 67 
  },
  { 
    name: "Interview", 
    count: 156, 
    icon: Video, 
    color: "bg-amber-500",
    bgColor: "bg-amber-500/10",
    percentage: 32 
  },
  { 
    name: "Assessment", 
    count: 89, 
    icon: ClipboardCheck, 
    color: "bg-purple-500",
    bgColor: "bg-purple-500/10",
    percentage: 18 
  },
  { 
    name: "Hired", 
    count: 42, 
    icon: Award, 
    color: "bg-green-500",
    bgColor: "bg-green-500/10",
    percentage: 9 
  },
];

const PipelineVisualization = () => {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Hiring Pipeline</h2>
          <p className="text-sm text-muted-foreground">Current candidate distribution</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>42 hires this month</span>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="relative">
        {/* Connection Lines */}
        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
          {pipelineStages.map((stage, index) => (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <div className={cn(
                "p-4 rounded-xl border border-border bg-background hover:shadow-lg transition-shadow",
                "flex flex-col items-center text-center"
              )}>
                {/* Icon */}
                <motion.div 
                  className={cn("p-3 rounded-xl mb-3", stage.bgColor)}
                  whileHover={{ rotate: 10 }}
                >
                  <stage.icon className={cn("w-5 h-5", stage.color.replace("bg-", "text-"))} />
                </motion.div>

                {/* Count */}
                <motion.span 
                  className="text-2xl font-bold text-foreground mb-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                >
                  {stage.count}
                </motion.span>

                {/* Stage Name */}
                <span className="text-sm text-muted-foreground">{stage.name}</span>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-secondary rounded-full mt-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.percentage}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    className={cn("h-full rounded-full", stage.color)}
                  />
                </div>

                {/* Percentage */}
                <span className="text-xs text-muted-foreground mt-1">{stage.percentage}%</span>
              </div>

              {/* Arrow between stages */}
              {index < pipelineStages.length - 1 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
        {[
          { label: "Applied → Screening", rate: "67%" },
          { label: "Screening → Interview", rate: "48%" },
          { label: "Interview → Assessment", rate: "57%" },
          { label: "Assessment → Hired", rate: "47%" },
        ].map((conversion, index) => (
          <motion.div
            key={conversion.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="text-center"
          >
            <p className="text-xs text-muted-foreground mb-1">{conversion.label}</p>
            <p className="text-lg font-semibold text-foreground">{conversion.rate}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PipelineVisualization;
