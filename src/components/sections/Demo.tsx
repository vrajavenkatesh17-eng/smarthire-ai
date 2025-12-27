import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { streamChat } from "@/lib/streamChat";
interface Message {
  role: "user" | "assistant";
  content: string;
}
const suggestedPrompts = ["Analyze this candidate's skills for a software engineer role", "What questions should I ask for a product manager interview?", "Compare these two candidates for a data analyst position", "How can I improve my job description for better candidates?"];
const messageVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};
const Demo = () => {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI HR assistant powered by advanced NLP. I can help you with resume screening, candidate evaluation, interview questions, and hiring insights. Try asking me something!"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    const userMsg: Message = {
      role: "user",
      content: userMessage
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    let assistantContent = "";
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2].content === userMessage) {
          return prev.map((m, i) => i === prev.length - 1 ? {
            ...m,
            content: assistantContent
          } : m);
        }
        return [...prev, {
          role: "assistant",
          content: assistantContent
        }];
      });
    };
    await streamChat({
      messages: [...messages, userMsg],
      onDelta: updateAssistant,
      onDone: () => setIsLoading(false),
      onError: error => {
        setIsLoading(false);
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
      }
    });
  };
  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };
  return <section id="demo" className="py-24 bg-gradient-subtle overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.5
      }} className="text-center max-w-3xl mx-auto mb-12">
          <motion.span initial={{
          opacity: 0,
          scale: 0.8
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.4
        }} className="inline-block text-sm font-medium text-primary uppercase tracking-wider px-4 py-1 rounded-full bg-primary/10">
            Live Demo
          </motion.span>
          <motion.h2 initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5,
          delay: 0.1
        }} className="text-heading md:text-display-sm text-foreground mt-6 mb-6">
            Try our <span className="text-gradient">AI HR Assistant</span>
          </motion.h2>
          <motion.p initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5,
          delay: 0.2
        }} className="text-lg text-muted-foreground">
            Experience the power of NLP-driven HR automation. Ask about resume screening, interview questions, or candidate evaluation.
          </motion.p>
        </motion.div>

        {/* Chat Interface */}
        <motion.div initial={{
        opacity: 0,
        y: 30,
        scale: 0.95
      }} whileInView={{
        opacity: 1,
        y: 0,
        scale: 1
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.6,
        delay: 0.2
      }} className="max-w-3xl mx-auto">
          <motion.div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden" whileHover={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
        }} transition={{
          duration: 0.3
        }}>
            {/* Chat Header */}
            <div className="bg-secondary/50 border-b border-border px-6 py-4 flex items-center gap-3">
              <motion.div animate={{
              rotate: [0, 360]
            }} transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }} className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-foreground">AI HR Assistant</h3>
                <div className="flex items-center gap-2">
                  <motion.div animate={{
                  scale: [1, 1.2, 1]
                }} transition={{
                  duration: 2,
                  repeat: Infinity
                }} className="w-2 h-2 bg-success rounded-full" />
                  <p className="text-xs text-muted-foreground">Online       </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => <motion.div key={index} variants={messageVariants} initial="hidden" animate="visible" exit="exit" layout className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && <motion.div initial={{
                  scale: 0
                }} animate={{
                  scale: 1
                }} transition={{
                  type: "spring",
                  stiffness: 500
                }} className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </motion.div>}
                    <motion.div whileHover={{
                  scale: 1.01
                }} className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </motion.div>
                    {message.role === "user" && <motion.div initial={{
                  scale: 0
                }} animate={{
                  scale: 1
                }} transition={{
                  type: "spring",
                  stiffness: 500
                }} className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </motion.div>}
                  </motion.div>)}
              </AnimatePresence>
              
              {/* Typing indicator */}
              <AnimatePresence>
                {isLoading && messages[messages.length - 1]?.role === "user" && <motion.div initial={{
                opacity: 0,
                y: 10
              }} animate={{
                opacity: 1,
                y: 0
              }} exit={{
                opacity: 0,
                y: -10
              }} className="flex gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-secondary rounded-2xl px-4 py-3 flex items-center gap-1">
                      <motion.span animate={{
                    opacity: [0.4, 1, 0.4]
                  }} transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0
                  }} className="w-2 h-2 bg-primary rounded-full" />
                      <motion.span animate={{
                    opacity: [0.4, 1, 0.4]
                  }} transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.2
                  }} className="w-2 h-2 bg-primary rounded-full" />
                      <motion.span animate={{
                    opacity: [0.4, 1, 0.4]
                  }} transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.4
                  }} className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                  </motion.div>}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts */}
            <motion.div initial={{
            opacity: 0
          }} whileInView={{
            opacity: 1
          }} viewport={{
            once: true
          }} className="px-6 py-3 border-t border-border bg-secondary/30">
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => <motion.button key={index} initial={{
                opacity: 0,
                scale: 0.9
              }} whileInView={{
                opacity: 1,
                scale: 1
              }} viewport={{
                once: true
              }} transition={{
                delay: index * 0.1
              }} whileHover={{
                scale: 1.05,
                y: -2
              }} whileTap={{
                scale: 0.95
              }} onClick={() => handleSuggestedPrompt(prompt)} className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary/40 hover:bg-secondary transition-all text-muted-foreground hover:text-foreground">
                    {prompt.length > 40 ? prompt.slice(0, 40) + "..." : prompt}
                  </motion.button>)}
              </div>
            </motion.div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <form onSubmit={e => {
              e.preventDefault();
              handleSend();
            }} className="flex gap-2">
                <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about resume screening, interviews, candidates..." className="flex-1 transition-shadow focus:shadow-lg" disabled={isLoading} />
                <motion.div whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.95
              }}>
                  <Button type="submit" disabled={isLoading || !input.trim()} className="group">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>;
};
export default Demo;