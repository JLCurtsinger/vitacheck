
import React from "react";
import { InteractionSource } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface BetaHeaderProps {
  data: InteractionSource[];
  sourceName: string;
  isClinicianView?: boolean;
  hasError?: boolean;
}

export function BetaHeader({ 
  data, 
  sourceName,
  isClinicianView = false,
  hasError = false
}: BetaHeaderProps) {
  const isBeta = true; // AI Literature Analysis is always in beta
  const isExperimental = !isClinicianView;
  
  return (
    <div className="p-4 mb-2 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <h3 className="font-medium">{sourceName}</h3>
        {isBeta && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
            Beta
          </Badge>
        )}
        {isExperimental && (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
            Experimental
          </Badge>
        )}
        {hasError && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Service Issue
          </Badge>
        )}
      </div>
      
      {isClinicianView && (
        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-xs">
          Clinician View
        </Badge>
      )}
    </div>
  );
}
