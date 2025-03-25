
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { InteractionResult } from "@/lib/api-utils";
import { Badge } from "@/components/ui/badge";
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CombinedInteractionCardProps {
  medications: string[];
  interactions: InteractionResult[];
  isOpen: boolean;
  onToggle: () => void;
  risk: RiskAssessmentOutput | null;
}

export function CombinedInteractionCard({ 
  medications, 
  interactions, 
  isOpen, 
  onToggle,
  risk
}: CombinedInteractionCardProps) {
  if (!medications || medications.length < 3) return null;
  
  const riskText = risk?.riskScore >= 70 ? "High Risk Combination" : 
                  risk?.riskScore >= 40 ? "Moderate Risk Combination" : 
                  "Low Risk Combination";
  
  // Get badge color based on severity flag
  const getBadgeClass = (severityFlag?: '🔴' | '🟡' | '🟢') => {
    if (!severityFlag) return "";
    return severityFlag === "🔴" ? "bg-red-100 text-red-800 border-red-200" :
           severityFlag === "🟡" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
           "bg-green-100 text-green-800 border-green-200";
  };
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      className="rounded-xl bg-white border shadow-lg mb-6"
    >
      <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
        <span className="text-lg font-medium flex items-center gap-2">
          {risk?.severityFlag} Overall: {medications.join(' + ')}
          
          {risk && (
            <Badge variant="outline" className={cn("ml-2 font-medium text-sm", getBadgeClass(risk.severityFlag))}>
              {riskText}
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
      
      <CollapsibleContent className="p-4">
        <Alert className={cn(
          "mb-4",
          risk?.severityFlag === "🔴" ? "bg-red-50 border-red-300" :
          risk?.severityFlag === "🟡" ? "bg-yellow-50 border-yellow-300" :
          "bg-green-50 border-green-300"
        )}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Combined Risk Assessment:</strong> This analysis evaluates the overall risk when taking all {medications.length} medications together.
          </AlertDescription>
        </Alert>
        
        {risk && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Risk Score: {risk.riskScore}/100</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={cn(
                    "h-2.5 rounded-full",
                    risk.severityFlag === "🔴" ? "bg-red-500" :
                    risk.severityFlag === "🟡" ? "bg-yellow-500" :
                    "bg-green-500"
                  )}
                  style={{ width: `${risk.riskScore}%` }}
                ></div>
              </div>
            </div>
            
            {risk.avoidanceStrategy && (
              <div className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 rounded-r">
                <strong>Recommendation:</strong> {risk.avoidanceStrategy}
              </div>
            )}
            
            {risk.adjustments.length > 0 && (
              <div>
                <h3 className="font-medium mb-1">Risk Factors:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {risk.adjustments.map((adjustment, index) => (
                    <li key={index}>{adjustment}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <p className="text-sm text-gray-500 mt-4">
          Review the individual interactions below for more detailed information.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
