
import { Button } from "@/components/ui/button";
import { BarChart2 } from "lucide-react";

interface RiskAssessmentButtonProps {
  onClick: () => void;
}

export function RiskAssessmentButton({ onClick }: RiskAssessmentButtonProps) {
  return (
    <div className="mt-4 flex justify-end">
      <Button 
        variant="outline" 
        size="sm"
        className="flex items-center gap-2"
        onClick={onClick}
      >
        <BarChart2 className="h-4 w-4" />
        <span>Overview / Why is this flagged?</span>
      </Button>
    </div>
  );
}
