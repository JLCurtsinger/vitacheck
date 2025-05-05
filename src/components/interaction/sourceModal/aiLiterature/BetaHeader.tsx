
import React from "react";
import { Badge } from "@/components/ui/badge";
import { SourceMetadataSection } from "../SourceMetadataSection";
import { InteractionSource } from "@/lib/api/types";

interface BetaHeaderProps {
  data: InteractionSource[];
  sourceName: string;
  isClinicianView: boolean;
}

export function BetaHeader({ data, sourceName, isClinicianView }: BetaHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <SourceMetadataSection 
        data={data} 
        sourceName={sourceName}
        isClinicianView={isClinicianView}
      />
      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
        Beta
      </Badge>
    </div>
  );
}
