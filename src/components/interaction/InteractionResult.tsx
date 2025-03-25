
import { useState } from "react";
import { InteractionResult as InteractionResultType } from "@/lib/api-utils";
import { InteractionHeader } from "./InteractionHeader";
import { InteractionDescription } from "./InteractionDescription";
import { InteractionFooter } from "./InteractionFooter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BarChart2 } from "lucide-react";
import { RiskAssessmentModal } from "./RiskAssessmentModal";
import { prepareRiskAssessment } from "@/lib/utils/risk-assessment";

interface InteractionResultProps {
  interaction: InteractionResultType;
}

export function InteractionResult({ interaction }: InteractionResultProps) {
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  
  // Prepare risk assessment data from the interaction object
  const riskAssessment = prepareRiskAssessment({
    severity: interaction.severity === "severe" ? "severe" : 
              interaction.severity === "moderate" ? "moderate" : "mild",
    fdaReports: { 
      signal: interaction.sources.some(s => s.name === "FDA" && s.severity !== "safe"), 
      count: interaction.sources.find(s => s.name === "FDA")?.eventData?.totalEvents
    },
    openFDA: { 
      signal: interaction.sources.some(s => s.name === "OpenFDA Adverse Events" && s.severity !== "safe"),
      count: interaction.sources.find(s => s.name === "OpenFDA Adverse Events")?.eventData?.totalEvents  
    },
    suppAI: { 
      signal: interaction.sources.some(s => s.name.includes("AI") && s.severity !== "safe") 
    },
    mechanism: { 
      plausible: interaction.sources.some(s => s.name.includes("Mechanism") && s.severity !== "safe") 
    },
    aiLiterature: { 
      plausible: interaction.sources.some(s => s.name.includes("Literature") && s.severity !== "safe") 
    },
    peerReports: { 
      signal: interaction.sources.some(s => s.name.includes("Report") && s.severity !== "safe") 
    }
  });

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
      severityColorMap[interaction.severity]
    )}>
      <InteractionHeader 
        interaction={interaction} 
      />
      <InteractionDescription interaction={interaction} />
      <InteractionFooter interaction={interaction} />
      
      {/* Risk Assessment Button & Modal */}
      <div className="mt-4 flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setRiskModalOpen(true)}
        >
          <BarChart2 className="h-4 w-4" />
          <span>Overview / Why is this flagged?</span>
        </Button>
      </div>
      
      <RiskAssessmentModal
        open={riskModalOpen}
        onOpenChange={setRiskModalOpen}
        riskAssessment={riskAssessment}
      />
    </div>
  );
}
