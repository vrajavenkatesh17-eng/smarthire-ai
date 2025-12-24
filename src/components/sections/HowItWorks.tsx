import { motion } from "framer-motion";
import { Upload, Brain, Users, CheckCircle, ArrowRight } from "lucide-react";

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
    <section id="how-it-works" className="py-24 overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-block text-sm font-medium text-primary uppercase tracking-wider px-4 py-1 rounded-full bg-primary/10"
          >
            How It Works
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-heading md:text-display-sm text-foreground mt-6 mb-6"
          >
            From resumes to hires in{" "}
            <span className="text-gradient">4 simple steps</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            Our streamlined process takes the complexity out of hiring, letting you focus on what matters — finding great talent.
          </motion.p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Animated Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-hero origin-left"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                <motion.div 
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="bg-background border border-border rounded-2xl p-6 text-center relative z-10 hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer group"
                >
                  {/* Step Number */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.15 + 0.3, type: "spring" }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-hero text-primary-foreground text-sm font-bold px-3 py-1 rounded-full"
                  >
                    {step.number}
                  </motion.div>

                  {/* Icon */}
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                  >
                    <step.icon className="w-8 h-8 text-primary" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </motion.div>

                {/* Arrow connector for mobile/tablet */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.5 }}
                    className="hidden md:flex lg:hidden absolute -right-4 top-1/2 -translate-y-1/2 z-20"
                  >
                    <ArrowRight className="w-8 h-8 text-primary" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
