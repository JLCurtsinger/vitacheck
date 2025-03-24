
import React from "react";
import { InteractionSource } from "@/lib/api/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import { getSeverityIcon, getSeverityIconColor } from "./utils";

interface DefaultSourceContentProps {
  data: InteractionSource[];
}

export function DefaultSourceContent({ data }: DefaultSourceContentProps) {
  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No detailed information available for this source.</p>
      </div>
    );
  }

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
            <TableHead>Details</TableHead>
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
              <TableCell className="max-w-xs">
                {item.description || "No detailed description available"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
