
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InteractionSource } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, HelpCircle, XCircle, Info } from "lucide-react";
import { getSeverityIcon, getSeverityIconColor } from "./utils";

interface SeverityConfidenceSectionProps {
  source: InteractionSource;
}

export function SeverityConfidenceSection({ source }: SeverityConfidenceSectionProps) {
  // Get severity icon and text
  const SeverityIcon = getSeverityIcon(source.severity);
  const severityColor = getSeverityIconColor(source.severity);
  
  // Format date if available
  const dateString = source.timestamp ? 
    new Date(source.timestamp).toLocaleDateString() : 
    source.date || 'Unknown';
    
  // Format confidence as percentage if available
  const confidenceDisplay = source.confidence ? 
    `${Math.round(source.confidence)}%` : 
    'Unknown';
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Severity & Confidence Assessment</h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Metric</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Severity Rating</TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <SeverityIcon className={`h-4 w-4 ${severityColor}`} />
                <span className="capitalize">{source.severity}</span>
              </div>
            </TableCell>
          </TableRow>
          
          <TableRow>
            <TableCell className="font-medium">Confidence Level</TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                {confidenceDisplay !== 'Unknown' ? (
                  <Badge variant={parseInt(confidenceDisplay) > 70 ? "success" : parseInt(confidenceDisplay) > 40 ? "warning" : "outline"}>
                    {confidenceDisplay}
                  </Badge>
                ) : (
                  <span className="text-gray-500 italic">Not available</span>
                )}
              </div>
            </TableCell>
          </TableRow>
          
          <TableRow>
            <TableCell className="font-medium">Last Updated</TableCell>
            <TableCell className="text-sm text-gray-600">{dateString}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
