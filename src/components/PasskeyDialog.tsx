import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Loader2, Key, Building2 } from "lucide-react";

interface PasskeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PasskeyDialog = ({ open, onOpenChange }: PasskeyDialogProps) => {
  const [passkey, setPasskey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { refetchRole } = useUserRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !passkey.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-passkey", {
        body: { passkey: passkey.trim() },
      });

      if (error) throw error;

      if (data.valid) {
        // Update user role to company
        const { error: updateError } = await supabase
          .from("user_roles")
          .upsert({
            user_id: user.id,
            role: "company" as const,
          }, {
            onConflict: "user_id",
          });

        if (updateError) throw updateError;

        await refetchRole();
        toast.success("Welcome to Company access! All features unlocked.");
        onOpenChange(false);
        setPasskey("");
      } else {
        toast.error("Invalid passkey. Please try again.");
      }
    } catch (error: any) {
      console.error("Passkey validation error:", error);
      toast.error(error.message || "Failed to validate passkey");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Upgrade to Company Access
          </DialogTitle>
          <DialogDescription>
            Enter your company passkey to unlock all features including talent pipeline, 
            job matching, candidate comparison, interviews, and team collaboration.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passkey">Company Passkey</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="passkey"
                type="password"
                placeholder="Enter your passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="pl-10"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !passkey.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validate
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
