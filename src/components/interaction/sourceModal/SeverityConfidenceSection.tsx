import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InteractionSource } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { severityLabels, getSeverityIcon, getSeverityTextClasses } from "@/lib/utils/severity-utils";
import { cn } from "@/lib/utils";

interface SeverityConfidenceSectionProps {
  data: InteractionSource[];
  clinicianView?: boolean;
}

export function SeverityConfidenceSection({ data, clinicianView = false }: SeverityConfidenceSectionProps) {
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
                <div className={cn("flex items-center gap-1", getSeverityTextClasses(item.severity))}>
                  {getSeverityIcon(item.severity)}
                  <span>{severityLabels[item.severity]}</span>
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
                {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "N/A"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
