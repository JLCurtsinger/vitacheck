
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CombinedSeverityContainerProps {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  children: ReactNode;
}

export function CombinedSeverityContainer({ severity, children }: CombinedSeverityContainerProps) {
  const severityColorMap = {
    "severe": "border-red-200 bg-red-50/30",
    "moderate": "border-yellow-300 bg-yellow-50/40",
    "minor": "border-yellow-200 bg-yellow-50/30",
    "unknown": "border-gray-200",
    "safe": "border-green-200 bg-green-50/30"
  };

  return (
    <div className={cn(
      "p-6 transition-transform hover:scale-[1.01]",
      severityColorMap[severity]
    )}>
      {children}
    </div>
  );
}
