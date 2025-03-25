
import { cn } from "@/lib/utils";

interface SeverityTitleProps {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  medications: string[];
}

export function SeverityTitle({ severity, medications }: SeverityTitleProps) {
  const medicationNames = medications.join(" + ");
  
  const getSeverityClass = () => {
    switch (severity) {
      case "severe":
        return "text-red-600";
      case "moderate":
        return "text-yellow-600";
      case "minor":
        return "text-yellow-500";
      case "safe":
        return "text-green-600";
      case "unknown":
      default:
        return "text-gray-600";
    }
  };
  
  const getSeverityTitle = () => {
    switch (severity) {
      case "severe":
        return `🚨 Severe Interaction: ${medicationNames}`;
      case "moderate":
        return `⚠️ Moderate Interaction: ${medicationNames}`;
      case "minor":
        return `ℹ️ Minor Interaction: ${medicationNames}`;
      case "safe":
        return `✅ Safe Combination: ${medicationNames}`;
      case "unknown":
      default:
        return `ℹ️ Unknown Interaction: ${medicationNames}`;
    }
  };

  return (
    <h4 className={cn("font-semibold text-lg", getSeverityClass())}>
      {getSeverityTitle()}
    </h4>
  );
}
