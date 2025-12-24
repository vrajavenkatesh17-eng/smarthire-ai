import { motion } from "framer-motion";
import { Upload, Brain, Users, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Resumes",
    description: "Drag and drop resumes in any format — PDF, Word, or images. Bulk upload hundreds at once.",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI Analysis",
    description: "Our NLP engine extracts skills, experience, and qualifications. Understands context and nuance.",
  },
  {
    number: "03",
    icon: Users,
    title: "Smart Ranking",
    description: "Candidates are automatically ranked and matched to your job requirements with detailed scores.",
  },
  {
    number: "04",
    icon: CheckCircle,
    title: "Hire the Best",
    description: "Review top candidates, schedule interviews, and make data-driven hiring decisions.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24">
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
            How It Works
          </span>
          <h2 className="text-heading md:text-display-sm text-foreground mt-4 mb-6">
            From resumes to hires in 4 simple steps
          </h2>
          <p className="text-lg text-muted-foreground">
            Our streamlined process takes the complexity out of hiring, letting you focus on what matters — finding great talent.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                <div className="bg-background border border-border rounded-2xl p-6 text-center relative z-10">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-hero text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
