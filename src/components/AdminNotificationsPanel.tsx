import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Reply, 
  Check, 
  Trash2, 
  Clock,
  User,
  Send,
  X,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Notification {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string | null;
  message: string;
  status: string;
  replied_at: string | null;
  reply_message: string | null;
  created_at: string;
}

const AdminNotificationsPanel = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            toast.info("New inquiry received!", {
              description: `From ${(payload.new as Notification).sender_name}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(n => n.id === (payload.new as Notification).id ? payload.new as Notification : n)
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== (payload.old as Notification).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ status: "read" })
        .eq("id", notificationId);

      if (error) throw error;
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, status: "read" } : n)
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleReply = async () => {
    if (!selectedNotification || !replyMessage.trim()) return;

    setReplying(true);
    try {
      // Send reply email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-admin-reply", {
        body: {
          recipientEmail: selectedNotification.sender_email,
          recipientName: selectedNotification.sender_name,
          subject: selectedNotification.subject || "Your Inquiry",
          originalMessage: selectedNotification.message,
          replyMessage: replyMessage.trim(),
        },
      });

      if (emailError) throw emailError;

      // Update notification in database
      const { error: updateError } = await supabase
        .from("admin_notifications")
        .update({
          status: "replied",
          replied_at: new Date().toISOString(),
          reply_message: replyMessage.trim(),
        })
        .eq("id", selectedNotification.id);

      if (updateError) throw updateError;

      toast.success("Reply sent successfully!");
      setReplyDialogOpen(false);
      setReplyMessage("");
      setSelectedNotification(null);
    } catch (error: any) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply. Please try again.");
    } finally {
      setReplying(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("admin_notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const unreadCount = notifications.filter(n => n.status === "unread").length;

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              User Inquiries
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <AnimatePresence>
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-muted-foreground"
                >
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No inquiries yet</p>
                  <p className="text-sm">User messages will appear here</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                        notification.status === "unread"
                          ? "bg-primary/5 border-primary/20"
                          : "bg-card border-border/50"
                      }`}
                      onClick={() => {
                        if (notification.status === "unread") {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground truncate">
                              {notification.sender_name}
                            </span>
                            <Badge 
                              variant={
                                notification.status === "unread" ? "default" :
                                notification.status === "replied" ? "secondary" : "outline"
                              }
                              className="text-xs"
                            >
                              {notification.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {notification.sender_email}
                          </p>
                          {notification.subject && (
                            <p className="text-sm font-medium text-foreground mt-1">
                              {notification.subject}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNotification(notification);
                              setReplyDialogOpen(true);
                            }}
                          >
                            <Reply className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {notification.replied_at && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-2 text-xs text-success">
                            <Check className="h-3 w-3" />
                            Replied on {format(new Date(notification.replied_at), "MMM d, yyyy")}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5 text-primary" />
              Reply to {selectedNotification?.sender_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Original Message:</p>
                <p className="text-sm text-foreground">{selectedNotification.message}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your Reply:</label>
                <Textarea
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReply} 
              disabled={!replyMessage.trim() || replying}
              className="gap-2"
            >
              {replying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminNotificationsPanel;
