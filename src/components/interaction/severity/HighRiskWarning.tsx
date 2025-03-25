
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface HighRiskWarningProps {
  isHighRisk: boolean;
}

export function HighRiskWarning({ isHighRisk }: HighRiskWarningProps) {
  if (!isHighRisk) return null;
  
  return (
    <Alert variant="destructive" className="mt-3 mb-2 bg-red-50 border-red-200">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-600 font-medium">
        ⚠️ High-risk combination. Consult a medical professional before use.
      </AlertDescription>
    </Alert>
  );
}
