
import { cn } from "@/lib/utils";

interface CombinedSummaryProps {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  warnings: string[];
}

export function CombinedSummary({ severity, description, warnings }: CombinedSummaryProps) {
  return (
    <div className={cn(
      "p-4 mb-6 rounded-lg border",
      severity === "severe" ? "bg-red-50/60 border-red-200" : 
      severity === "moderate" ? "bg-yellow-50/70 border-yellow-300" :
      severity === "minor" ? "bg-yellow-50/60 border-yellow-200" : 
      severity === "safe" ? "bg-green-50/60 border-green-200" : 
      "bg-gray-50/60 border-gray-200"
    )}>
      <h3 className={cn(
        "text-base font-semibold mb-3 pb-2 border-b flex items-center gap-2",
        severity === "severe" ? "text-red-700 border-red-200" : 
        severity === "moderate" ? "text-yellow-700 border-yellow-300" :
        severity === "minor" ? "text-yellow-600 border-yellow-200" : 
        severity === "safe" ? "text-green-700 border-green-200" : 
        "text-gray-700 border-gray-200"
      )}>
        Combined Interaction Analysis
      </h3>
      
      <div className="space-y-3">
        <p className="text-gray-800">
          {description}
        </p>
        
        {warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-800">Key Warnings:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="text-gray-700">{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
