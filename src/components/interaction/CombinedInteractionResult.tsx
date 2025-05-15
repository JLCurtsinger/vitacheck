
import React, { useState, useEffect } from 'react';
import { InteractionResult } from '@/lib/api-utils';
import { RiskAssessmentOutput } from '@/lib/utils/risk-assessment/types';
import { getInteractionRisk } from '../results/utils/risk-utils';
import { RiskAssessmentButton } from './risk/RiskAssessmentButton';
import { RiskAssessmentModal } from './RiskAssessmentModal';
import { CombinedHeader } from './combined/CombinedHeader';

interface CombinedInteractionResultProps {
  interaction: InteractionResult;
}

export function CombinedInteractionResult({ interaction }: CombinedInteractionResultProps) {
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [isRiskLoading, setIsRiskLoading] = useState(true);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentOutput | null>(null);
  
  useEffect(() => {
    // Load risk assessment data when the component mounts
    let isMounted = true;
    
    async function loadRiskData() {
      if (!interaction) return;
      
      try {
        setIsRiskLoading(true);
        // Get risk assessment for this interaction
        const risk = await getInteractionRisk(interaction as any);
        
        // Only update state if the component is still mounted
        if (isMounted) {
          setRiskAssessment(risk);
        }
      } catch (error) {
        console.error("Error loading risk assessment:", error);
      } finally {
        if (isMounted) {
          setIsRiskLoading(false);
        }
      }
    }
    
    loadRiskData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [interaction]);
  
  // Don't display anything until interaction data is loaded
  if (!interaction) {
    return null;
  }
  
  // Extract necessary data from the interaction
  const { medications, severity } = interaction;
  
  // Get severity flag from risk assessment if available, otherwise determine based on severity
  const severityFlag = riskAssessment?.severityFlag || (
    severity === "severe" ? "🔴" : 
    severity === "moderate" ? "🟡" : 
    severity === "minor" ? "🟡" : 
    severity === "safe" ? "🟢" : "🟡"
  );
  
  return (
    <div className="border rounded-lg p-4 mb-4 shadow-sm">
      <CombinedHeader 
        severity={interaction.severity}
        confidenceScore={interaction.confidenceScore ?? 0}
        medications={interaction.medications}
        aiValidated={interaction.aiValidated ?? false}
        severityFlag={severityFlag}
      />
      
      <RiskAssessmentButton onClick={() => setShowRiskModal(true)} />
      
      {showRiskModal && riskAssessment && (
        <RiskAssessmentModal 
          open={showRiskModal}
          onOpenChange={setShowRiskModal}
          riskAssessment={riskAssessment}
          medications={medications}
          isLoading={isRiskLoading}
        />
      )}
    </div>
  );
}
