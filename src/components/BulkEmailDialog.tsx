import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Send, Loader2, CheckCircle, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Candidate {
  id: string;
  candidate_name: string;
  candidate_email: string | null;
  stage: string;
}

interface BulkEmailDialogProps {
  candidates: Candidate[];
  onEmailsSent?: () => void;
}

const emailTypes = [
  { value: "rejection", label: "Rejection Email", icon: "❌", description: "Politely decline candidates" },
  { value: "offer", label: "Offer Letter", icon: "🎉", description: "Extend job offers" },
  { value: "interview_confirmation", label: "Interview Confirmation", icon: "📅", description: "Confirm scheduled interviews" },
  { value: "follow_up", label: "Follow-up Email", icon: "📧", description: "General update on applications" },
];

interface SendResult {
  candidateName: string;
  success: boolean;
  error?: string;
}

export const BulkEmailDialog = ({ candidates, onEmailsSent }: BulkEmailDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [emailType, setEmailType] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const eligibleCandidates = candidates.filter(c => c.candidate_email);

  const handleSelectAll = () => {
    if (selectedCandidates.length === eligibleCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(eligibleCandidates.map(c => c.id));
    }
  };

  const toggleCandidate = (id: string) => {
    setSelectedCandidates(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const handleSendBulk = async () => {
    if (selectedCandidates.length === 0) {
      toast({
        title: "No Candidates Selected",
        description: "Please select at least one candidate",
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
    const results: SendResult[] = [];

    for (const candidateId of selectedCandidates) {
      const candidate = candidates.find(c => c.id === candidateId);
      if (!candidate || !candidate.candidate_email) continue;

      try {
        const { error } = await supabase.functions.invoke("send-hiring-stage-email", {
          body: {
            candidateId: candidate.id,
            candidateName: candidate.candidate_name,
            candidateEmail: candidate.candidate_email,
            emailType,
            companyName: companyName || undefined,
            position: position || undefined,
            customMessage: customMessage || undefined,
          },
        });

        if (error) throw error;
        results.push({ candidateName: candidate.candidate_name, success: true });
      } catch (error: any) {
        results.push({ 
          candidateName: candidate.candidate_name, 
          success: false, 
          error: error.message 
        });
      }
    }

    setSendResults(results);
    setShowResults(true);
    setIsSending(false);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    toast({
      title: "Bulk Email Complete",
      description: `${successCount} sent successfully${failCount > 0 ? `, ${failCount} failed` : ""}`,
      variant: failCount > 0 ? "destructive" : "default",
    });

    onEmailsSent?.();
  };

  const handleClose = () => {
    setOpen(false);
    setShowResults(false);
    setSendResults([]);
    setSelectedCandidates([]);
    setEmailType("");
    setCustomMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Mail className="w-4 h-4" />
          Bulk Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Send Bulk Email
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {showResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-4"
            >
              <div className="text-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="font-semibold">Emails Sent</p>
              </div>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {sendResults.map((result, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between py-2 border-b last:border-0 ${
                      result.success ? "" : "text-destructive"
                    }`}
                  >
                    <span>{result.candidateName}</span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Sent" : "Failed"}
                    </Badge>
                  </div>
                ))}
              </ScrollArea>
              <Button onClick={handleClose} className="w-full mt-4">Close</Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 flex-1 overflow-hidden flex flex-col"
            >
              {/* Candidate Selection */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Select Candidates ({selectedCandidates.length} of {eligibleCandidates.length})
                  </Label>
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    {selectedCandidates.length === eligibleCandidates.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <ScrollArea className="h-[150px] rounded-md border p-2">
                  {eligibleCandidates.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No candidates with email addresses
                    </p>
                  ) : (
                    eligibleCandidates.map((candidate) => (
                      <div 
                        key={candidate.id} 
                        className="flex items-center space-x-2 py-2 px-2 hover:bg-secondary/50 rounded"
                      >
                        <Checkbox
                          id={candidate.id}
                          checked={selectedCandidates.includes(candidate.id)}
                          onCheckedChange={() => toggleCandidate(candidate.id)}
                        />
                        <label 
                          htmlFor={candidate.id} 
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <span className="font-medium">{candidate.candidate_name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            {candidate.candidate_email}
                          </span>
                        </label>
                        <Badge variant="outline" className="text-xs capitalize">
                          {candidate.stage.replace("_", " ")}
                        </Badge>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Email Type */}
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
                          <span className="font-medium">{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Company & Position */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <Label>Position</Label>
                  <Input 
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <Label>Custom Message (optional)</Label>
                <Textarea 
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personalized note..."
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendBulk} 
                  disabled={isSending || selectedCandidates.length === 0 || !emailType}
                  className="gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send to {selectedCandidates.length} Candidates
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};