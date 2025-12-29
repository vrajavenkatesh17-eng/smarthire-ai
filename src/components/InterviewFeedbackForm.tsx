import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Star, StarOff, ClipboardList, Loader2, CheckCircle, XCircle, ThumbsUp, ThumbsDown } from "lucide-react";

interface InterviewFeedbackFormProps {
  interviewId: string;
  candidateName: string;
  teamId?: string | null;
  onSubmit?: () => void;
}

interface FeedbackData {
  recommendation: "strong_hire" | "hire" | "no_hire" | "strong_no_hire";
  technical_skills: number;
  communication: number;
  problem_solving: number;
  culture_fit: number;
  experience_relevance: number;
  strengths: string;
  areas_for_improvement: string;
  additional_notes: string;
}

const RECOMMENDATIONS = [
  { value: "strong_hire", label: "Strong Hire", icon: CheckCircle, color: "text-green-600" },
  { value: "hire", label: "Hire", icon: ThumbsUp, color: "text-green-500" },
  { value: "no_hire", label: "No Hire", icon: ThumbsDown, color: "text-red-500" },
  { value: "strong_no_hire", label: "Strong No Hire", icon: XCircle, color: "text-red-600" },
];

const RATING_CATEGORIES = [
  { key: "technical_skills", label: "Technical Skills" },
  { key: "communication", label: "Communication" },
  { key: "problem_solving", label: "Problem Solving" },
  { key: "culture_fit", label: "Culture Fit" },
  { key: "experience_relevance", label: "Experience Relevance" },
];

const StarRating = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="cursor-pointer hover:scale-110 transition-transform"
      >
        {star <= value ? (
          <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
        ) : (
          <StarOff className="h-6 w-6 text-muted-foreground" />
        )}
      </button>
    ))}
  </div>
);

export const InterviewFeedbackForm = ({
  interviewId,
  candidateName,
  teamId,
  onSubmit,
}: InterviewFeedbackFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackData>({
    recommendation: "hire",
    technical_skills: 3,
    communication: 3,
    problem_solving: 3,
    culture_fit: 3,
    experience_relevance: 3,
    strengths: "",
    areas_for_improvement: "",
    additional_notes: "",
  });

  // Check if user has already submitted feedback
  const { data: existingFeedback, isLoading: loadingFeedback } = useQuery({
    queryKey: ["interview-feedback", interviewId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_feedback")
        .select("*")
        .eq("interview_id", interviewId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!interviewId,
  });

  // Load existing feedback into form
  useEffect(() => {
    if (existingFeedback) {
      setFeedback({
        recommendation: existingFeedback.recommendation as FeedbackData["recommendation"],
        technical_skills: existingFeedback.technical_skills || 3,
        communication: existingFeedback.communication || 3,
        problem_solving: existingFeedback.problem_solving || 3,
        culture_fit: existingFeedback.culture_fit || 3,
        experience_relevance: existingFeedback.experience_relevance || 3,
        strengths: existingFeedback.strengths || "",
        areas_for_improvement: existingFeedback.areas_for_improvement || "",
        additional_notes: existingFeedback.additional_notes || "",
      });
    }
  }, [existingFeedback]);

  const submitMutation = useMutation({
    mutationFn: async (data: FeedbackData) => {
      const feedbackPayload = {
        interview_id: interviewId,
        user_id: user!.id,
        team_id: teamId || null,
        ...data,
      };

      if (existingFeedback) {
        const { error } = await supabase
          .from("interview_feedback")
          .update(feedbackPayload)
          .eq("id", existingFeedback.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("interview_feedback")
          .insert(feedbackPayload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview-feedback"] });
      toast.success(existingFeedback ? "Feedback updated" : "Feedback submitted");
      setIsOpen(false);
      onSubmit?.();
    },
    onError: (error) => {
      toast.error(`Failed to submit feedback: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(feedback);
  };

  const updateRating = (key: keyof FeedbackData, value: number) => {
    setFeedback((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardList className="h-4 w-4 mr-2" />
          {existingFeedback ? "Edit Feedback" : "Add Feedback"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Interview Feedback: {candidateName}
          </DialogTitle>
        </DialogHeader>

        {loadingFeedback ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Recommendation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Overall Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={feedback.recommendation}
                  onValueChange={(value) =>
                    setFeedback((prev) => ({
                      ...prev,
                      recommendation: value as FeedbackData["recommendation"],
                    }))
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  {RECOMMENDATIONS.map((rec) => (
                    <div key={rec.value}>
                      <RadioGroupItem
                        value={rec.value}
                        id={rec.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={rec.value}
                        className={`flex items-center justify-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors`}
                      >
                        <rec.icon className={`h-5 w-5 ${rec.color}`} />
                        <span className="font-medium">{rec.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Skills Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {RATING_CATEGORIES.map((category) => (
                  <div
                    key={category.key}
                    className="flex items-center justify-between py-2"
                  >
                    <Label className="text-sm font-medium">{category.label}</Label>
                    <StarRating
                      value={feedback[category.key as keyof FeedbackData] as number}
                      onChange={(value) =>
                        updateRating(category.key as keyof FeedbackData, value)
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Written Feedback */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Written Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="strengths">Key Strengths</Label>
                  <Textarea
                    id="strengths"
                    value={feedback.strengths}
                    onChange={(e) =>
                      setFeedback((prev) => ({ ...prev, strengths: e.target.value }))
                    }
                    placeholder="What stood out positively about this candidate?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="improvements">Areas for Improvement</Label>
                  <Textarea
                    id="improvements"
                    value={feedback.areas_for_improvement}
                    onChange={(e) =>
                      setFeedback((prev) => ({
                        ...prev,
                        areas_for_improvement: e.target.value,
                      }))
                    }
                    placeholder="What areas could the candidate improve on?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={feedback.additional_notes}
                    onChange={(e) =>
                      setFeedback((prev) => ({
                        ...prev,
                        additional_notes: e.target.value,
                      }))
                    }
                    placeholder="Any other observations or comments..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {existingFeedback ? "Update Feedback" : "Submit Feedback"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
