
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

interface SeverityIconProps {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
}

export function SeverityIcon({ severity }: SeverityIconProps) {
  switch (severity) {
    case "severe":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "moderate":
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case "minor":
      return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    case "safe":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "unknown":
    default:
      return <Info className="h-5 w-5 text-gray-500" />;
  }
}
