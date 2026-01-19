import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  FileText,
  Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: "general" | "follow-up" | "rejection" | "welcome";
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: "1",
    name: "Thank You Response",
    subject: "Thank you for reaching out",
    body: `Dear {{name}},

Thank you for contacting us. We have received your inquiry and appreciate you taking the time to reach out.

Our team will review your message and get back to you within 24-48 hours.

Best regards,
The ResumeAI Team`,
    category: "general"
  },
  {
    id: "2",
    name: "Follow Up",
    subject: "Following up on your inquiry",
    body: `Dear {{name}},

We wanted to follow up on your recent inquiry to ensure all your questions have been addressed.

Is there anything else we can help you with?

Best regards,
The ResumeAI Team`,
    category: "follow-up"
  },
  {
    id: "3",
    name: "Welcome Message",
    subject: "Welcome to ResumeAI!",
    body: `Dear {{name}},

Welcome to ResumeAI! We're excited to have you on board.

If you have any questions about getting started, don't hesitate to reach out.

Best regards,
The ResumeAI Team`,
    category: "welcome"
  }
];

interface Props {
  onSelectTemplate?: (template: EmailTemplate) => void;
}

const AdminEmailTemplates = ({ onSelectTemplate }: Props) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    category: "general" as EmailTemplate["category"]
  });

  useEffect(() => {
    // Load templates from localStorage or use defaults
    const saved = localStorage.getItem("admin-email-templates");
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      setTemplates(defaultTemplates);
      localStorage.setItem("admin-email-templates", JSON.stringify(defaultTemplates));
    }
  }, []);

  const saveTemplates = (newTemplates: EmailTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem("admin-email-templates", JSON.stringify(newTemplates));
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({ name: "", subject: "", body: "", category: "general" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.subject || !formData.body) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingTemplate) {
      const updated = templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...formData } 
          : t
      );
      saveTemplates(updated);
      toast.success("Template updated");
    } else {
      const newTemplate: EmailTemplate = {
        id: Date.now().toString(),
        ...formData
      };
      saveTemplates([...templates, newTemplate]);
      toast.success("Template created");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
    toast.success("Template deleted");
  };

  const handleCopy = (template: EmailTemplate) => {
    navigator.clipboard.writeText(template.body);
    toast.success("Template copied to clipboard");
  };

  const categoryColors = {
    general: "bg-primary/10 text-primary",
    "follow-up": "bg-accent/10 text-accent",
    rejection: "bg-destructive/10 text-destructive",
    welcome: "bg-success/10 text-success"
  };

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Email Templates
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No templates yet</p>
                <p className="text-sm">Create your first email template</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg border border-border/50 bg-card hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {template.name}
                          </span>
                          <Badge className={`text-xs ${categoryColors[template.category]}`}>
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          Subject: {template.subject}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.body.slice(0, 100)}...
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onSelectTemplate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onSelectTemplate(template)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(template)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name</label>
              <Input
                placeholder="e.g., Thank You Response"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <div className="flex gap-2 flex-wrap">
                {(["general", "follow-up", "welcome", "rejection"] as const).map((cat) => (
                  <Button
                    key={cat}
                    variant={formData.category === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Line</label>
              <Input
                placeholder="Email subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Email Body
                <span className="text-muted-foreground ml-2 font-normal">
                  Use {"{{name}}"} for recipient name
                </span>
              </label>
              <Textarea
                placeholder="Type your email template..."
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                rows={8}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Check className="h-4 w-4" />
              {editingTemplate ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminEmailTemplates;
