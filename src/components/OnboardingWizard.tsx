import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingWizardProps {
  adminId: string;
  onComplete: () => void;
}

const steps = [
  { id: 1, title: "Welcome", icon: Sparkles },
  { id: 2, title: "Create Passkey", icon: Key },
  { id: 3, title: "Invite Team", icon: Users },
  { id: 4, title: "Complete", icon: CheckCircle },
];

const OnboardingWizard = ({ adminId, onComplete }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [passkey, setPasskey] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdPasskey, setCreatedPasskey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCreatePasskey = async () => {
    if (!passkey.trim()) {
      toast({
        title: "Passkey Required",
        description: "Please enter a passkey to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from("passkey_settings")
        .insert({
          admin_id: adminId,
          passkey: passkey.trim(),
          is_active: true,
        });

      if (error) throw error;

      setCreatedPasskey(passkey.trim());
      toast({
        title: "Passkey Created! 🎉",
        description: "Your company passkey is ready to use.",
      });
      setCurrentStep(3);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyPasskey = () => {
    if (createdPasskey) {
      navigator.clipboard.writeText(createdPasskey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Passkey copied to clipboard.",
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-hero rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome, Company Admin! 🎉
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let's get your company set up. We'll guide you through creating your first passkey
                and inviting team members.
              </p>
            </div>
            <div className="flex justify-center pt-4">
              <Button onClick={() => setCurrentStep(2)} size="lg" className="group">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Key className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Create Your First Passkey
              </h2>
              <p className="text-muted-foreground">
                This passkey will allow team members to get company access during sign-up.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passkey" className="text-foreground">Passkey</Label>
                <Input
                  id="passkey"
                  placeholder="Enter a unique passkey (e.g., COMPANY2026)"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className="text-center text-lg font-mono"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Make it memorable but secure. Team members will use this to join.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleCreatePasskey} disabled={isCreating || !passkey.trim()}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Passkey
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-success/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Invite Your Team
              </h2>
              <p className="text-muted-foreground">
                Share this passkey with team members. They'll enter it during sign-up to get company access.
              </p>
            </div>

            {createdPasskey && (
              <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Your Passkey</p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-2xl font-mono font-bold text-foreground bg-background px-4 py-2 rounded-lg">
                    {createdPasskey}
                  </code>
                  <Button variant="ghost" size="icon" onClick={copyPasskey}>
                    {copied ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Team members use this during sign-up to join your company.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep(4)}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-success/10 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                You're All Set! 🎉
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your company is ready to go. You can manage passkeys and view team members from the Admin panel.
              </p>
            </div>
            <div className="flex justify-center pt-4">
              <Button onClick={onComplete} size="lg" className="group">
                Go to Admin Panel
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`w-2 h-2 rounded-full transition-all ${
                currentStep >= step.id
                  ? "bg-primary w-6"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
        <CardDescription>
          Step {currentStep} of {steps.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default OnboardingWizard;
