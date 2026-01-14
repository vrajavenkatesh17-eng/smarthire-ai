import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface EmailLog {
  id: string;
  candidate_name: string;
  candidate_email: string;
  email_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface EmailLogsListProps {
  candidateId?: string;
  limit?: number;
}

const emailTypeLabels: Record<string, string> = {
  rejection: "Rejection",
  offer: "Offer Letter",
  interview_confirmation: "Interview Confirmation",
  follow_up: "Follow-up",
};

export const EmailLogsList = ({ candidateId, limit = 10 }: EmailLogsListProps) => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchLogs = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from("email_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (candidateId) {
        query = query.eq("candidate_id", candidateId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data as EmailLog[]) || []);
    } catch (error) {
      console.error("Failed to fetch email logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user, candidateId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">Sent</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No emails sent yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email History
        </h3>
        <Button variant="ghost" size="sm" onClick={fetchLogs}>
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-secondary/30 rounded-lg p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  {getStatusIcon(log.status)}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{log.candidate_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.candidate_email}
                    </p>
                  </div>
                </div>
                {getStatusBadge(log.status)}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{emailTypeLabels[log.email_type] || log.email_type}</span>
                <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
              </div>
              {log.error_message && (
                <p className="text-xs text-destructive mt-1 truncate">
                  Error: {log.error_message}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};