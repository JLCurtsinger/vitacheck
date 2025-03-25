
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";

interface RiskAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskAssessment: RiskAssessmentOutput;
}

export function RiskAssessmentModal({ 
  open, 
  onOpenChange,
  riskAssessment 
}: RiskAssessmentModalProps) {
  // Get color based on risk score
  const getColorClass = (score: number) => {
    if (score >= 70) return "bg-red-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  // Get text color based on risk score
  const getTextColorClass = (score: number) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {riskAssessment.severityFlag} Risk Assessment
          </DialogTitle>
          <DialogDescription>
            Detailed analysis of the potential interaction risk
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Risk Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Risk Score:</h3>
              <span className={`font-bold text-lg ${getTextColorClass(riskAssessment.riskScore)}`}>
                {riskAssessment.riskScore}/100
              </span>
            </div>
            <Progress
              value={riskAssessment.riskScore}
              className="h-3 w-full"
              indicatorClassName={getColorClass(riskAssessment.riskScore)}
            />
            <p className="text-sm text-gray-500">
              {riskAssessment.riskScore >= 70 
                ? "High risk - requires medical attention" 
                : riskAssessment.riskScore >= 40 
                ? "Moderate risk - caution advised"
                : "Low risk - generally considered safe"}
            </p>
          </div>
          
          {/* Factors Considered */}
          <div>
            <h3 className="font-medium mb-2">Risk Factors:</h3>
            {riskAssessment.adjustments.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {riskAssessment.adjustments.map((adjustment, index) => (
                  <li key={index} className="text-sm">
                    {adjustment}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No specific risk factors identified.
              </p>
            )}
          </div>
          
          {/* Avoidance Strategy */}
          {riskAssessment.avoidanceStrategy && (
            <div>
              <h3 className="font-medium mb-2">Recommended Action:</h3>
              <p className="text-sm border-l-2 border-blue-400 pl-3 py-1 bg-blue-50 rounded-r">
                {riskAssessment.avoidanceStrategy}
              </p>
            </div>
          )}
          
          {/* Disclaimer */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>
              This risk assessment is based on available data and should not replace professional medical advice.
              Always consult with your healthcare provider before making medication decisions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
