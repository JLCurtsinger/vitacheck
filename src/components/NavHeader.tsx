
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function NavHeader() {
  const { logout } = useAuth();
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="hidden md:block">
      {/* Only show this version on medium screens and up */}
      <Button 
        variant="ghost" 
        onClick={logout} 
        className="text-gray-700 hover:text-gray-900 flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Log Out
      </Button>
    </div>
  );
}
