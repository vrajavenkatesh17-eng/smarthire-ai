import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Users, 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check,
  Shield,
  Loader2,
  Mail,
  Calendar,
  UserMinus,
  AlertTriangle,
  BarChart3,
  Bell
} from "lucide-react";
import OnboardingWizard from "@/components/OnboardingWizard";
import AdminAnalyticsDashboard from "@/components/AdminAnalyticsDashboard";
import AdminNotificationsPanel from "@/components/AdminNotificationsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CompanyUser {
  id: string;
  user_id: string;
  email: string | null;
  upgraded_at: string;
}

interface PasskeySetting {
  id: string;
  passkey: string;
  is_active: boolean;
  created_at: string;
}

const CompanyAdmin = () => {
  const { user } = useAuth();
  const { isCompany } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [passkeys, setPasskeys] = useState<PasskeySetting[]>([]);
  const [newPasskey, setNewPasskey] = useState("");
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewAdmin, setIsNewAdmin] = useState(false);
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("analytics");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAdminStatus();
  }, [user, navigate]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data: adminData, error } = await supabase
        .from("company_admins")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Not an admin, check if they can become one (first admin)
          const { count } = await supabase
            .from("company_admins")
            .select("*", { count: "exact", head: true });

          if (count === 0 && isCompany) {
            // First company user becomes admin
            const { data: newAdmin, error: insertError } = await supabase
              .from("company_admins")
              .insert({ user_id: user.id })
              .select()
              .single();

            if (!insertError && newAdmin) {
              setIsAdmin(true);
              setAdminId(newAdmin.id);
              setIsNewAdmin(true);
              setShowOnboarding(true);
              toast({
                title: "Admin Access Granted",
                description: "You are now the company admin!",
              });
            }
          } else {
            setIsAdmin(false);
          }
        }
      } else {
      setIsAdmin(true);
        setAdminId(adminData.id);
        await fetchCompanyUsers(adminData.id);
        const fetchedPasskeys = await fetchPasskeys(adminData.id);
        // Show onboarding if no passkeys exist
        if (fetchedPasskeys.length === 0) {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanyUsers = async (adminIdParam: string) => {
    const { data, error } = await supabase
      .from("company_users")
      .select("*")
      .eq("admin_id", adminIdParam)
      .order("upgraded_at", { ascending: false });

    if (!error && data) {
      setCompanyUsers(data);
    }
  };

  const fetchPasskeys = async (adminIdParam: string) => {
    const { data, error } = await supabase
      .from("passkey_settings")
      .select("*")
      .eq("admin_id", adminIdParam)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPasskeys(data);
      return data;
    }
    return [];
  };

  const revokeUserAccess = async (userId: string, userEmail: string | null) => {
    setRevokingUserId(userId);
    try {
      // Delete from company_users
      const { error: deleteError } = await supabase
        .from("company_users")
        .delete()
        .eq("user_id", userId)
        .eq("admin_id", adminId);

      if (deleteError) throw deleteError;

      // Update user role back to common
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: "common", updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (roleError) throw roleError;

      // Update local state
      setCompanyUsers(prev => prev.filter(u => u.user_id !== userId));
      
      toast({
        title: "Access Revoked",
        description: `${userEmail || "User"} has been removed from company access.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRevokingUserId(null);
    }
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    if (adminId) {
      await fetchPasskeys(adminId);
      await fetchCompanyUsers(adminId);
    }
  };

  const handleAddPasskey = async () => {
    if (!newPasskey.trim() || !adminId) return;

    setIsAddingPasskey(true);
    try {
      const { error } = await supabase
        .from("passkey_settings")
        .insert({
          admin_id: adminId,
          passkey: newPasskey.trim(),
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Passkey Added",
        description: "New passkey has been created successfully.",
      });
      setNewPasskey("");
      setDialogOpen(false);
      await fetchPasskeys(adminId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAddingPasskey(false);
    }
  };

  const togglePasskeyStatus = async (passkeyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("passkey_settings")
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq("id", passkeyId);

      if (error) throw error;

      setPasskeys(prev => 
        prev.map(p => p.id === passkeyId ? { ...p, is_active: !currentStatus } : p)
      );

      toast({
        title: currentStatus ? "Passkey Disabled" : "Passkey Enabled",
        description: `Passkey has been ${currentStatus ? "disabled" : "enabled"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deletePasskey = async (passkeyId: string) => {
    try {
      const { error } = await supabase
        .from("passkey_settings")
        .delete()
        .eq("id", passkeyId);

      if (error) throw error;

      setPasskeys(prev => prev.filter(p => p.id !== passkeyId));
      toast({
        title: "Passkey Deleted",
        description: "Passkey has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyPasskey = (passkey: string, id: string) => {
    navigator.clipboard.writeText(passkey);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: "Passkey copied to clipboard.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="hover-lift">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Admin Access Required</h1>
                  </div>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </motion.header>

        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full glass-card">
            <CardContent className="pt-6 text-center">
              <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Admin Access Only</h2>
              <p className="text-muted-foreground mb-4">
                This page is restricted to company administrators.
              </p>
              <Link to="/profile">
                <Button>Go to Profile</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Show onboarding wizard for new admins
  if (showOnboarding && adminId) {
    return (
      <div className="min-h-screen bg-background">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Company Setup</h1>
                  <p className="text-xs text-muted-foreground">Get started with your company</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </motion.header>
        <main className="container mx-auto px-6 py-12">
          <OnboardingWizard adminId={adminId} onComplete={handleOnboardingComplete} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gradient-to-b dark:from-background dark:via-background dark:to-muted/20">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border dark:border-border/50"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="hover-lift">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shadow-glow">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Company Admin</h1>
                  <p className="text-xs text-muted-foreground">Manage your company</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4 bg-muted/50 dark:bg-muted/30 p-1">
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Inbox</span>
            </TabsTrigger>
            <TabsTrigger value="passkeys" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">Passkeys</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AdminAnalyticsDashboard />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <AdminNotificationsPanel />
          </TabsContent>

          {/* Passkeys Tab */}
          <TabsContent value="passkeys" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card dark:bg-card/50 dark:border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-primary" />
                        Passkey Management
                      </CardTitle>
                      <CardDescription>
                        Create and manage access passkeys for your company
                      </CardDescription>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-hero hover:opacity-90 shadow-glow">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Passkey
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="dark:bg-card dark:border-border/50">
                        <DialogHeader>
                          <DialogTitle>Create New Passkey</DialogTitle>
                          <DialogDescription>
                            Create a new passkey that users can use to upgrade to company access.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="passkey">Passkey</Label>
                            <Input
                              id="passkey"
                              placeholder="Enter a unique passkey..."
                              value={newPasskey}
                              onChange={(e) => setNewPasskey(e.target.value)}
                              className="dark:bg-muted/50 dark:border-border/50"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddPasskey} disabled={isAddingPasskey || !newPasskey.trim()} className="bg-gradient-hero">
                            {isAddingPasskey ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create Passkey"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {passkeys.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                        <Key className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="font-medium">No passkeys created yet.</p>
                      <p className="text-sm">Create a passkey to allow users to upgrade to company access.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead>Passkey</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {passkeys.map((passkey) => (
                          <TableRow key={passkey.id} className="border-border/50 hover:bg-muted/30">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="bg-muted/50 dark:bg-muted/30 px-3 py-1.5 rounded-lg text-sm font-mono border border-border/50">
                                  {passkey.passkey}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-primary/10"
                                  onClick={() => copyPasskey(passkey.passkey, passkey.id)}
                                >
                                  {copiedId === passkey.id ? (
                                    <Check className="w-4 h-4 text-success" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={passkey.is_active ? "default" : "secondary"}
                                className={passkey.is_active ? "bg-success/20 text-success border-success/30" : ""}
                              >
                                {passkey.is_active ? "Active" : "Disabled"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(passkey.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Switch
                                  checked={passkey.is_active}
                                  onCheckedChange={() => togglePasskeyStatus(passkey.id, passkey.is_active)}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => deletePasskey(passkey.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card dark:bg-card/50 dark:border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Company Users
                  </CardTitle>
                  <CardDescription>
                    Users who have upgraded using your company passkeys
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {companyUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                        <Users className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="font-medium">No users have upgraded yet.</p>
                      <p className="text-sm">Share your passkey to allow users to join.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead>Email</TableHead>
                          <TableHead>Upgraded At</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companyUsers.map((cu) => (
                          <TableRow key={cu.id} className="border-border/50 hover:bg-muted/30">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary-foreground">
                                    {cu.email?.charAt(0).toUpperCase() || "U"}
                                  </span>
                                </div>
                                <span className="text-foreground font-medium">{cu.email || "Unknown"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {new Date(cu.upgraded_at).toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={revokingUserId === cu.user_id}
                                  >
                                    {revokingUserId === cu.user_id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <UserMinus className="w-4 h-4 mr-2" />
                                        Revoke
                                      </>
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="dark:bg-card dark:border-border/50">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="w-5 h-5 text-destructive" />
                                      Revoke Company Access
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to revoke company access for{" "}
                                      <strong>{cu.email || "this user"}</strong>? They will be 
                                      downgraded to a common user and lose access to company features.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => revokeUserAccess(cu.user_id, cu.email)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Revoke Access
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CompanyAdmin;
