import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EnhancedRiskAssessmentOutput } from "@/lib/utils/risk-assessment";
import { Info, X } from "lucide-react";

interface RiskAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskAssessment: EnhancedRiskAssessmentOutput | null;
}

export function RiskAssessmentModal({
  open,
  onOpenChange,
  riskAssessment,
}: RiskAssessmentModalProps) {
  if (!riskAssessment) return null;

  const { riskScore, confidence, severityFlag, inputSummary } = riskAssessment;
  
  // Helper function to get severity label from emoji
  const getSeverityLabel = (flag: string) => {
    switch (flag) {
      case "🔴": return "Severe";
      case "🟡": return "Moderate";
      case "🟢": return "Minor/Low";
      default: return "Unknown";
    }
  };

  // Get color class based on severity
  const getSeverityColorClass = (flag: string) => {
    switch (flag) {
      case "🔴": return "text-red-700";
      case "🟡": return "text-yellow-700";
      case "🟢": return "text-green-700";
      default: return "text-gray-700";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Risk Assessment Overview</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription>
            Detailed breakdown of risk factors and confidence scoring
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Section */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Risk Score</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{riskScore}</span>
                <span className={`text-xl ${getSeverityColorClass(severityFlag)}`}>{severityFlag}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Out of 100 (Higher = More Risk)
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Confidence</h3>
              <div className="text-2xl font-bold">{confidence}%</div>
              <p className="text-xs text-gray-500 mt-1">
                Based on {Object.keys(inputSummary.sources).length} data sources
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Severity Level</h3>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${getSeverityColorClass(severityFlag)}`}>
                  {getSeverityLabel(severityFlag)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Input severity: {inputSummary.severity}
              </p>
            </div>
          </div>

          {/* Calculation Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">How Risk Scores Are Calculated</h3>
                <p className="text-sm text-blue-700 mt-1">
                  The risk score is a weighted sum of all active data sources, with a severity multiplier
                  applied ({inputSummary.severity === "severe" ? "1.5" : 
                           inputSummary.severity === "moderate" ? "1.25" : "1.0"} for {inputSummary.severity} severity).
                  Sources are only counted if they have a positive signal or plausible flag.
                </p>
              </div>
            </div>
          </div>

          {/* Data Sources Table */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Data Source Breakdown</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Source</TableHead>
                    <TableHead>Signal/Plausible</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Contribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(inputSummary.sources).map(([key, source]) => {
                    const isActive = source.signal || source.plausible;
                    const contribution = isActive 
                      ? Math.round(source.score * source.weight * 
                          (inputSummary.severity === "severe" ? 1.5 : 
                           inputSummary.severity === "moderate" ? 1.25 : 1.0))
                      : 0;
                    
                    return (
                      <TableRow key={key} className={isActive ? "" : "text-gray-400"}>
                        <TableCell className="font-medium">{key}</TableCell>
                        <TableCell>
                          {source.signal && "✅ Signal"} 
                          {source.plausible && "✅ Plausible"}
                          {!source.signal && !source.plausible && "❌ None"}
                        </TableCell>
                        <TableCell className="text-right">{source.score}</TableCell>
                        <TableCell className="text-right">{source.weight.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {isActive ? `+${contribution}` : "0"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {/* Total Row */}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell colSpan={4} className="text-right">Total Risk Score:</TableCell>
                    <TableCell className="text-right">{riskScore}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Severity Multiplier Explanation */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Severity Multipliers</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className={`p-2 rounded ${inputSummary.severity === "mild" ? "bg-green-100 border border-green-200" : ""}`}>
                <div className="text-sm font-medium">Mild</div>
                <div className="text-lg">× 1.0</div>
              </div>
              <div className={`p-2 rounded ${inputSummary.severity === "moderate" ? "bg-yellow-100 border border-yellow-200" : ""}`}>
                <div className="text-sm font-medium">Moderate</div>
                <div className="text-lg">× 1.25</div>
              </div>
              <div className={`p-2 rounded ${inputSummary.severity === "severe" ? "bg-red-100 border border-red-200" : ""}`}>
                <div className="text-sm font-medium">Severe</div>
                <div className="text-lg">× 1.5</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
