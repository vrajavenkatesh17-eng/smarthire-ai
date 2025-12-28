import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface CandidateNotesProps {
  candidateId: string;
  teamId: string;
}

interface Note {
  id: string;
  note: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

export const CandidateNotes = ({ candidateId, teamId }: CandidateNotesProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  const { data: notes, isLoading } = useQuery({
    queryKey: ["candidate-notes", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidate_notes")
        .select(`
          id,
          note,
          user_id,
          created_at,
          profiles:user_id (
            full_name
          )
        `)
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Note[];
    },
    enabled: !!candidateId && !!teamId,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const { error } = await supabase.from("candidate_notes").insert({
        candidate_id: candidateId,
        team_id: teamId,
        user_id: user!.id,
        note,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-notes", candidateId] });
      setNewNote("");
      toast.success("Note added");
    },
    onError: (error) => {
      toast.error(`Failed to add note: ${error.message}`);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from("candidate_notes").delete().eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-notes", candidateId] });
      toast.success("Note deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete note: ${error.message}`);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Team Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this candidate..."
            className="min-h-[80px]"
          />
          <Button
            onClick={() => addNoteMutation.mutate(newNote)}
            disabled={!newNote.trim() || addNoteMutation.isPending}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading notes...</p>
        ) : notes?.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No notes yet. Be the first to add one!
          </p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {notes?.map((note) => (
              <div key={note.id} className="p-3 rounded-lg bg-accent/50 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {note.profiles?.full_name || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  {note.user_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteNoteMutation.mutate(note.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.note}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
