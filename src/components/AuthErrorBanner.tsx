import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, LogOut, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface AuthErrorBannerProps {
  error: string | null;
  onRetry?: () => void;
  onClear?: () => void;
}

const AuthErrorBanner = ({ error, onRetry, onClear }: AuthErrorBannerProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const isAuthError =
    error?.toLowerCase().includes("auth") ||
    error?.toLowerCase().includes("sign in") ||
    error?.toLowerCase().includes("session") ||
    error?.toLowerCase().includes("jwt") ||
    error?.toLowerCase().includes("401");

  if (!error || !isAuthError) return null;

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
      
      if (data.session) {
        toast({
          title: "Session Refreshed",
          description: "Your session has been refreshed. Please try again.",
        });
        onClear?.();
        onRetry?.();
      } else {
        throw new Error("No session after refresh");
      }
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh your session. Please sign out and sign back in.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      onClear?.();
      toast({
        title: "Signed Out",
        description: "Please sign back in to continue.",
      });
    } catch (err) {
      toast({
        title: "Sign Out Failed",
        description: "Could not sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-destructive text-sm">
              Authentication Error
            </h4>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshToken}
                    disabled={isRefreshing}
                    className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    {isRefreshing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Refresh Session
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    {isSigningOut ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    Sign Out & Retry
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthErrorBanner;
