import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Star, CheckCircle, XCircle, ThumbsUp, ThumbsDown, 
  Users, MessageSquare, Loader2 
} from "lucide-react";
import { format } from "date-fns";

interface InterviewFeedbackSummaryProps {
  interviewId: string;
}

interface Feedback {
  id: string;
  recommendation: string;
  technical_skills: number | null;
  communication: number | null;
  problem_solving: number | null;
  culture_fit: number | null;
  experience_relevance: number | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  additional_notes: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

const RECOMMENDATION_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string; bgColor: string }> = {
  strong_hire: { label: "Strong Hire", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
  hire: { label: "Hire", icon: ThumbsUp, color: "text-green-500", bgColor: "bg-green-50" },
  no_hire: { label: "No Hire", icon: ThumbsDown, color: "text-red-500", bgColor: "bg-red-50" },
  strong_no_hire: { label: "Strong No Hire", icon: XCircle, color: "text-red-600", bgColor: "bg-red-100" },
};

const RATING_LABELS = [
  { key: "technical_skills", label: "Technical Skills" },
  { key: "communication", label: "Communication" },
  { key: "problem_solving", label: "Problem Solving" },
  { key: "culture_fit", label: "Culture Fit" },
  { key: "experience_relevance", label: "Experience" },
];

export const InterviewFeedbackSummary = ({ interviewId }: InterviewFeedbackSummaryProps) => {
  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ["interview-feedback-all", interviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_feedback")
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .eq("interview_id", interviewId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Feedback[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No feedback submitted yet</p>
      </div>
    );
  }

  // Calculate averages
  const calculateAverage = (key: keyof Feedback) => {
    const values = feedbacks
      .map((f) => f[key] as number | null)
      .filter((v): v is number => v !== null);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  // Count recommendations
  const recommendationCounts = feedbacks.reduce((acc, f) => {
    acc[f.recommendation] = (acc[f.recommendation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalFeedbacks = feedbacks.length;
  const hireVotes = (recommendationCounts.strong_hire || 0) + (recommendationCounts.hire || 0);
  const noHireVotes = (recommendationCounts.strong_no_hire || 0) + (recommendationCounts.no_hire || 0);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Feedback Summary ({totalFeedbacks} {totalFeedbacks === 1 ? "review" : "reviews"})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recommendation Summary */}
          <div className="flex gap-4 justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{hireVotes}</div>
              <div className="text-sm text-muted-foreground">Hire</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{noHireVotes}</div>
              <div className="text-sm text-muted-foreground">No Hire</div>
            </div>
          </div>

          {/* Average Ratings */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground">Average Ratings</h4>
            {RATING_LABELS.map((rating) => {
              const avg = calculateAverage(rating.key as keyof Feedback);
              return (
                <div key={rating.key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{rating.label}</span>
                    <span className="font-medium">{avg.toFixed(1)} / 5</span>
                  </div>
                  <Progress value={(avg / 5) * 100} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Individual Feedback */}
      <div className="space-y-3">
        <h4 className="font-medium">Individual Feedback</h4>
        {feedbacks.map((feedback) => {
          const recConfig = RECOMMENDATION_CONFIG[feedback.recommendation];
          const RecIcon = recConfig?.icon || ThumbsUp;
          
          return (
            <Card key={feedback.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">
                      {feedback.profiles?.full_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(feedback.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <Badge className={`${recConfig?.bgColor} ${recConfig?.color} border-0`}>
                    <RecIcon className="h-3 w-3 mr-1" />
                    {recConfig?.label}
                  </Badge>
                </div>

                {/* Ratings Grid */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {RATING_LABELS.map((rating) => {
                    const value = feedback[rating.key as keyof Feedback] as number | null;
                    return (
                      <div key={rating.key} className="text-center">
                        <div className="text-xs text-muted-foreground truncate" title={rating.label}>
                          {rating.label.split(" ")[0]}
                        </div>
                        <div className="flex items-center justify-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{value || "-"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Written Feedback */}
                {feedback.strengths && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-green-600">Strengths: </span>
                    <span className="text-sm">{feedback.strengths}</span>
                  </div>
                )}
                {feedback.areas_for_improvement && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-orange-600">Areas to improve: </span>
                    <span className="text-sm">{feedback.areas_for_improvement}</span>
                  </div>
                )}
                {feedback.additional_notes && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Notes: </span>
                    <span className="text-sm">{feedback.additional_notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
