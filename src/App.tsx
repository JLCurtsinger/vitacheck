
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Check from "./pages/Check";
import Results from "./pages/Results";
import Experiences from "./pages/Experiences";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import ToggleAnimationButton from "./components/animation/ToggleAnimationButton";
import TracerAnimation from "./components/animation/TracerAnimation";
import { useAnimation } from "./hooks/use-animation";

const queryClient = new QueryClient();

const App = () => {
  const { isAnimationEnabled, toggleAnimation } = useAnimation();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <TracerAnimation isEnabled={isAnimationEnabled} />
          <ToggleAnimationButton
            isEnabled={isAnimationEnabled}
            onToggle={toggleAnimation}
          />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/check" element={
                <ProtectedRoute>
                  <Check />
                </ProtectedRoute>
              } />
              <Route path="/results" element={
                <ProtectedRoute>
                  <Results />
                </ProtectedRoute>
              } />
              <Route path="/experiences" element={
                <ProtectedRoute>
                  <Experiences />
                </ProtectedRoute>
              } />
              <Route path="/privacy-policy" element={
                <ProtectedRoute>
                  <PrivacyPolicy />
                </ProtectedRoute>
              } />
              <Route path="/terms-and-conditions" element={
                <ProtectedRoute>
                  <TermsAndConditions />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
