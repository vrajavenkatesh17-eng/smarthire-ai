import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const trustPoints = [
  { icon: Zap, text: "14-day free trial" },
  { icon: Shield, text: "No credit card required" },
  { icon: Clock, text: "Cancel anytime" },
];

const CTA = () => {
  return (
    <section className="py-24 bg-gradient-subtle relative overflow-hidden">
      {/* Background decoration */}
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          rotate: { duration: 50, repeat: Infinity, ease: "linear" },
          scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
      />
      <motion.div
        animate={{ 
          rotate: -360,
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
      />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Icon */}
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            whileHover={{ rotate: 360, scale: 1.1 }}
            className="w-16 h-16 mx-auto mb-8 bg-gradient-hero rounded-2xl flex items-center justify-center cursor-pointer"
          >
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </motion.div>

          {/* Heading */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-heading md:text-display-sm text-foreground mb-6"
          >
            Ready to <span className="text-gradient-animated">revolutionize</span> your hiring?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Join thousands of companies using AI to find the best candidates faster. 
            Start your free trial today — no credit card required.
          </motion.p>

          {/* CTA Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto"
          >
            <motion.div whileHover={{ scale: 1.02 }} className="w-full sm:w-72">
              <Input
                type="email"
                placeholder="Enter your work email..."
                className="w-full h-12 transition-shadow focus:shadow-lg focus:shadow-primary/10"
              />
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="hero" size="lg" className="group">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust Points */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-8"
          >
            {trustPoints.map((point, index) => (
              <motion.div
                key={point.text}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                <point.icon className="w-4 h-4 text-success" />
                <span className="text-sm">{point.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
