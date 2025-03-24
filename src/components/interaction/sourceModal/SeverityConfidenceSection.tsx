
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InteractionSource } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import { getSeverityIcon, getSeverityIconColor } from "./utils";

interface SeverityConfidenceSectionProps {
  data: InteractionSource[];
}

export function SeverityConfidenceSection({ data }: SeverityConfidenceSectionProps) {
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

  return (
    <div className="rounded-md border mb-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Severity</TableHead>
            <TableHead>Confidence</TableHead>
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
                {item.confidence ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {item.confidence}%
                  </Badge>
                ) : "N/A"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
