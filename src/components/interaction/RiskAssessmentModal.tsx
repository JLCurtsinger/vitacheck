
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { RiskAssessmentOutput } from '@/lib/utils/risk-assessment/types';

interface RiskAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskAssessment: RiskAssessmentOutput;
  medications: string[];
  isLoading?: boolean;
}

export function RiskAssessmentModal({
  isOpen,
  onClose,
  riskAssessment,
  medications,
  isLoading = false
}: RiskAssessmentModalProps) {
  // If still loading, show skeleton UI
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Risk Assessment</DialogTitle>
            <DialogDescription>Loading risk data...</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { riskScore, riskLevel, adjustments, avoidanceStrategy, mlPrediction } = riskAssessment;

  // Determine color based on risk score
  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-red-600";
    if (score >= 50) return "bg-orange-500";
    if (score >= 30) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Risk Assessment: {medications.join(" + ")}</DialogTitle>
          <DialogDescription>
            Analysis of potential risks based on available data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Risk Score */}
          <div>
            <div className="flex justify-between mb-1">
              <h4 className="font-medium text-sm">Risk Score: {riskScore}/100</h4>
              <span className="text-sm font-bold">{riskLevel} Risk</span>
            </div>
            <Progress 
              value={riskScore} 
              className="h-2.5" 
              indicatorClassName={getScoreColor(riskScore)}
            />
            
            {/* ML Confidence */}
            {mlPrediction && (
              <div className="mt-1 text-xs text-gray-500">
                ML Model Confidence: {Math.round(mlPrediction.confidence * 100)}%
              </div>
            )}
          </div>

          {/* Risk Factors */}
          <div>
            <h4 className="font-medium mb-2">Risk Factors:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {adjustments.map((adjustment, index) => (
                <li key={index}>{adjustment.description}</li>
              ))}
            </ul>
          </div>

          {/* Recommendation */}
          <div className="bg-gray-50 p-3 rounded border">
            <h4 className="font-semibold mb-1">Recommendation:</h4>
            <p className="text-sm">{avoidanceStrategy}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
