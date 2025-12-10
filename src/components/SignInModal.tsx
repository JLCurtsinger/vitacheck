import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalMode = 'signin' | 'signup' | 'reset';

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [mode, setMode] = useState<ModalMode>('signin');
  const { signIn, signUp, resetPassword, isLoading, error: authError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = mode === 'signup' ? (formData.get('full_name') as string) : undefined;

    try {
      if (mode === 'reset') {
        await resetPassword(email);
        setSuccessMessage("If an account exists for this email, a password reset link has been sent.");
      } else if (mode === 'signup') {
        await signUp(email, password, fullName);
        // Only show success if no error was thrown
        setSuccessMessage("Check your email for the confirmation link!");
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (err: any) {
      // Check for duplicate email error
      if (mode === 'signup' && err?.code === 'user_already_registered') {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (mode === 'signup' && (
        err?.message?.toLowerCase().includes('already been registered') ||
        err?.message?.toLowerCase().includes('already registered')
      )) {
        setError("An account with this email already exists. Please sign in instead.");
      } else {
        setError(err?.message || "Something went wrong during sign up.");
      }
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && formRef.current) {
      formRef.current.reset();
      setError(null);
      setSuccessMessage(null);
      setMode('signin');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`sm:max-w-[425px] p-0 bg-transparent border-none transition-opacity duration-200 ${
          !isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {mode === 'reset' ? "Reset Password" : mode === 'signup' ? "Create an Account" : "Sign In"}
          </h2>
          <form 
            ref={formRef}
            onSubmit={handleSubmit} 
            autoComplete="on" 
            className="space-y-4"
            method="post"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1"
                placeholder="you@example.com"
                aria-label="Email address"
              />
            </div>
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  className="mt-1"
                  placeholder="John Doe"
                  aria-label="Full name"
                />
              </div>
            )}
            {mode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  className="mt-1"
                  placeholder="••••••••"
                  aria-label="Password"
                />
              </div>
            )}
            {mode === 'signin' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-sm text-blue-600 hover:text-purple-700"
                >
                  Forgot password?
                </button>
              </div>
            )}
            {(error || authError) && (
              <div className="text-red-500 text-sm">{error || authError}</div>
            )}
            {successMessage && (
              <div className="text-green-600 text-sm">{successMessage}</div>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
            >
              {isLoading 
                ? (mode === 'reset' ? "Sending reset link..." : mode === 'signup' ? "Creating account..." : "Signing in...") 
                : (mode === 'reset' ? "Send Reset Link" : mode === 'signup' ? "Create Account" : "Sign In")}
            </Button>

            <div className="text-center text-sm">
              {mode === 'reset' ? (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-blue-600 hover:text-purple-700"
                >
                  Back to sign in
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                  className="text-blue-600 hover:text-purple-700"
                >
                  {mode === 'signup' 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"}
                </button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 