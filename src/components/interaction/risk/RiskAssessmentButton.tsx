
import React from "react";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

interface RiskAssessmentButtonProps {
  onClick: () => void;
}

export function RiskAssessmentButton({ onClick }: RiskAssessmentButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="mt-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 w-full"
    >
      <BarChart3 className="h-4 w-4 mr-2" />
      View Risk Assessment
    </Button>
  );
}
