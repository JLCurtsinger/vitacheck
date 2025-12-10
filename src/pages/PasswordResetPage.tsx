import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswordResetPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const { session, updatePassword, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for session on mount
    const checkSession = async () => {
      setIsCheckingSession(true);
      // Check both AuthContext session and directly query Supabase
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      if (session || supabaseSession) {
        setHasSession(true);
      } else {
        setHasSession(false);
      }
      setIsCheckingSession(false);
    };
    checkSession();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validate minimum length
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      await updatePassword(newPassword);
      setSuccess(true);
      // Auto-navigate after a short delay
      setTimeout(() => {
        navigate("/check");
      }, 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please try again.");
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Checking reset link...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6 text-center">
            This password reset link is invalid or has expired.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-center text-green-600">Password Updated</h2>
          <p className="text-gray-600 mb-6 text-center">
            Your password has been updated. You can now sign in.
          </p>
          <Button
            onClick={() => navigate("/check")}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1"
              placeholder="••••••••"
              aria-label="New password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1"
              placeholder="••••••••"
              aria-label="Confirm password"
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
          >
            {isLoading ? "Updating password..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

