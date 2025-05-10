
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SeverityDisclaimerProps {
  show: boolean;
}

export function SeverityDisclaimer({ show }: SeverityDisclaimerProps) {
  if (!show) return null;

  return (
    <Alert className="mb-4 bg-yellow-50 border-yellow-300">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <strong className="font-medium">Why This Is Marked Severe</strong>
        <p className="mt-1">
          This combination is statistically classified as high risk (e.g. based on adverse event data), 
          but most descriptions indicate mild effects. This warning reflects reported case severity, 
          not necessarily the typical clinical experience. Use caution and consult a provider if unsure.
        </p>
      </AlertDescription>
    </Alert>
  );
}
