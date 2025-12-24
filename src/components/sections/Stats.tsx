import { motion } from "framer-motion";

const stats = [
  { value: "98.5%", label: "Screening Accuracy", description: "Powered by advanced NLP" },
  { value: "75%", label: "Time Saved", description: "Compared to manual screening" },
  { value: "10K+", label: "Companies", description: "Trust our platform" },
  { value: "5M+", label: "Resumes Processed", description: "And counting" },
];

const Stats = () => {
  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-primary-foreground/90 mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-primary-foreground/70">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
