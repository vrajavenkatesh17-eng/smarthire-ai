import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
  { value: 98.5, suffix: "%", label: "Screening Accuracy", description: "Powered by advanced NLP" },
  { value: 75, suffix: "%", label: "Time Saved", description: "Compared to manual screening" },
  { value: 10, suffix: "K+", label: "Companies", description: "Trust our platform" },
  { value: 5, suffix: "M+", label: "Resumes Processed", description: "And counting" },
];

const AnimatedCounter = ({ value, suffix, delay = 0 }: { value: number; suffix: string; delay?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;
      
      const timer = setTimeout(() => {
        const interval = setInterval(() => {
          current += stepValue;
          if (current >= value) {
            setCount(value);
            clearInterval(interval);
          } else {
            setCount(current);
          }
        }, duration / steps);
        
        return () => clearInterval(interval);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [isInView, value, delay]);

  return (
    <span ref={ref}>
      {count % 1 === 0 ? Math.floor(count) : count.toFixed(1)}
      {suffix}
    </span>
  );
};

const Stats = () => {
  return (
    <section className="py-20 bg-gradient-hero relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute -top-1/2 -left-1/4 w-full h-full opacity-10"
      >
        <div className="w-96 h-96 border border-primary-foreground/20 rounded-full" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-1/2 -right-1/4 w-full h-full opacity-10"
      >
        <div className="w-80 h-80 border border-primary-foreground/20 rounded-full" />
      </motion.div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center cursor-pointer"
            >
              <motion.div 
                className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} delay={index * 200} />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="text-lg font-semibold text-primary-foreground/90 mb-1"
              >
                {stat.label}
              </motion.div>
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.4 }}
                className="text-sm text-primary-foreground/70"
              >
                {stat.description}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
