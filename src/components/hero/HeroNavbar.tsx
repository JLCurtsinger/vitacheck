import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface HeroNavbarProps {
  scrollToTop: () => void;
}

export default function HeroNavbar({ scrollToTop }: HeroNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full p-4">
      <div className="flex justify-between items-center">
        <Link to="/" onClick={scrollToTop} className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text hover:opacity-80 transition-opacity duration-300">
          Vitacheck
        </Link>
        
        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isMenuOpen && (
        <div className="absolute top-16 right-4 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
          <Link 
            to="/experiences" 
            onClick={() => {
              setIsMenuOpen(false);
              scrollToTop();
            }} 
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Experiences
          </Link>
          {isAuthenticated ? (
            <>
              <Link 
                to="/dashboard" 
                onClick={() => setIsMenuOpen(false)} 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Account
              </Link>
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  handleSignOut();
                }} 
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/signin" 
                onClick={() => setIsMenuOpen(false)} 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                onClick={() => setIsMenuOpen(false)} 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
