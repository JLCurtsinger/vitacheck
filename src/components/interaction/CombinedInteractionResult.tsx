
import React, { useState, useEffect } from 'react';
import { SeverityBadge } from './severity/SeverityBadge';
import { CombinationResult } from '@/lib/api/types';
import { RiskAssessmentOutput } from '@/lib/utils/risk-assessment/types';
import { getInteractionRisk } from '../results/utils/risk-utils';
import { RiskAssessmentButton } from './risk/RiskAssessmentButton';
import { RiskAssessmentModal } from './RiskAssessmentModal';

interface CombinedInteractionResultProps {
  interaction: CombinationResult;
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
        const risk = await getInteractionRisk(interaction);
        
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
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <div className="mt-0.5">
            <SeverityBadge severityFlag={severityFlag} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {medications.join(" + ")}
            </h3>
            <p className="text-sm text-gray-500">
              Combined Safety Assessment
            </p>
          </div>
        </div>
      </div>
      
      <RiskAssessmentButton onClick={() => setShowRiskModal(true)} />
      
      {/* Risk Assessment Modal */}
      {showRiskModal && riskAssessment && (
        <RiskAssessmentModal 
          isOpen={showRiskModal}
          onClose={() => setShowRiskModal(false)}
          riskAssessment={riskAssessment}
          medications={medications}
          isLoading={isRiskLoading}
        />
      )}
    </div>
  );
}
