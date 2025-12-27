import { useState } from "react";
import { Calendar, Clock, Video, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleInterviewDialogProps {
  candidateName: string;
  candidateEmail?: string | null;
  resumeId?: string;
  pipelineId?: string;
  userId: string;
  onScheduled?: () => void;
  trigger?: React.ReactNode;
}

export const ScheduleInterviewDialog = ({
  candidateName,
  candidateEmail,
  resumeId,
  pipelineId,
  userId,
  onScheduled,
  trigger,
}: ScheduleInterviewDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: "60",
    type: "video",
    location: "",
    interviewer: "",
    notes: "",
  });
  const { toast } = useToast();

  const handleSchedule = async () => {
    if (!form.date || !form.time) {
      toast({ title: "Missing info", description: "Please select date and time", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, ensure candidate is in pipeline if not already
      let finalPipelineId = pipelineId;

      if (!finalPipelineId) {
        const { data: pipelineData, error: pipelineError } = await supabase
          .from("candidate_pipeline")
          .insert({
            user_id: userId,
            resume_id: resumeId || null,
            candidate_name: candidateName,
            candidate_email: candidateEmail || null,
            stage: "interview_scheduled",
          })
          .select()
          .single();

        if (pipelineError) throw pipelineError;
        finalPipelineId = pipelineData.id;
      } else {
        // Update existing pipeline entry stage
        await supabase
          .from("candidate_pipeline")
          .update({ stage: "interview_scheduled" })
          .eq("id", pipelineId);
      }

      // Create interview
      const scheduledAt = new Date(`${form.date}T${form.time}`);
      
      const { error: interviewError } = await supabase.from("interviews").insert({
        user_id: userId,
        pipeline_id: finalPipelineId,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(form.duration),
        interview_type: form.type,
        location: form.location || null,
        interviewer_name: form.interviewer || null,
        notes: form.notes || null,
        status: "scheduled",
      });

      if (interviewError) throw interviewError;

      toast({
        title: "Interview Scheduled",
        description: `Interview with ${candidateName} scheduled for ${scheduledAt.toLocaleDateString()}`,
      });

      setOpen(false);
      setForm({ date: "", time: "", duration: "60", type: "video", location: "", interviewer: "", notes: "" });
      onScheduled?.();
    } catch (error) {
      console.error("Schedule error:", error);
      toast({ title: "Error", description: "Failed to schedule interview", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get tomorrow's date as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Interview
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="font-medium text-foreground">{candidateName}</p>
            {candidateEmail && <p className="text-sm text-muted-foreground">{candidateEmail}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date *
              </Label>
              <Input
                type="date"
                min={minDate}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time *
              </Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration</Label>
              <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <span className="flex items-center gap-2">
                      <Video className="w-3 h-3" /> Video Call
                    </span>
                  </SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Location / Link
            </Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Zoom link, office address, etc."
            />
          </div>

          <div>
            <Label className="flex items-center gap-1">
              <User className="w-3 h-3" /> Interviewer
            </Label>
            <Input
              value={form.interviewer}
              onChange={(e) => setForm({ ...form, interviewer: e.target.value })}
              placeholder="Who will conduct the interview?"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Interview focus areas, preparation notes..."
              rows={2}
            />
          </div>

          <Button onClick={handleSchedule} className="w-full" disabled={isSubmitting || !form.date || !form.time}>
            {isSubmitting ? "Scheduling..." : "Schedule Interview"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
