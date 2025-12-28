import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Star, StarOff } from "lucide-react";

interface CandidateRatingsProps {
  candidateId: string;
  teamId: string;
}

interface Rating {
  id: string;
  rating: number;
  category: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
  };
}

const RATING_CATEGORIES = [
  { value: "overall", label: "Overall" },
  { value: "technical", label: "Technical Skills" },
  { value: "communication", label: "Communication" },
  { value: "experience", label: "Experience" },
  { value: "culture_fit", label: "Culture Fit" },
];

export const CandidateRatings = ({ candidateId, teamId }: CandidateRatingsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("overall");

  const { data: ratings, isLoading } = useQuery({
    queryKey: ["candidate-ratings", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidate_ratings")
        .select(`
          id,
          rating,
          category,
          user_id,
          profiles:user_id (
            full_name
          )
        `)
        .eq("candidate_id", candidateId);
      if (error) throw error;
      return data as unknown as Rating[];
    },
    enabled: !!candidateId && !!teamId,
  });

  const rateMutation = useMutation({
    mutationFn: async ({ category, rating }: { category: string; rating: number }) => {
      // Use upsert to update existing rating or create new one
      const { error } = await supabase.from("candidate_ratings").upsert(
        {
          candidate_id: candidateId,
          team_id: teamId,
          user_id: user!.id,
          category,
          rating,
        },
        { onConflict: "candidate_id,user_id,category" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-ratings", candidateId] });
      toast.success("Rating saved");
    },
    onError: (error) => {
      toast.error(`Failed to save rating: ${error.message}`);
    },
  });

  const getUserRating = (category: string) => {
    return ratings?.find((r) => r.user_id === user?.id && r.category === category)?.rating || 0;
  };

  const getCategoryAverage = (category: string) => {
    const categoryRatings = ratings?.filter((r) => r.category === category) || [];
    if (categoryRatings.length === 0) return 0;
    return categoryRatings.reduce((sum, r) => sum + r.rating, 0) / categoryRatings.length;
  };

  const getCategoryRatings = (category: string) => {
    return ratings?.filter((r) => r.category === category) || [];
  };

  const StarRating = ({
    rating,
    onRate,
    readonly = false,
  }: {
    rating: number;
    onRate?: (value: number) => void;
    readonly?: boolean;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          onClick={() => !readonly && onRate?.(value)}
          disabled={readonly}
          className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
        >
          {value <= rating ? (
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          ) : (
            <StarOff className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5" />
          Team Ratings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {RATING_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 rounded-lg bg-accent/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Your Rating</span>
              <StarRating
                rating={getUserRating(selectedCategory)}
                onRate={(rating) => rateMutation.mutate({ category: selectedCategory, rating })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Team Average by Category</h4>
          {RATING_CATEGORIES.map((cat) => {
            const avg = getCategoryAverage(cat.value);
            const count = getCategoryRatings(cat.value).length;
            return (
              <div key={cat.value} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{cat.label}</span>
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(avg)} readonly />
                  <span className="text-sm text-muted-foreground">
                    ({avg.toFixed(1)}) • {count} {count === 1 ? "rating" : "ratings"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {isLoading && <p className="text-muted-foreground text-center">Loading ratings...</p>}
      </CardContent>
    </Card>
  );
};
