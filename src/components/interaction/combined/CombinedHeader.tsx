
import { SeverityIndicator } from "../SeverityIndicator";
import { SeverityBadge } from "../severity/SeverityBadge";
import { SeverityIcon } from "../severity/SeverityIcon";
import { SeverityTitle } from "../severity/SeverityTitle";

interface CombinedHeaderProps {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  confidenceScore: number;
  medications: string[];
  aiValidated: boolean;
  severityFlag?: '🔴' | '🟡' | '🟢';
}

export function CombinedHeader({ 
  severity, 
  confidenceScore, 
  medications, 
  aiValidated,
  severityFlag
}: CombinedHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b">
      <div className="flex items-center gap-2">
        <SeverityIndicator 
          severity={severity} 
          confidenceScore={confidenceScore}
          aiValidated={aiValidated}
        />
        <SeverityTitle severity={severity} medications={medications} />
      </div>
      <div className="flex items-center gap-2">
        <SeverityBadge severityFlag={severityFlag} />
        <SeverityIcon severity={severity} />
      </div>
    </div>
  );
}
