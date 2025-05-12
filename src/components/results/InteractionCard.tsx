import { useState } from "react";
import { InteractionResult } from "@/lib/api-utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { InteractionResult as InteractionComponent } from "../interaction/InteractionResult";
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";
import { severityLabels, getSeverityIcon, getSeverityBadgeClasses } from "@/lib/utils/severity-utils";

interface InteractionCardProps {
  interaction: InteractionResult;
  id: string;
  label: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  risk: RiskAssessmentOutput | null;
}

export function InteractionCard({ interaction, id, label, isOpen, onToggle, risk }: InteractionCardProps) {
  return (
    <Collapsible 
      key={id}
      open={isOpen} 
      onOpenChange={() => onToggle(id)}
      className="rounded-xl bg-white border shadow-lg"
    >
      <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
        <span className="text-lg font-medium flex items-center gap-2">
          {getSeverityIcon(interaction.severity)} {severityLabels[interaction.severity]}: {label}
          
          {risk && (
            <Badge variant="outline" className={cn("ml-2 font-medium text-sm", getSeverityBadgeClasses(interaction.severity))}>
              {getSeverityIcon(interaction.severity)} {severityLabels[interaction.severity]}
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
        <InteractionComponent 
          interaction={interaction}
          key={id}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
