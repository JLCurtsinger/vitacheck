import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always set authenticated to true to bypass login requirements
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Keep these functions in case they're needed in the future,
  // but they won't affect the authentication state anymore
  const login = (email: string, password: string): boolean => {
    // Always return true to simulate successful login
    return true;
  };

  const logout = () => {
    // Do nothing - we want users to always be "logged in"
    console.log("Logout requested but ignored - authentication is bypassed");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
