
import { useAuth } from "@/contexts/AuthContext";
import NavHeader from "./NavHeader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // No more authentication check or redirect logic
  return (
    <>
      <NavHeader />
      {children}
    </>
  );
}
