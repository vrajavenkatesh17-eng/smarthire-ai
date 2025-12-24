import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small teams getting started",
    features: [
      "Up to 100 resumes/month",
      "Basic NLP screening",
      "Email support",
      "1 job posting",
      "Basic analytics",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "For growing teams with serious hiring needs",
    features: [
      "Up to 1,000 resumes/month",
      "Advanced NLP + AI matching",
      "Priority support",
      "Unlimited job postings",
      "Full analytics dashboard",
      "AI interview assistant",
      "Custom workflows",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with advanced needs",
    features: [
      "Unlimited resumes",
      "Custom AI models",
      "Dedicated success manager",
      "SLA guarantee",
      "API access",
      "Custom integrations",
      "On-premise option",
      "Advanced security",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 overflow-hidden">
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
            Pricing
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-heading md:text-display-sm text-foreground mt-6 mb-6"
          >
            Simple, <span className="text-gradient">transparent</span> pricing
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            Choose the plan that fits your hiring needs. All plans include a 14-day free trial.
          </motion.p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ 
                y: -10, 
                transition: { duration: 0.2 } 
              }}
              className={`relative bg-card border rounded-2xl p-8 cursor-pointer transition-all duration-300 ${
                plan.popular
                  ? "border-primary shadow-xl shadow-primary/10 md:scale-105"
                  : "border-border hover:border-primary/30 hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-hero text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </motion.div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {plan.name}
                </h3>
                <motion.div 
                  className="flex items-baseline justify-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </motion.div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <motion.li 
                    key={feature} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + featureIndex * 0.05 }}
                    className="flex items-center gap-3 group"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.3 }}
                      className="w-5 h-5 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-success/20 transition-colors"
                    >
                      <Check className="w-3 h-3 text-success" />
                    </motion.div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full group"
                size="lg"
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
