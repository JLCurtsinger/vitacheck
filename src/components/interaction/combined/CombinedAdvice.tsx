
import { cn } from "@/lib/utils";

interface CombinedAdviceProps {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
}

export function CombinedAdvice({ severity }: CombinedAdviceProps) {
  return (
    <div className="mt-6">
      <div className={cn(
        "p-3 rounded-lg text-sm font-medium",
        severity === "severe" ? "bg-red-50/60 text-red-700" : 
        severity === "moderate" || severity === "minor" ? "bg-yellow-50/60 text-yellow-700" : 
        "bg-gray-50/60 text-gray-700"
      )}>
        {severity === "unknown"
          ? "Insufficient data available about all these medications together. Review individual interactions and consult your healthcare provider."
          : severity === "severe"
          ? "DO NOT take all these medications together without explicit approval from your healthcare provider."
          : severity === "moderate" || severity === "minor" 
          ? "Use caution when taking all these medications together. Monitor for side effects and consult your healthcare provider if concerned."
          : "No significant interactions detected when taking all these medications together. As always, follow prescription directions."}
      </div>
    </div>
  );
}
