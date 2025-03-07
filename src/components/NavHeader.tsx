
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function NavHeader() {
  const { logout } = useAuth();
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="absolute top-0 right-0 p-4 z-10">
      <Button 
        variant="ghost" 
        onClick={logout} 
        className="text-gray-700 hover:text-gray-900"
      >
        Log Out
      </Button>
    </div>
  );
}
