import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Brain, Zap, ChevronDown } from "lucide-react";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
        />
        {/* Floating particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Announcement Badge */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 mb-8 cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-primary group-hover:animate-spin-slow" />
            <span className="text-sm font-medium text-muted-foreground">
              AI-Powered HR Revolution
            </span>
            <ArrowRight className="w-4 h-4 text-primary transition-transform group-hover:translate-x-1" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-display-sm md:text-display text-foreground mb-6"
          >
            Intelligent Resume
            <br />
            <span className="text-gradient-animated">Screening & HR</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            The <strong className="text-foreground">all-in-one</strong> NLP-powered platform that automates resume screening, 
            candidate matching, and HR workflows. <span className="text-primary">From startups to enterprises.</span>
          </motion.p>

          {/* CTA Section */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.div 
              className="flex items-center w-full sm:w-auto"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Input
                type="email"
                placeholder="Enter your work email..."
                className="w-full sm:w-72 h-12 rounded-l-xl rounded-r-none border-r-0 transition-shadow focus:shadow-lg"
              />
              <Button variant="hero" size="lg" className="rounded-l-none rounded-r-xl group">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust Badges with stagger animation */}
          <motion.div
            variants={containerVariants}
            className="flex flex-wrap items-center justify-center gap-8"
          >
            {clientLogos.map((logo, index) => (
              <motion.div
                key={logo.name}
                variants={itemVariants}
                whileHover={{ scale: 1.1, y: -2 }}
                className="flex items-center gap-2 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center font-bold text-sm">
                  {logo.letter}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{logo.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating Feature Cards */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="absolute bottom-20 left-10 hidden xl:block"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="bg-card border border-border rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Brain className="w-5 h-5 text-primary" />
              </motion.div>
              <div>
                <p className="text-sm font-medium text-foreground">NLP Analysis</p>
                <p className="text-xs text-muted-foreground">98.5% accuracy</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="absolute bottom-32 right-10 hidden xl:block"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            whileHover={{ scale: 1.05, rotate: -2 }}
            className="bg-card border border-border rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="w-5 h-5 text-success" />
              </motion.div>
              <div>
                <p className="text-sm font-medium text-foreground">Time Saved</p>
                <p className="text-xs text-muted-foreground">75% faster hiring</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
          >
            <span className="text-xs font-medium">Scroll to explore</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
