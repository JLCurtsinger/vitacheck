
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Hero() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="relative bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                VitaCheck
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/check">
                <Button variant="ghost">Interaction Checker</Button>
              </Link>
              <Link to="/experiences">
                <Button variant="ghost">Experiences</Button>
              </Link>
            </div>

            {/* Mobile Navigation Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  to="/check"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  Interaction Checker
                </Link>
                <Link
                  to="/experiences"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  Experiences
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative pt-16">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
        
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-10 pb-24 sm:pb-32">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Check medication interactions safely
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Quickly verify potential interactions between your medications and supplements. Free, simple, and confidential.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/check">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Check Interactions
                </Button>
              </Link>
              <Link to="/experiences">
                <Button variant="outline" size="lg">
                  View Experiences
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
