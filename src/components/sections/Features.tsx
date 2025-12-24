import { motion } from "framer-motion";
import { 
  Brain, 
  FileSearch, 
  Users, 
  BarChart3, 
  Shield, 
  Zap,
  MessageSquare,
  Clock
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "NLP-Powered Screening",
    description: "Advanced natural language processing analyzes resumes with 98.5% accuracy, understanding context, skills, and experience levels.",
    color: "primary",
  },
  {
    icon: FileSearch,
    title: "Smart Resume Parsing",
    description: "Automatically extract and structure data from any resume format — PDF, Word, or image. No manual data entry needed.",
    color: "accent",
  },
  {
    icon: Users,
    title: "Candidate Matching",
    description: "AI-driven matching algorithm ranks candidates based on job requirements, culture fit, and growth potential.",
    color: "success",
  },
  {
    icon: MessageSquare,
    title: "AI Interview Assistant",
    description: "Generate tailored interview questions, evaluate responses, and get AI-powered insights on candidate fit.",
    color: "primary",
  },
  {
    icon: BarChart3,
    title: "Hiring Analytics",
    description: "Track time-to-hire, source effectiveness, and diversity metrics with real-time dashboards and reports.",
    color: "accent",
  },
  {
    icon: Clock,
    title: "Workflow Automation",
    description: "Automate scheduling, follow-ups, and status updates. Reduce administrative tasks by 80%.",
    color: "success",
  },
  {
    icon: Shield,
    title: "Bias Detection",
    description: "Built-in bias detection ensures fair and compliant hiring practices with anonymized screening options.",
    color: "primary",
  },
  {
    icon: Zap,
    title: "Instant Integration",
    description: "Connect with your existing ATS, HRIS, and job boards. Seamless API integration in minutes.",
    color: "accent",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Features
          </span>
          <h2 className="text-heading md:text-display-sm text-foreground mt-4 mb-6">
            AI-powered tools for modern HR teams
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to streamline your hiring process and find the best candidates faster than ever.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                  feature.color === "primary"
                    ? "bg-primary/10"
                    : feature.color === "accent"
                    ? "bg-accent/10"
                    : "bg-success/10"
                }`}
              >
                <feature.icon
                  className={`w-6 h-6 ${
                    feature.color === "primary"
                      ? "text-primary"
                      : feature.color === "accent"
                      ? "text-accent"
                      : "text-success"
                  }`}
                />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
