import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { InteractionResult } from "@/lib/api-utils";
import { Badge } from "@/components/ui/badge";
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { severityLabels, getSeverityIcon, getSeverityBadgeClasses } from "@/lib/utils/severity-utils";

interface CombinedInteractionCardProps {
  medications: string[];
  interactions: InteractionResult[];
  isOpen: boolean;
  onToggle: () => void;
  risk: RiskAssessmentOutput | null;
}

export function CombinedInteractionCard({ 
  medications, 
  interactions, 
  isOpen, 
  onToggle,
  risk
}: CombinedInteractionCardProps) {
  if (!medications || medications.length < 3) return null;
  
  // Determine the highest severity among all interactions
  const highestSeverity = interactions.reduce((highest, interaction) => {
    const severityOrder = { severe: 4, moderate: 3, minor: 2, unknown: 1, safe: 0 };
    return severityOrder[interaction.severity] > severityOrder[highest] ? interaction.severity : highest;
  }, "safe" as const);
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      className="rounded-xl bg-white border shadow-lg mb-6"
    >
      <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
        <span className="text-lg font-medium flex items-center gap-2">
          {getSeverityIcon(highestSeverity)} {severityLabels[highestSeverity]}: {medications.join(' + ')}
          
          {risk && (
            <Badge variant="outline" className={cn("ml-2 font-medium text-sm", getSeverityBadgeClasses(highestSeverity))}>
              {getSeverityIcon(highestSeverity)} {severityLabels[highestSeverity]}
            </Badge>
          )}
        </span>
        <ChevronDown 
          className={cn(
            "h-5 w-5 transition-transform duration-200",
            isOpen ? "transform rotate-180" : ""
          )} 
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {interactions.map((interaction, index) => (
          <div key={index} className="p-4 border-t">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {interaction.description}
              </AlertDescription>
            </Alert>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
