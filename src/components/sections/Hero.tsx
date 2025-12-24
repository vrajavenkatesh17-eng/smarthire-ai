import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const clientLogos = [
  { name: "Google", letter: "G" },
  { name: "Microsoft", letter: "M" },
  { name: "Amazon", letter: "A" },
  { name: "Meta", letter: "F" },
  { name: "Apple", letter: "A" },
  { name: "Netflix", letter: "N" },
];

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Announcement Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              AI-Powered HR Revolution
            </span>
            <ArrowRight className="w-4 h-4 text-primary" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-display-sm md:text-display text-foreground mb-6"
          >
            Intelligent Resume
            <br />
            <span className="text-gradient">Screening & HR</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            The <strong className="text-foreground">all-in-one</strong> NLP-powered platform that automates resume screening, 
            candidate matching, and HR workflows. <span className="text-primary">From startups to enterprises.</span>
          </motion.p>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <div className="flex items-center w-full sm:w-auto">
              <Input
                type="email"
                placeholder="Enter your work email..."
                className="w-full sm:w-72 h-12 rounded-l-xl rounded-r-none border-r-0"
              />
              <Button variant="hero" size="lg" className="rounded-l-none rounded-r-xl">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 opacity-60"
          >
            {clientLogos.map((logo, index) => (
              <div
                key={logo.name}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center font-bold text-sm">
                  {logo.letter}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{logo.name}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Floating Feature Cards */}
        <div className="absolute bottom-20 left-10 hidden xl:block">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-card border border-border rounded-xl p-4 shadow-lg animate-float"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">NLP Analysis</p>
                <p className="text-xs text-muted-foreground">98.5% accuracy</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-32 right-10 hidden xl:block">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-card border border-border rounded-xl p-4 shadow-lg animate-float"
            style={{ animationDelay: "1s" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Time Saved</p>
                <p className="text-xs text-muted-foreground">75% faster hiring</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
