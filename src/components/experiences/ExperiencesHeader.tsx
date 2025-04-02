
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

interface ExperiencesHeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

export function ExperiencesHeader({ isMenuOpen, setIsMenuOpen }: ExperiencesHeaderProps) {
  return (
    <div className="absolute top-0 left-0 w-full p-4 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex-shrink-0">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            VitaCheck
          </h1>
        </Link>
        
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/check">
            <Button variant="ghost">Interaction Checker</Button>
          </Link>
          <Link to="/experiences">
            <Button variant="ghost" className="bg-white/10 text-blue-600">Experiences</Button>
          </Link>
        </div>

        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-16 right-4 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
          <Link to="/check" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
            Interaction Checker
          </Link>
          <Link to="/experiences" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-blue-600 bg-blue-50">
            Experiences
          </Link>
        </div>
      )}
    </div>
  );
}
