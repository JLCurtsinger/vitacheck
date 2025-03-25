
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface HighRiskWarningProps {
  isHighRisk: boolean;
}

export function HighRiskWarning({ isHighRisk }: HighRiskWarningProps) {
  if (!isHighRisk) return null;
  
  return (
    <Alert variant="destructive" className="mb-4 bg-red-50 border-red-300">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-700">
        <strong>🚨 High Risk Interaction</strong> - This combination may cause serious adverse effects. 
        Consult a healthcare provider before taking these medications together.
      </AlertDescription>
    </Alert>
  );
}
