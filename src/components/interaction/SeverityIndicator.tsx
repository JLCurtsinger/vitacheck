import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface SeverityIndicatorProps {
  severity: "safe" | "minor" | "severe" | "unknown";
}

export function SeverityIndicator({ severity }: SeverityIndicatorProps) {
  const getSeverityColor = (severity: "safe" | "minor" | "severe" | "unknown") => {
    switch (severity) {
      case "safe":
        return "text-green-500";
      case "minor":
        return "text-yellow-500";
      case "severe":
        return "text-red-500";
      case "unknown":
        return "text-gray-400";
    }
  };

  const getSeverityIcon = (severity: "safe" | "minor" | "severe" | "unknown") => {
    const className = "h-6 w-6";
    switch (severity) {
      case "safe":
        return <CheckCircle className={className} />;
      case "minor":
        return <AlertTriangle className={className} />;
      case "severe":
        return <XCircle className={className} />;
      case "unknown":
        return <HelpCircle className={className} />;
    }
  };

  const getSeverityText = (severity: "safe" | "minor" | "severe" | "unknown") => {
    switch (severity) {
      case "safe":
        return "Safe to take together";
      case "minor":
        return "Minor interaction possible";
      case "severe":
        return "Severe interaction risk";
      case "unknown":
        return "Interaction status unknown";
    }
  };

  return (
    <span className={getSeverityColor(severity)}>
      {getSeverityIcon(severity)}
      <span className="sr-only">{getSeverityText(severity)}</span>
    </span>
  );
}