
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function NavHeader() {
  const { logout } = useAuth();
  
  return (
    <div className="flex justify-end p-4 z-10">
      <Button 
        variant="ghost" 
        onClick={logout} 
        className="text-gray-700 hover:text-gray-900 ml-auto"
        size="sm"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Log Out
      </Button>
    </div>
  );
}
