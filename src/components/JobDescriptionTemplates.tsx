import { useState, useEffect } from "react";
import { Save, Trash2, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Template {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface JobDescriptionTemplatesProps {
  jobDescription: string;
  onSelectTemplate: (description: string) => void;
  onSaveTemplate: () => void;
}

export const JobDescriptionTemplates = ({
  jobDescription,
  onSelectTemplate,
  onSaveTemplate,
}: JobDescriptionTemplatesProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("job_description_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const saveTemplate = async () => {
    if (!user || !jobDescription.trim() || !newTemplateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name and job description",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("job_description_templates").insert({
        user_id: user.id,
        title: newTemplateName.trim(),
        description: jobDescription.trim(),
      });

      if (error) throw error;

      toast({
        title: "Template Saved",
        description: "Your job description template has been saved",
      });
      setNewTemplateName("");
      setIsSaveDialogOpen(false);
      fetchTemplates();
      onSaveTemplate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("job_description_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Template Deleted",
        description: "The template has been removed",
      });
      fetchTemplates();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Template Selector */}
      {templates.length > 0 && (
        <Select onValueChange={(value) => {
          const template = templates.find(t => t.id === value);
          if (template) onSelectTemplate(template.description);
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Load template..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="truncate">{template.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Save Template Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!jobDescription.trim()}
            className="gap-1"
          >
            <Save className="w-3 h-3" />
            Save as Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Job Description Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name</label>
              <Input
                placeholder="e.g., Senior Frontend Developer"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description Preview</label>
              <div className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg max-h-32 overflow-y-auto">
                {jobDescription.slice(0, 200)}
                {jobDescription.length > 200 && "..."}
              </div>
            </div>
            <Button onClick={saveTemplate} disabled={isLoading} className="w-full">
              {isLoading ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Templates Dialog */}
      {templates.length > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <FileText className="w-3 h-3" />
              Manage ({templates.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Saved Templates</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg group"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{template.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {template.description.slice(0, 80)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectTemplate(template.description)}
                    >
                      Use
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
