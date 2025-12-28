import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Plus, UserPlus, Trash2 } from "lucide-react";

interface Team {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

export const TeamManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Team[];
    },
    enabled: !!user,
  });

  const { data: memberships } = useQuery({
    queryKey: ["team-memberships", selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      const { data, error } = await supabase
        .from("team_memberships")
        .select(`
          id,
          user_id,
          role,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq("team_id", selectedTeamId);
      if (error) throw error;
      return data as unknown as TeamMember[];
    },
    enabled: !!selectedTeamId,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({ name, created_by: user!.id })
        .select()
        .single();
      if (teamError) throw teamError;

      // Add creator as team member
      const { error: memberError } = await supabase
        .from("team_memberships")
        .insert({ team_id: team.id, user_id: user!.id, role: "admin" });
      if (memberError) throw memberError;

      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setNewTeamName("");
      setIsCreateOpen(false);
      toast.success("Team created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create team: ${error.message}`);
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async ({ teamId, email }: { teamId: string; email: string }) => {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .single();
      
      if (profileError || !profile) {
        throw new Error("User not found. They must have an account first.");
      }

      const { error } = await supabase
        .from("team_memberships")
        .insert({ team_id: teamId, user_id: profile.user_id, role: "member" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-memberships"] });
      setInviteEmail("");
      setIsInviteOpen(false);
      toast.success("Team member added successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("team_memberships")
        .delete()
        .eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-memberships"] });
      toast.success("Member removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove member: ${error.message}`);
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setSelectedTeamId(null);
      toast.success("Team deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete team: ${error.message}`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Team Management
        </h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
              <Button
                onClick={() => createTeamMutation.mutate(newTeamName)}
                disabled={!newTeamName.trim() || createTeamMutation.isPending}
                className="w-full"
              >
                Create Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Teams</CardTitle>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : teams?.length === 0 ? (
              <p className="text-muted-foreground">No teams yet. Create one to get started!</p>
            ) : (
              <div className="space-y-2">
                {teams?.map((team) => (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTeamId === team.id ? "bg-accent border-primary" : "hover:bg-accent/50"
                    }`}
                    onClick={() => setSelectedTeamId(team.id)}
                  >
                    <span className="font-medium">{team.name}</span>
                    {team.created_by === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTeamMutation.mutate(team.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            {selectedTeamId && (
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteEmail">Email Address</Label>
                      <Input
                        id="inviteEmail"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                    <Button
                      onClick={() =>
                        inviteMemberMutation.mutate({
                          teamId: selectedTeamId!,
                          email: inviteEmail,
                        })
                      }
                      disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
                      className="w-full"
                    >
                      Add Member
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {!selectedTeamId ? (
              <p className="text-muted-foreground">Select a team to view members</p>
            ) : memberships?.length === 0 ? (
              <p className="text-muted-foreground">No members yet</p>
            ) : (
              <div className="space-y-2">
                {memberships?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">
                        {member.profiles?.full_name || "Unknown User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.profiles?.email} • {member.role}
                      </p>
                    </div>
                    {member.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMemberMutation.mutate(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
