import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type UserRole = "company" | "common" | null;

interface UserRoleContextType {
  role: UserRole;
  isLoading: boolean;
  isCompany: boolean;
  refetchRole: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = async () => {
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If no role found, default to common
        if (error.code === "PGRST116") {
          setRole("common");
        } else {
          console.error("Error fetching role:", error);
          setRole("common");
        }
      } else {
        setRole(data.role as UserRole);
      }
    } catch (error) {
      console.error("Error fetching role:", error);
      setRole("common");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [user]);

  const refetchRole = async () => {
    setIsLoading(true);
    await fetchRole();
  };

  return (
    <UserRoleContext.Provider
      value={{
        role,
        isLoading,
        isCompany: role === "company",
        refetchRole,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return context;
};
