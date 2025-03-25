
import { cn } from "@/lib/utils";
import { AlertTriangle, FileText } from "lucide-react";

interface CombinedSummaryProps {
  description: string;
  warnings: string[];
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
}

export function CombinedSummary({ description, warnings, severity }: CombinedSummaryProps) {
  // Only show warnings for non-safe interactions
  const hasWarnings = warnings.length > 0 && severity !== "safe";
  
  // Get appropriate styling based on severity
  const getSeverityClass = () => {
    switch (severity) {
      case "severe":
        return "bg-red-50/80 border-red-200";
      case "moderate":
        return "bg-yellow-50/80 border-yellow-300";
      case "minor":
        return "bg-yellow-50/60 border-yellow-200";
      case "safe":
        return "bg-green-50/60 border-green-200";
      default:
        return "bg-gray-50/60 border-gray-200";
    }
  };
  
  // Get text color based on severity
  const getTextColorClass = () => {
    switch (severity) {
      case "severe":
        return "text-red-700";
      case "moderate":
        return "text-yellow-700";
      case "minor":
        return "text-yellow-600";
      case "safe":
        return "text-green-700";
      default:
        return "text-gray-700";
    }
  };

  return (
    <div className={cn(
      "p-4 rounded-lg border mb-6",
      getSeverityClass()
    )}>
      <h3 className={cn(
        "text-base font-semibold mb-3 pb-2 border-b flex items-center gap-2",
        getTextColorClass(),
        severity === "severe" ? "border-red-200" : 
        severity === "moderate" ? "border-yellow-300" :
        severity === "minor" ? "border-yellow-200" : 
        severity === "safe" ? "border-green-200" : 
        "border-gray-200"
      )}>
        {(severity === "severe" || severity === "moderate") && <AlertTriangle className="h-5 w-5" />}
        {severity === "minor" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
        {severity === "safe" && <FileText className="h-5 w-5" />}
        Combined Analysis
      </h3>
      
      <div className="space-y-3">
        <p className={getTextColorClass()}>
          {description || "No specific information available for this combination."}
        </p>
        
        {hasWarnings && (
          <div className="mt-4">
            <h4 className={cn("font-medium mb-2", getTextColorClass())}>
              Important Warnings:
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className={getTextColorClass()}>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
