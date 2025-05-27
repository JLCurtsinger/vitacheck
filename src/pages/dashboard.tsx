import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to your Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {user?.email ? `Signed in as ${user.email}` : "Welcome back!"}
            </p>
            <p className="mt-4 text-gray-600">
              This is your personal dashboard. More features coming soon!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 