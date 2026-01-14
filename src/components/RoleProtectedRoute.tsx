import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "company" | "common";
}

export const RoleProtectedRoute = ({ children, requiredRole = "company" }: RoleProtectedRouteProps) => {
  const { role, isLoading, isCompany } = useUserRole();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If company role required and user is not company, redirect to resume analyzer
  if (requiredRole === "company" && !isCompany) {
    return <Navigate to="/resume-analyzer" state={{ from: location, accessDenied: true }} replace />;
  }

  return <>{children}</>;
};
