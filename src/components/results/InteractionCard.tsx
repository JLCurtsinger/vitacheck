
import { useState } from "react";
import { InteractionResult } from "@/lib/api-utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { InteractionResult as InteractionComponent } from "../interaction/InteractionResult";
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";

interface InteractionCardProps {
  interaction: InteractionResult;
  id: string;
  label: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  risk: RiskAssessmentOutput | null;
}

export function InteractionCard({ interaction, id, label, isOpen, onToggle, risk }: InteractionCardProps) {
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
      key={id}
      open={isOpen} 
      onOpenChange={() => onToggle(id)}
      className="rounded-xl bg-white border shadow-lg"
    >
      <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
        <span className="text-lg font-medium flex items-center gap-2">
          {interaction.severity === "severe" && "🚨 Severe: "}
          {interaction.severity === "moderate" && "⚠️ Moderate: "}
          {interaction.severity === "minor" && "ℹ️ Minor: "}
          {interaction.severity === "safe" && "✅ Safe: "}
          {interaction.severity === "unknown" && "ℹ️ Unknown: "}
          {label}
          
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
        <InteractionComponent 
          interaction={interaction}
          key={id}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
