import { useState } from "react";
import { motion } from "framer-motion";
import { Github, Linkedin, Mail, Sparkles, Code, Palette, Database, Send, Heart, Rocket, Users, MessageSquare, Star, Zap, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const creators = [
  {
    name: "Krishna Raja V",
    role: "Full Stack Developer",
    bio: "Passionate about building AI-powered solutions that transform HR workflows and make hiring smarter.",
    avatar: "KR",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    icon: Code,
    color: "from-violet-500 to-purple-600",
    skills: ["React", "TypeScript", "AI/ML", "Supabase"],
    email: "raja@resumeai.com",
    linkedin: "#",
    github: "#",
  },
  {
    name: "Alex Chen",
    role: "UI/UX Designer",
    bio: "Creating intuitive and beautiful user experiences that make complex HR tasks feel effortless.",
    avatar: "AC",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
    icon: Palette,
    color: "from-pink-500 to-rose-600",
    skills: ["Figma", "UI Design", "User Research", "Prototyping"],
    email: "alex@resumeai.com",
    linkedin: "#",
    github: "#",
  },
  {
    name: "Sam Wilson",
    role: "Backend Engineer",
    bio: "Building robust and scalable infrastructure to power intelligent resume analysis at scale.",
    avatar: "SW",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    icon: Database,
    color: "from-blue-500 to-cyan-600",
    skills: ["Node.js", "PostgreSQL", "APIs", "Cloud"],
    email: "sam@resumeai.com",
    linkedin: "#",
    github: "#",
  },
  {
    name: "Priya Sharma",
    role: "AI/ML Engineer",
    bio: "Developing intelligent algorithms that power our resume matching and candidate scoring systems.",
    avatar: "PS",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-600",
    skills: ["Python", "TensorFlow", "NLP", "Machine Learning"],
    email: "priya@resumeai.com",
    linkedin: "#",
    github: "#",
  },
  {
    name: "David Park",
    role: "Product Manager",
    bio: "Bridging the gap between user needs and technology to deliver impactful HR solutions.",
    avatar: "DP",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
    icon: Rocket,
    color: "from-orange-500 to-amber-600",
    skills: ["Strategy", "Agile", "User Research", "Analytics"],
    email: "david@resumeai.com",
    linkedin: "#",
    github: "#",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "HR Director",
    company: "TechCorp Inc.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    quote: "ResumeAI has completely transformed our hiring process. We've reduced time-to-hire by 60% and found better quality candidates.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Talent Acquisition Manager",
    company: "StartupXYZ",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    quote: "The AI-powered matching is incredibly accurate. It's like having a senior recruiter available 24/7.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "CEO",
    company: "GrowthLabs",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face",
    quote: "We scaled from 20 to 200 employees while keeping our HR team the same size. ResumeAI made it possible.",
    rating: 5,
  },
];

const FloatingShape = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
      scale: [1, 1.05, 1],
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      delay,
      ease: "easeInOut",
    }}
  />
);

const Creators = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim() || undefined,
          message: formData.message.trim(),
        },
      });

      if (error) throw error;
      
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Error sending contact form:", error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <FloatingShape 
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl"
          delay={0}
        />
        <FloatingShape 
          className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-3xl"
          delay={2}
        />
        <FloatingShape 
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl"
          delay={4}
        />
        
        {/* Floating Icons */}
        <motion.div
          className="absolute top-32 right-[15%] text-primary/20"
          animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <Star className="w-8 h-8" />
        </motion.div>
        <motion.div
          className="absolute top-[60%] left-[10%] text-accent/20"
          animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        >
          <Zap className="w-10 h-10" />
        </motion.div>
        <motion.div
          className="absolute top-[40%] right-[8%] text-primary/15"
          animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, delay: 2 }}
        >
          <Heart className="w-6 h-6" />
        </motion.div>
      </div>

      <main className="relative pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-6 text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary/15 to-accent/15 rounded-full text-primary text-sm font-semibold mb-8 border border-primary/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Sparkles className="w-4 h-4" />
              Meet the Innovators
              <Sparkles className="w-4 h-4" />
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              The Creative Minds
              <br />
              <span className="text-gradient-animated">
                Behind ResumeAI
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We're a passionate team of innovators, designers, and engineers dedicated to 
              revolutionizing HR processes with cutting-edge AI technology. Our mission: make hiring 
              <span className="text-primary font-medium"> smarter</span>, 
              <span className="text-accent font-medium"> faster</span>, and 
              <span className="text-primary font-medium"> fairer</span>.
            </p>
          </motion.div>

          {/* Stats Row */}
          <motion.div 
            className="flex flex-wrap justify-center gap-8 mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {[
              { icon: Users, label: "Team Members", value: "5" },
              { icon: Rocket, label: "Projects Shipped", value: "50+" },
              { icon: Heart, label: "Happy Clients", value: "200+" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex items-center gap-3 px-6 py-3 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50"
                whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary) / 0.3)" }}
              >
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Creators Grid */}
        <section className="container mx-auto px-6 mb-24">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {creators.map((creator, index) => (
              <motion.div
                key={creator.name}
                initial={{ opacity: 0, y: 40, rotateX: -10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: index * 0.15 + 0.3, duration: 0.6 }}
                whileHover={{ y: -8 }}
              >
                <Card className="h-full overflow-hidden group hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/40 bg-card/80 backdrop-blur-sm relative">
                  {/* Gradient Overlay on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${creator.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  <CardContent className="p-8 relative">
                    {/* Avatar & Icon */}
                    <div className="flex items-start justify-between mb-6">
                      <motion.div 
                        className={`w-20 h-20 rounded-3xl overflow-hidden shadow-xl relative ring-4 ring-background`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <img 
                          src={creator.image} 
                          alt={creator.name}
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-background flex items-center justify-center`}>
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                        </div>
                      </motion.div>
                      <motion.div 
                        className={`p-3 rounded-2xl bg-gradient-to-br ${creator.color} bg-opacity-10 shadow-sm`}
                        whileHover={{ rotate: 15 }}
                      >
                        <creator.icon className="w-6 h-6 text-primary" />
                      </motion.div>
                    </div>

                    {/* Name & Role */}
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {creator.name}
                    </h3>
                    <p className={`text-sm font-semibold bg-gradient-to-r ${creator.color} bg-clip-text text-transparent mb-4`}>
                      {creator.role}
                    </p>

                    {/* Bio */}
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {creator.bio}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {creator.skills.map((skill) => (
                        <motion.span
                          key={skill}
                          className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-full font-medium border border-border/50"
                          whileHover={{ scale: 1.1, backgroundColor: "hsl(var(--primary) / 0.1)" }}
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-2 pt-4 border-t border-border/50">
                      {[
                        { icon: Mail, href: `mailto:${creator.email}`, label: "Email" },
                        { icon: Linkedin, href: creator.linkedin, label: "LinkedIn" },
                        { icon: Github, href: creator.github, label: "GitHub" },
                      ].map((social) => (
                        <motion.div key={social.label} whileHover={{ scale: 1.15, y: -2 }}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10" asChild>
                            <a href={social.href} aria-label={social.label} target={social.label !== "Email" ? "_blank" : undefined} rel="noopener noreferrer">
                              <social.icon className="w-5 h-5" />
                            </a>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-6 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="text-center mb-12">
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent text-sm font-medium mb-4"
                whileHover={{ scale: 1.05 }}
              >
                <Heart className="w-4 h-4" />
                What Drives Us
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">Our Core Values</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { 
                  title: "Innovation", 
                  desc: "Pushing boundaries with AI to solve real HR challenges and create breakthrough solutions",
                  icon: Rocket,
                  gradient: "from-violet-500 to-purple-600"
                },
                { 
                  title: "Fairness", 
                  desc: "Building tools that promote unbiased hiring decisions and equal opportunities for all",
                  icon: Heart,
                  gradient: "from-pink-500 to-rose-600"
                },
                { 
                  title: "Simplicity", 
                  desc: "Making complex workflows intuitive, accessible, and delightful to use every day",
                  icon: Zap,
                  gradient: "from-blue-500 to-cyan-600"
                },
              ].map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="p-8 rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl relative overflow-hidden group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto px-6 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-12">
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4"
                whileHover={{ scale: 1.05 }}
              >
                <Quote className="w-4 h-4" />
                Client Testimonials
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">What Our Clients Say</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover how ResumeAI has helped companies transform their hiring process
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl relative overflow-hidden group">
                    <div className="absolute top-4 right-4 text-primary/10 group-hover:text-primary/20 transition-colors">
                      <Quote className="w-16 h-16" />
                    </div>
                    
                    <CardContent className="p-8 relative">
                      {/* Stars */}
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, idx) => (
                          <Star key={idx} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      
                      {/* Quote */}
                      <p className="text-foreground/90 leading-relaxed mb-6 italic">
                        "{testimonial.quote}"
                      </p>
                      
                      {/* Author */}
                      <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                        />
                        <div>
                          <p className="font-semibold text-foreground">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                          <p className="text-xs text-primary font-medium">{testimonial.company}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Contact Form Section */}
        <section className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl">
              <div className="grid lg:grid-cols-2">
                {/* Left Side - Info */}
                <div className="p-8 lg:p-12 bg-gradient-to-br from-primary to-accent text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                  
                  <div className="relative">
                    <motion.div 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6 backdrop-blur-sm"
                      whileHover={{ scale: 1.05 }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Get in Touch
                    </motion.div>
                    
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                      Let's Build Something Amazing Together
                    </h2>
                    <p className="text-white/80 mb-8 leading-relaxed">
                      Have a question, feedback, or just want to say hello? We'd love to hear from you. 
                      Our team typically responds within 24 hours.
                    </p>

                    <div className="space-y-4">
                      {[
                        { icon: Mail, text: "hello@resumeai.com" },
                        { icon: Users, text: "Join our growing community" },
                        { icon: Rocket, text: "Partnership opportunities welcome" },
                      ].map((item, i) => (
                        <motion.div 
                          key={i}
                          className="flex items-center gap-3 text-white/90"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span>{item.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <motion.div
                    className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute -top-5 -right-5 w-20 h-20 bg-white/10 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  />
                </div>

                {/* Right Side - Form */}
                <div className="p-8 lg:p-12">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground font-medium">
                          Your Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="h-12 rounded-xl border-border/50 focus:border-primary bg-background"
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground font-medium">
                          Email Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="h-12 rounded-xl border-border/50 focus:border-primary bg-background"
                          maxLength={255}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-foreground font-medium">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        placeholder="How can we help you?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="h-12 rounded-xl border-border/50 focus:border-primary bg-background"
                        maxLength={200}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-foreground font-medium">
                        Message <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us about your project, question, or feedback..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="min-h-[140px] rounded-xl border-border/50 focus:border-primary bg-background resize-none"
                        maxLength={1000}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {formData.message.length}/1000
                      </p>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold text-lg shadow-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <motion.div
                            className="flex items-center gap-2"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </motion.div>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="w-5 h-5" />
                            Send Message
                          </span>
                        )}
                      </Button>
                    </motion.div>

                    <p className="text-xs text-muted-foreground text-center">
                      By submitting this form, you agree to our privacy policy. We'll never share your information.
                    </p>
                  </form>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Creators;
