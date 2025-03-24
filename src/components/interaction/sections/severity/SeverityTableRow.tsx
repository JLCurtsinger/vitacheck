
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getSeverityClass } from "../../utils/severity-calculations";
import { DistributionBar } from "./DistributionBar";

interface SeverityTableRowProps {
  stat: {
    name: string;
    totalCases: number;
    severeCases: number;
    moderateCases: number;
    minorCases: number;
    severePercent: number;
    severeWidth: number;
    moderateWidth: number;
    minorWidth: number;
    hasData: boolean;
  };
  isCombined?: boolean;
}

export function SeverityTableRow({ stat, isCombined = false }: SeverityTableRowProps) {
  // Ensure all numeric values are actually numbers and not NaN
  const safeTotal = isNaN(stat.totalCases) ? 0 : stat.totalCases;
  const safeSevere = isNaN(stat.severeCases) ? 0 : stat.severeCases;
  const safeModerate = isNaN(stat.moderateCases) ? 0 : stat.moderateCases;
  const safeMinor = isNaN(stat.minorCases) ? 0 : stat.minorCases;
  const safePercent = isNaN(stat.severePercent) ? 0 : stat.severePercent;
  
  return (
    <TableRow className={cn(
      isCombined && "font-medium bg-gray-100"
    )}>
      <TableCell>{stat.name}</TableCell>
      <TableCell className="text-right">
        {stat.hasData ? safeTotal.toLocaleString() : 
          <span className="text-gray-400 italic">Not Available</span>}
      </TableCell>
      <TableCell className="text-right text-red-700">
        {stat.hasData ? safeSevere.toLocaleString() : 
          <span className="text-gray-400 italic">N/A</span>}
      </TableCell>
      <TableCell className="text-right text-yellow-700">
        {stat.hasData ? safeModerate.toLocaleString() : 
          <span className="text-gray-400 italic">N/A</span>}
      </TableCell>
      <TableCell className="text-right text-green-700">
        {stat.hasData ? safeMinor.toLocaleString() : 
          <span className="text-gray-400 italic">N/A</span>}
      </TableCell>
      <TableCell className={cn(
        "text-right font-medium", 
        stat.hasData ? getSeverityClass(safePercent) : "text-gray-400"
      )}>
        {stat.hasData ? safePercent.toFixed(2) + "%" : "N/A"}
      </TableCell>
      <TableCell>
        <DistributionBar 
          severeWidth={stat.severeWidth}
          moderateWidth={stat.moderateWidth}
          minorWidth={stat.minorWidth}
          hasData={stat.hasData}
        />
      </TableCell>
    </TableRow>
  );
}
