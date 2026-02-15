import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean; // New optional prop
}

export const ProtectedRoute = ({
  children,
  adminOnly,
}: ProtectedRouteProps) => {
  const { user } = useAuth();

  // 1. Not logged in? Go to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // 2. Trying to access admin page but not an ADMIN? Redirect to dashboard
  // This enforces the "Admins can manage everything" rule
  if (adminOnly && user.role !== "ADMIN") {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};
