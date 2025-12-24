import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CTA = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-8 bg-gradient-hero rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>

          {/* Heading */}
          <h2 className="text-heading md:text-display-sm text-foreground mb-6">
            Ready to revolutionize your hiring?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of companies using AI to find the best candidates faster. 
            Start your free trial today — no credit card required.
          </p>

          {/* CTA Form */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <Input
              type="email"
              placeholder="Enter your work email..."
              className="w-full sm:w-72 h-12"
            />
            <Button variant="hero" size="lg">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Trust Text */}
          <p className="text-sm text-muted-foreground mt-6">
            ✓ 14-day free trial &nbsp; ✓ No credit card required &nbsp; ✓ Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
