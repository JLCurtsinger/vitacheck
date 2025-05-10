
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InteractionSource } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, HelpCircle, XCircle, Info } from "lucide-react";
import { getSeverityIcon, getSeverityIconColor } from "./utils";

interface SeverityConfidenceSectionProps {
  data: InteractionSource[];
  clinicianView?: boolean;
}

export function SeverityConfidenceSection({ data, clinicianView = false }: SeverityConfidenceSectionProps) {
  const renderSeverityIcon = (severity: string) => {
    const iconName = getSeverityIcon(severity);
    const colorClass = getSeverityIconColor(severity);
    
    switch (iconName) {
      case "XCircle":
        return <XCircle className={`h-4 w-4 ${colorClass}`} />;
      case "AlertTriangle":
        return <AlertTriangle className={`h-4 w-4 ${colorClass}`} />;
      case "HelpCircle":
        return <HelpCircle className={`h-4 w-4 ${colorClass}`} />;
      case "CheckCircle":
        return <CheckCircle className={`h-4 w-4 ${colorClass}`} />;
      default:
        return <HelpCircle className={`h-4 w-4 ${colorClass}`} />;
    }
  };

  // Extract date information from data if available
  const getSourceDate = (item: InteractionSource) => {
    if (item.timestamp) {
      return new Date(item.timestamp).toLocaleDateString();
    }
    if (item.date) {
      return item.date;
    }
    return "Not specified";
  };

  return (
    <div className="rounded-md border mb-4">
      <div className="p-3 bg-gray-50 border-b flex items-center">
        <Info className="h-4 w-4 text-gray-500 mr-2" />
        <span className="font-medium text-sm">Source Assessment</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Severity</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Retrieved</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <div className="flex items-center gap-1">
                  {renderSeverityIcon(item.severity)}
                  <span className="capitalize">{item.severity}</span>
                </div>
              </TableCell>
              <TableCell>
                {item.confidence !== undefined ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {item.confidence}%
                  </Badge>
                ) : "N/A"}
              </TableCell>
              <TableCell className="text-xs text-gray-600">
                {getSourceDate(item)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
