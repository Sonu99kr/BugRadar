import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Still checking auth status — don't redirect yet
  if (loading) {
    return <div>Loading...</div>;
  }

  // Not logged in — send to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
