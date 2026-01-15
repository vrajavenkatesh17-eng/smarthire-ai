import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { UserRoleProvider } from "@/hooks/useUserRole";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import ResumeHistory from "./pages/ResumeHistory";
import JobMatching from "./pages/JobMatching";
import CandidateComparison from "./pages/CandidateComparison";
import TalentPipeline from "./pages/TalentPipeline";
import Interviews from "./pages/Interviews";
import Teams from "./pages/Teams";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Creators from "./pages/Creators";
import CompanyAdmin from "./pages/CompanyAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <UserRoleProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                {/* Common user routes - accessible to all authenticated users */}
                <Route path="/resume-analyzer" element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
                <Route path="/resume-history" element={<ProtectedRoute><ResumeHistory /></ProtectedRoute>} />
                {/* Company-only routes */}
                <Route path="/dashboard" element={<ProtectedRoute><RoleProtectedRoute><Dashboard /></RoleProtectedRoute></ProtectedRoute>} />
                <Route path="/job-matching" element={<ProtectedRoute><RoleProtectedRoute><JobMatching /></RoleProtectedRoute></ProtectedRoute>} />
                <Route path="/compare-candidates" element={<ProtectedRoute><RoleProtectedRoute><CandidateComparison /></RoleProtectedRoute></ProtectedRoute>} />
                <Route path="/talent-pipeline" element={<ProtectedRoute><RoleProtectedRoute><TalentPipeline /></RoleProtectedRoute></ProtectedRoute>} />
                <Route path="/interviews" element={<ProtectedRoute><RoleProtectedRoute><Interviews /></RoleProtectedRoute></ProtectedRoute>} />
                <Route path="/teams" element={<ProtectedRoute><RoleProtectedRoute><Teams /></RoleProtectedRoute></ProtectedRoute>} />
                <Route path="/company-admin" element={<ProtectedRoute><RoleProtectedRoute><CompanyAdmin /></RoleProtectedRoute></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/creators" element={<Creators />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </UserRoleProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
