
import { Button } from "@/components/ui/button";
import { AreaChart } from "lucide-react";

interface RiskAssessmentButtonProps {
  onClick: () => void;
}

export function RiskAssessmentButton({ onClick }: RiskAssessmentButtonProps) {
  return (
    <div className="mt-4 flex justify-end">
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs flex items-center gap-1 text-gray-600"
        onClick={onClick}
      >
        <AreaChart className="h-3.5 w-3.5" />
        Risk Assessment
      </Button>
    </div>
  );
}
