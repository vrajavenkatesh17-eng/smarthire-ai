import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NotificationBadge = () => {
  const { user } = useAuth();
  const { isCompany } = useUserRole();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user && isCompany) {
      checkAdminStatus();
    }
  }, [user, isCompany]);

  useEffect(() => {
    if (isAdmin) {
      fetchUnreadCount();
      subscribeToNotifications();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("company_admins")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!error && data) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from("admin_notifications")
        .select("*", { count: "exact", head: true })
        .eq("status", "unread");

      if (!error) {
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notification-badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notifications',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (!isAdmin) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate("/company-admin")}
          >
            <Bell className="h-5 w-5" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge 
                    variant="destructive" 
                    className="h-5 min-w-[20px] p-0 flex items-center justify-center text-xs font-bold animate-pulse"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{unreadCount > 0 ? `${unreadCount} new inquiries` : "No new inquiries"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NotificationBadge;
