import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { severityLabels, getSeverityTextClasses, getSeverityIcon } from "@/lib/utils/severity-utils";

interface SeverityIndicatorProps {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  confidenceScore?: number;
  aiValidated?: boolean;
}

export function SeverityIndicator({ severity, confidenceScore, aiValidated }: SeverityIndicatorProps) {
  const getConfidenceLabel = (score?: number) => {
    if (score === undefined) return "";
    
    if (score >= 90) return "Very High Confidence";
    if (score >= 75) return "High Confidence";
    if (score >= 50) return "Medium Confidence";
    if (score >= 25) return "Low Confidence";
    return "Very Low Confidence";
  };

  return (
    <div className="flex items-center gap-2">
      <span className={getSeverityTextClasses(severity)}>
        {getSeverityIcon(severity)} {severityLabels[severity]}
      </span>
      {confidenceScore !== undefined && (
        <span className="text-sm text-gray-600">
          • {getConfidenceLabel(confidenceScore)}
        </span>
      )}
      {aiValidated && (
        <span className="text-sm text-blue-600">
          • AI Validated
        </span>
      )}
    </div>
  );
}
