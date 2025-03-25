
import React, { useMemo } from "react";
import { InteractionResult } from "@/lib/api-utils";
import { processCombinedSeverity } from "@/lib/api/utils/combined-severity-utils";
import { CombinedHeader } from "./combined/CombinedHeader";
import { CombinedSeverityContainer } from "./combined/CombinedSeverityContainer";
import { CombinedSummary } from "./combined/CombinedSummary";
import { CombinedAdvice } from "./combined/CombinedAdvice";
import { prepareRiskAssessment } from "@/lib/utils/risk-assessment";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface CombinedInteractionResultProps {
  medications: string[];
  interactions: InteractionResult[];
}

export function CombinedInteractionResult({ 
  medications, 
  interactions 
}: CombinedInteractionResultProps) {
  // Process all interactions to determine overall severity, confidence, etc.
  const combinedResults = useMemo(() => {
    return processCombinedSeverity(interactions);
  }, [interactions]);
  
  // Create a risk assessment for the combined result
  const riskAssessment = useMemo(() => {
    return prepareRiskAssessment({
      severity: combinedResults.severity === "severe" ? "severe" : 
                combinedResults.severity === "moderate" ? "moderate" : "mild",
      fdaReports: { 
        signal: interactions.some(i => 
          i.sources.some(s => s.name === "FDA" && s.severity !== "safe")
        ), 
        count: interactions.reduce((total, i) => 
          total + (i.sources.find(s => s.name === "FDA")?.eventData?.totalEvents || 0), 0)
      },
      openFDA: { 
        signal: interactions.some(i => 
          i.sources.some(s => s.name === "OpenFDA Adverse Events" && s.severity !== "safe")
        ),
        count: interactions.reduce((total, i) => 
          total + (i.sources.find(s => s.name === "OpenFDA Adverse Events")?.eventData?.totalEvents || 0), 0)
      },
      suppAI: { 
        signal: interactions.some(i =>
          i.sources.some(s => s.name.includes("AI") && s.severity !== "safe")
        ) 
      },
      mechanism: { 
        plausible: interactions.some(i =>
          i.sources.some(s => s.name.includes("Mechanism") && s.severity !== "safe")
        ) 
      },
      aiLiterature: { 
        plausible: interactions.some(i =>
          i.sources.some(s => s.name.includes("Literature") && s.severity !== "safe")
        ) 
      },
      peerReports: { 
        signal: interactions.some(i =>
          i.sources.some(s => s.name.includes("Report") && s.severity !== "safe")
        ) 
      }
    });
  }, [combinedResults.severity, interactions]);

  // Determine if this is a high-risk combination
  const isHighRisk = riskAssessment.riskScore >= 70;

  return (
    <div className="p-6">
      <CombinedHeader 
        severity={combinedResults.severity}
        confidenceScore={combinedResults.confidenceScore}
        medications={medications}
        aiValidated={interactions.some(i => i.aiValidated)}
        severityFlag={riskAssessment.severityFlag}
      />
      
      {/* High Risk Warning Alert */}
      {isHighRisk && (
        <Alert variant="destructive" className="mt-1 mb-4 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600 font-medium">
            ⚠️ High-risk combination. Consult a medical professional before use.
          </AlertDescription>
        </Alert>
      )}
      
      <CombinedSummary 
        description={combinedResults.description}
        warnings={combinedResults.combinedWarnings}
      />
      
      <CombinedSeverityContainer 
        interactions={interactions}
        totalMedications={medications.length}
      />
      
      <CombinedAdvice 
        severity={combinedResults.severity} 
        medications={medications}
      />
    </div>
  );
}
