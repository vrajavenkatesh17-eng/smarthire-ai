import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, MessageSquare, Star, TrendingUp, Activity, 
  Calendar, UserPlus, Clock 
} from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface TeamActivityDashboardProps {
  teamId?: string;
}

export const TeamActivityDashboard = ({ teamId }: TeamActivityDashboardProps) => {
  const { user } = useAuth();

  const { data: teams } = useQuery({
    queryKey: ["user-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: teamMembers } = useQuery({
    queryKey: ["team-members-count", teamId],
    queryFn: async () => {
      const query = supabase
        .from("team_memberships")
        .select(`
          id,
          team_id,
          user_id,
          created_at,
          profiles:user_id (
            full_name,
            email
          )
        `);
      
      if (teamId) {
        query.eq("team_id", teamId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: recentNotes } = useQuery({
    queryKey: ["recent-notes", teamId],
    queryFn: async () => {
      const query = supabase
        .from("candidate_notes")
        .select(`
          id,
          note,
          created_at,
          team_id,
          profiles:user_id (
            full_name
          ),
          candidate_pipeline:candidate_id (
            candidate_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (teamId) {
        query.eq("team_id", teamId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: recentRatings } = useQuery({
    queryKey: ["recent-ratings", teamId],
    queryFn: async () => {
      const query = supabase
        .from("candidate_ratings")
        .select(`
          id,
          rating,
          category,
          created_at,
          team_id,
          profiles:user_id (
            full_name
          ),
          candidate_pipeline:candidate_id (
            candidate_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (teamId) {
        query.eq("team_id", teamId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: teamCandidates } = useQuery({
    queryKey: ["team-candidates", teamId],
    queryFn: async () => {
      const query = supabase
        .from("candidate_pipeline")
        .select("*")
        .not("team_id", "is", null);
      
      if (teamId) {
        query.eq("team_id", teamId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate metrics
  const totalTeams = teams?.length || 0;
  const totalMembers = teamMembers?.length || 0;
  const totalNotes = recentNotes?.length || 0;
  const totalRatings = recentRatings?.length || 0;
  const totalCandidates = teamCandidates?.length || 0;

  // Activity in last 7 days
  const sevenDaysAgo = subDays(new Date(), 7);
  const recentNotesCount = recentNotes?.filter(n => 
    isAfter(new Date(n.created_at), sevenDaysAgo)
  ).length || 0;
  const recentRatingsCount = recentRatings?.filter(r => 
    isAfter(new Date(r.created_at), sevenDaysAgo)
  ).length || 0;

  // Rating distribution for pie chart
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    name: `${rating} Star`,
    value: recentRatings?.filter(r => r.rating === rating).length || 0,
  }));

  // Activity by category for bar chart
  const categoryData = ["overall", "technical", "communication", "experience", "culture_fit"].map(cat => ({
    category: cat.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    ratings: recentRatings?.filter(r => r.category === cat).length || 0,
  }));

  const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Activity className="h-6 w-6" />
        Team Activity Dashboard
      </h2>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeams}</div>
            <p className="text-xs text-muted-foreground">Active collaboration teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">Across all teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes Added</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotes}</div>
            <p className="text-xs text-muted-foreground">
              +{recentNotesCount} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ratings Given</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRatings}</div>
            <p className="text-xs text-muted-foreground">
              +{recentRatingsCount} this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ratingDistribution.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {ratingDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ratings by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="ratings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {recentNotes?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No notes yet</p>
              ) : (
                recentNotes?.slice(0, 5).map((note: any) => (
                  <div key={note.id} className="p-3 rounded-lg bg-accent/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {note.profiles?.full_name || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      on <span className="text-foreground">{note.candidate_pipeline?.candidate_name}</span>
                    </p>
                    <p className="text-sm mt-1 line-clamp-2">{note.note}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5" />
              Recent Ratings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {recentRatings?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No ratings yet</p>
              ) : (
                recentRatings?.slice(0, 5).map((rating: any) => (
                  <div key={rating.id} className="p-3 rounded-lg bg-accent/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {rating.profiles?.full_name || "Unknown"}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${
                              i < rating.rating 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-muted-foreground"
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground">{rating.candidate_pipeline?.candidate_name}</span>
                      {" • "}
                      <span className="capitalize">{rating.category.replace("_", " ")}</span>
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(rating.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers?.slice(0, 6).map((member: any) => {
              const memberNotes = recentNotes?.filter((n: any) => 
                n.profiles?.full_name === member.profiles?.full_name
              ).length || 0;
              const memberRatings = recentRatings?.filter((r: any) => 
                r.profiles?.full_name === member.profiles?.full_name
              ).length || 0;

              return (
                <div key={member.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {member.profiles?.full_name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.profiles?.full_name || "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.profiles?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span>{memberNotes} notes</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Star className="h-3 w-3" />
                      <span>{memberRatings} ratings</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
