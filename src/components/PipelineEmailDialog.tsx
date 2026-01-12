import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Loader2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PipelineEmailDialogProps {
  candidateName: string;
  candidateEmail: string | null;
  currentStage: string;
  onEmailSent?: () => void;
}

const emailTypes = [
  { value: "rejection", label: "Rejection Email", icon: "❌", description: "Politely decline the candidate" },
  { value: "offer", label: "Offer Letter", icon: "🎉", description: "Extend a job offer" },
  { value: "interview_confirmation", label: "Interview Confirmation", icon: "📅", description: "Confirm scheduled interview" },
  { value: "follow_up", label: "Follow-up Email", icon: "📧", description: "General update on application" },
];

export const PipelineEmailDialog = ({ 
  candidateName, 
  candidateEmail, 
  currentStage,
  onEmailSent 
}: PipelineEmailDialogProps) => {
  const [open, setOpen] = useState(false);
  const [emailType, setEmailType] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!candidateEmail) {
      toast({
        title: "No Email",
        description: "Candidate email is required",
        variant: "destructive",
      });
      return;
    }

    if (!emailType) {
      toast({
        title: "Select Email Type",
        description: "Please select an email template",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase.functions.invoke("send-hiring-stage-email", {
        body: {
          candidateName,
          candidateEmail,
          emailType,
          companyName: companyName || undefined,
          position: position || undefined,
          salary: emailType === "offer" ? salary : undefined,
          startDate: emailType === "offer" ? startDate : undefined,
          customMessage: customMessage || undefined,
        },
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: "Email Sent",
        description: `${emailTypes.find(e => e.value === emailType)?.label} sent to ${candidateName}`,
      });
      
      onEmailSent?.();
      
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setEmailType("");
        setCustomMessage("");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Suggest email type based on stage
  const getSuggestedType = () => {
    switch (currentStage) {
      case "rejected": return "rejection";
      case "offer": return "offer";
      case "interview_scheduled": return "interview_confirmation";
      default: return "follow_up";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7" 
          disabled={!candidateEmail}
          title={candidateEmail ? "Send email to candidate" : "No email available"}
        >
          <Mail className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Send Email to {candidateName}
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-12 text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground">Email Sent Successfully!</p>
          </motion.div>
        ) : (
          <div className="space-y-4 pt-4">
            <div>
              <Label>Email Template</Label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an email template" />
                </SelectTrigger>
                <SelectContent>
                  {emailTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <div>
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{type.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!emailType && (
                <p className="text-xs text-muted-foreground mt-1">
                  Suggested: {emailTypes.find(e => e.value === getSuggestedType())?.label}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Name (optional)</Label>
                <Input 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Company"
                />
              </div>
              <div>
                <Label>Position (optional)</Label>
                <Input 
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            {emailType === "offer" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Salary/Compensation</Label>
                  <Input 
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="$120,000/year"
                  />
                </div>
                <div>
                  <Label>Proposed Start Date</Label>
                  <Input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Custom Message (optional)</Label>
              <Textarea 
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personalized note..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={isSending || !emailType}
                className="gap-2"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Email
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};