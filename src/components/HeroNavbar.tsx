import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { SignInModal } from "./SignInModal";

export function HeroNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleSignIn = () => {
    console.log('[handleSignIn] clicked');
    setIsMenuOpen(false);
    setIsSignInModalOpen(true);
    console.log('[handleSignIn] setIsSignInModalOpen(true)');
  };

  const handleDashboard = () => {
    setIsMenuOpen(false);
    router.push("/dashboard");
  };

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">Vitacheck</span>
              </div>
            </div>

            {/* Desktop menu */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              <Button type="button" variant="ghost" onClick={() => router.push("/experiences")}>
                Experiences
              </Button>
              {isAuthenticated ? (
                <>
                  <Button type="button" variant="ghost" onClick={handleDashboard}>
                    Dashboard
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleLogout}>
                    Sign Out
                  </Button>
                  {user?.email && (
                    <span className="text-sm text-gray-500">
                      {user.email}
                    </span>
                  )}
                </>
              ) : (
                <Button type="button" variant="ghost" onClick={handleSignIn}>
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/experiences");
                }}
              >
                Experiences
              </Button>
              {isAuthenticated ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleDashboard}
                  >
                    Dashboard
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                  {user?.email && (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      {user.email}
                    </div>
                  )}
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleSignIn}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </>
  );
} 