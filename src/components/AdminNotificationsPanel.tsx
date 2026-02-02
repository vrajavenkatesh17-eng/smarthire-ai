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
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckSquare,
  Square,
  Users,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  email_delivery_status?: string;
  resend_id?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: "general" | "follow-up" | "rejection" | "welcome";
}

const AdminNotificationsPanel = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  // Batch reply state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchReplying, setBatchReplying] = useState(false);
  
  // Preview state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ subject: string; body: string } | null>(null);
  
  // Retry state
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
      loadTemplates();
    }
  }, [user]);

  const loadTemplates = () => {
    const saved = localStorage.getItem("admin-email-templates");
    if (saved) {
      setTemplates(JSON.parse(saved));
    }
  };

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

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template && selectedNotification) {
      // Replace {{name}} placeholder with recipient name
      const processedBody = template.body.replace(/\{\{name\}\}/g, selectedNotification.sender_name);
      setReplyMessage(processedBody);
    }
  };

  const handlePreview = () => {
    if (!selectedNotification || !replyMessage.trim()) return;
    
    const template = templates.find(t => t.id === selectedTemplate);
    const subject = template?.subject || selectedNotification.subject || "Re: Your Inquiry";
    
    // Process template with recipient name
    const processedBody = replyMessage.replace(/\{\{name\}\}/g, selectedNotification.sender_name);
    
    setPreviewContent({
      subject: `Re: ${subject}`,
      body: processedBody,
    });
    setPreviewDialogOpen(true);
  };

  const handleReply = async () => {
    if (!selectedNotification || !replyMessage.trim()) return;

    setReplying(true);
    try {
      const { data, error: emailError } = await supabase.functions.invoke("send-admin-reply", {
        body: {
          recipientEmail: selectedNotification.sender_email,
          recipientName: selectedNotification.sender_name,
          subject: selectedNotification.subject || "Your Inquiry",
          originalMessage: selectedNotification.message,
          replyMessage: replyMessage.trim(),
        },
      });

      if (emailError) throw emailError;

      const resendId = data?.data?.id || null;
      const deliveryStatus = resendId ? "sent" : "failed";

      const { error: updateError } = await supabase
        .from("admin_notifications")
        .update({
          status: "replied",
          replied_at: new Date().toISOString(),
          reply_message: replyMessage.trim(),
        })
        .eq("id", selectedNotification.id);

      if (updateError) throw updateError;

      setNotifications(prev =>
        prev.map(n => n.id === selectedNotification.id 
          ? { ...n, status: "replied", replied_at: new Date().toISOString(), reply_message: replyMessage.trim(), email_delivery_status: deliveryStatus, resend_id: resendId }
          : n
        )
      );

      toast.success("Reply sent successfully!", {
        description: resendId ? `Email ID: ${resendId.slice(0, 8)}...` : undefined,
      });
      setReplyDialogOpen(false);
      setReplyMessage("");
      setSelectedNotification(null);
      setSelectedTemplate("");
    } catch (error: any) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply. Please try again.");
    } finally {
      setReplying(false);
    }
  };

  const handleBatchReply = async () => {
    if (selectedIds.size === 0 || !replyMessage.trim()) return;

    setBatchReplying(true);
    const selectedNotifications = notifications.filter(n => selectedIds.has(n.id));
    let successCount = 0;
    let failCount = 0;

    for (const notification of selectedNotifications) {
      try {
        // Process template with recipient name
        const processedMessage = replyMessage.replace(/\{\{name\}\}/g, notification.sender_name);

        const { data, error: emailError } = await supabase.functions.invoke("send-admin-reply", {
          body: {
            recipientEmail: notification.sender_email,
            recipientName: notification.sender_name,
            subject: notification.subject || "Your Inquiry",
            originalMessage: notification.message,
            replyMessage: processedMessage,
          },
        });

        if (emailError) throw emailError;

        const resendId = data?.data?.id || null;

        await supabase
          .from("admin_notifications")
          .update({
            status: "replied",
            replied_at: new Date().toISOString(),
            reply_message: processedMessage,
          })
          .eq("id", notification.id);

        successCount++;
      } catch (error) {
        console.error(`Error sending reply to ${notification.sender_email}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Sent ${successCount} replies successfully!`);
      fetchNotifications();
    }
    if (failCount > 0) {
      toast.error(`Failed to send ${failCount} replies.`);
    }

    setBatchDialogOpen(false);
    setReplyMessage("");
    setSelectedIds(new Set());
    setSelectedTemplate("");
    setBatchReplying(false);
  };

  const handleRetry = async (notification: Notification) => {
    if (!notification.reply_message) return;

    setRetrying(notification.id);
    try {
      const { data, error: emailError } = await supabase.functions.invoke("send-admin-reply", {
        body: {
          recipientEmail: notification.sender_email,
          recipientName: notification.sender_name,
          subject: notification.subject || "Your Inquiry",
          originalMessage: notification.message,
          replyMessage: notification.reply_message,
        },
      });

      if (emailError) throw emailError;

      toast.success("Email resent successfully!");
      fetchNotifications();
    } catch (error: any) {
      console.error("Error retrying email:", error);
      toast.error("Failed to resend email. Please try again.");
    } finally {
      setRetrying(null);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)));
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

  const getDeliveryStatusIcon = (notification: Notification) => {
    if (notification.status !== "replied") return null;
    
    return (
      <div className="flex items-center gap-1 text-xs text-success">
        <CheckCircle className="h-3 w-3" />
        <span>Delivered</span>
      </div>
    );
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
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setBatchDialogOpen(true)}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Reply to {selectedIds.size}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={fetchNotifications}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 && (
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
              <Checkbox
                checked={selectedIds.size === notifications.length && notifications.length > 0}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
              </span>
            </div>
          )}
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
                      className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                        notification.status === "unread"
                          ? "bg-primary/5 border-primary/20"
                          : "bg-card border-border/50"
                      } ${selectedIds.has(notification.id) ? "ring-2 ring-primary/50" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.has(notification.id)}
                          onCheckedChange={() => toggleSelect(notification.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${notification.sender_name}`}
                        />
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            if (notification.status === "unread") {
                              markAsRead(notification.id);
                            }
                          }}
                        >
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
                              loadTemplates();
                            }}
                          >
                            <Reply className="h-4 w-4" />
                          </Button>
                          {notification.status === "replied" && notification.reply_message && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetry(notification);
                              }}
                              disabled={retrying === notification.id}
                            >
                              {retrying === notification.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          )}
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
                        <div className="mt-3 pt-3 border-t border-border ml-8">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-success">
                              <Check className="h-3 w-3" />
                              Replied on {format(new Date(notification.replied_at), "MMM d, yyyy")}
                            </div>
                            {getDeliveryStatusIcon(notification)}
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

      {/* Single Reply Dialog */}
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

              {templates.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Use Template (Optional):
                  </label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your Reply:</label>
                <Textarea
                  placeholder="Type your reply... Use {{name}} for recipient's name"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => {
              setReplyDialogOpen(false);
              setSelectedTemplate("");
              setReplyMessage("");
            }}>
              Cancel
            </Button>
            <Button 
              variant="secondary"
              onClick={handlePreview}
              disabled={!replyMessage.trim()}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
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

      {/* Batch Reply Dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Send Batch Reply to {selectedIds.size} Recipients
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-2">Selected Recipients:</p>
              <div className="flex flex-wrap gap-2">
                {notifications
                  .filter(n => selectedIds.has(n.id))
                  .slice(0, 5)
                  .map(n => (
                    <Badge key={n.id} variant="secondary">{n.sender_name}</Badge>
                  ))}
                {selectedIds.size > 5 && (
                  <Badge variant="outline">+{selectedIds.size - 5} more</Badge>
                )}
              </div>
            </div>

            {templates.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Use Template (Optional):
                </label>
                <Select 
                  value={selectedTemplate} 
                  onValueChange={(value) => {
                    setSelectedTemplate(value);
                    const template = templates.find(t => t.id === value);
                    if (template) {
                      setReplyMessage(template.body);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Message ({"{{name}}"} will be replaced with each recipient&apos;s name):</label>
              <Textarea
                placeholder="Type your message... Use {{name}} for personalization"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBatchDialogOpen(false);
              setSelectedTemplate("");
              setReplyMessage("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleBatchReply} 
              disabled={!replyMessage.trim() || batchReplying}
              className="gap-2"
            >
              {batchReplying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send to {selectedIds.size} Recipients
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Email Preview
            </DialogTitle>
          </DialogHeader>
          
          {previewContent && (
            <div className="space-y-4">
              <div className="p-4 bg-card border border-border rounded-lg">
                <div className="border-b border-border pb-3 mb-3">
                  <p className="text-xs text-muted-foreground">To: {selectedNotification?.sender_email}</p>
                  <p className="text-xs text-muted-foreground">Subject: {previewContent.subject}</p>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{previewContent.body}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setPreviewDialogOpen(false);
                handleReply();
              }}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminNotificationsPanel;
