
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function NavHeader() {
  const { logout } = useAuth();

  return (
    <div className="absolute top-0 left-0 w-full p-4 bg-white/80 backdrop-blur-sm shadow-sm z-10">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex-shrink-0">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            VitaCheck
          </h1>
        </Link>
        
        <div className="flex gap-4 items-center">
          <Link to="/check">
            <Button variant="ghost">Interaction Checker</Button>
          </Link>
          <Link to="/experiences">
            <Button variant="ghost">Experiences</Button>
          </Link>
          <Button onClick={logout} variant="outline" size="sm" className="flex items-center gap-1">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
