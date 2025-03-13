
import { CheckCircle } from "lucide-react";

interface SafeCombinationProps {
  isSafe: boolean;
  hasAdverseEvents: boolean;
}

export function SafeCombination({ isSafe, hasAdverseEvents }: SafeCombinationProps) {
  if (!isSafe || hasAdverseEvents) return null;
  
  return (
    <div className="mt-4 p-3 bg-green-50/60 border border-green-200 rounded-md">
      <div className="flex items-center gap-2 text-green-700">
        <CheckCircle className="h-4 w-4" />
        <p className="font-medium">No significant adverse events reported for this combination.</p>
      </div>
    </div>
  );
}
