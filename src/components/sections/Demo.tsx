import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestedPrompts = [
  "Analyze this candidate's skills for a software engineer role",
  "What questions should I ask for a product manager interview?",
  "Compare these two candidates for a data analyst position",
  "How can I improve my job description for better candidates?",
];

const Demo = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI HR assistant. I can help you with resume screening, candidate evaluation, interview questions, and hiring insights. Try asking me something!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // For now, we'll show a demo response since backend isn't set up yet
      // Once Cloud is enabled, this will use the actual AI API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const demoResponse = generateDemoResponse(userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: demoResponse },
      ]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateDemoResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("interview") && lowerQuery.includes("question")) {
      return `Here are tailored interview questions based on your query:

**Technical Assessment:**
1. "Can you walk me through a challenging project you've worked on and the technical decisions you made?"
2. "How do you approach debugging a complex issue in production?"

**Behavioral Questions:**
3. "Tell me about a time you had to collaborate with a difficult team member."
4. "How do you prioritize when you have multiple urgent deadlines?"

**Culture Fit:**
5. "What kind of work environment helps you do your best work?"

Would you like me to generate more specific questions for a particular role?`;
    }
    
    if (lowerQuery.includes("candidate") || lowerQuery.includes("resume")) {
      return `I can help analyze candidates! Here's what I typically evaluate:

📊 **Skills Match Score:** How well skills align with requirements
👤 **Experience Level:** Relevance and depth of experience  
🎓 **Education & Certifications:** Relevant qualifications
💡 **Growth Potential:** Career trajectory indicators
🤝 **Culture Fit Signals:** Team collaboration indicators

To analyze a specific candidate, you can:
1. Paste the resume text
2. Upload a resume file (via the Upload feature)
3. Describe the candidate's background

What would you like me to help with?`;
    }
    
    if (lowerQuery.includes("job description") || lowerQuery.includes("improve")) {
      return `Great question! Here are key elements for an effective job description:

✅ **Clear Title:** Use standard, searchable job titles
✅ **Compelling Summary:** 2-3 sentences on impact and opportunity
✅ **Specific Requirements:** Separate "must-haves" from "nice-to-haves"
✅ **Growth Opportunities:** Career path and learning possibilities
✅ **Culture Highlights:** What makes your team unique
✅ **Inclusive Language:** Avoid gendered or exclusionary terms

Would you like me to review a specific job description?`;
    }
    
    return `Thanks for your question! As an AI HR assistant, I can help with:

🔍 **Resume Screening** — Analyze and rank candidates
📝 **Interview Prep** — Generate tailored questions
📊 **Candidate Comparison** — Side-by-side evaluations
✍️ **Job Descriptions** — Optimize for better applicants
📈 **Hiring Insights** — Data-driven recommendations

What specific HR task would you like help with today?`;
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <section id="demo" className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Live Demo
          </span>
          <h2 className="text-heading md:text-display-sm text-foreground mt-4 mb-6">
            Try our AI HR Assistant
          </h2>
          <p className="text-lg text-muted-foreground">
            Experience the power of NLP-driven HR automation. Ask about resume screening, interview questions, or candidate evaluation.
          </p>
        </motion.div>

        {/* Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            {/* Chat Header */}
            <div className="bg-secondary/50 border-b border-border px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI HR Assistant</h3>
                <p className="text-xs text-muted-foreground">Powered by NLP</p>
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts */}
            <div className="px-6 py-3 border-t border-border bg-secondary/30">
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary/20 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {prompt.length > 40 ? prompt.slice(0, 40) + "..." : prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about resume screening, interviews, candidates..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Demo;
