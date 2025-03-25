
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CombinedInteractionResult } from "../interaction/CombinedInteractionResult";
import { InteractionResult } from "@/lib/api-utils";
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";

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
  // Get badge color based on severity flag
  const getBadgeClass = (severityFlag: '🔴' | '🟡' | '🟢') => {
    switch (severityFlag) {
      case "🔴": return "bg-red-100 text-red-800 border-red-200";
      case "🟡": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "🟢": return "bg-green-100 text-green-800 border-green-200";
      default: return "";
    }
  };
  
  // Get risk text based on severity flag
  const getRiskText = (severityFlag: '🔴' | '🟡' | '🟢') => {
    switch (severityFlag) {
      case "🔴": return "High Risk";
      case "🟡": return "Moderate Risk";
      case "🟢": return "No Known Risk";
      default: return "";
    }
  };

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={onToggle}
      className="rounded-xl bg-white border shadow-lg"
    >
      <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
        <span className="text-lg font-medium flex items-center gap-2">
          🔍 Combined Interaction: {medications?.join(' + ')}
          {risk && (
            <Badge variant="outline" className={cn("ml-2 font-medium text-sm", getBadgeClass(risk.severityFlag))}>
              {risk.severityFlag} {getRiskText(risk.severityFlag)}
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
      <CollapsibleContent className="px-1">
        <CombinedInteractionResult 
          medications={medications || []} 
          interactions={interactions}
          key={`combined-${medications?.sort().join('-')}`}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
