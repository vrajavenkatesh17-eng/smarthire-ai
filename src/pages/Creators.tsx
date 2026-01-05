import { motion } from "framer-motion";
import { Github, Linkedin, Mail, Sparkles, Code, Palette, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const creators = [
  {
    name: "Krishna Raja V",
    role: "Full Stack Developer",
    bio: "Passionate about building AI-powered solutions that transform HR workflows and make hiring smarter.",
    avatar: "KR",
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
    icon: Database,
    color: "from-blue-500 to-cyan-600",
    skills: ["Node.js", "PostgreSQL", "APIs", "Cloud"],
    email: "sam@resumeai.com",
    linkedin: "#",
    github: "#",
  },
];

const Creators = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-6 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Meet the Team
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              The Minds Behind{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                ResumeAI
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're a passionate team dedicated to revolutionizing HR processes with 
              cutting-edge AI technology. Our mission is to make hiring smarter, faster, and fairer.
            </p>
          </motion.div>
        </section>

        {/* Creators Grid */}
        <section className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {creators.map((creator, index) => (
              <motion.div
                key={creator.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
              >
                <Card className="h-full overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30">
                  <CardContent className="p-6">
                    {/* Avatar & Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${creator.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                        {creator.avatar}
                      </div>
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${creator.color} bg-opacity-10`}>
                        <creator.icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>

                    {/* Name & Role */}
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {creator.name}
                    </h3>
                    <p className={`text-sm font-medium bg-gradient-to-r ${creator.color} bg-clip-text text-transparent mb-3`}>
                      {creator.role}
                    </p>

                    {/* Bio */}
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {creator.bio}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {creator.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                        <a href={`mailto:${creator.email}`} aria-label="Email">
                          <Mail className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                        <a href={creator.linkedin} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                        <a href={creator.github} aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-6 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold text-foreground mb-8">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Innovation", desc: "Pushing boundaries with AI to solve real HR challenges" },
                { title: "Fairness", desc: "Building tools that promote unbiased hiring decisions" },
                { title: "Simplicity", desc: "Making complex workflows intuitive and accessible" },
              ].map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-xl bg-secondary/50 border border-border/50"
                >
                  <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Creators;
