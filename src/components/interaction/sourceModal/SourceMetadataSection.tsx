
import { Clock, Database, Tag, Calendar, Hash, Flag, AlertTriangle } from "lucide-react";
import { InteractionSource } from "@/lib/api/types";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface SourceMetadataSectionProps {
  data: InteractionSource[];
  sourceName: string;
  isClinicianView?: boolean;
}

export function SourceMetadataSection({ 
  data, 
  sourceName, 
  isClinicianView = false 
}: SourceMetadataSectionProps) {
  // Extract metadata from source if available
  const getMetadataItems = () => {
    const metadata = [];
    
    // Add source name
    metadata.push({ 
      icon: <Database className="h-4 w-4 text-gray-500" />,
      label: "Source", 
      value: sourceName
    });
    
    // Add date if available
    if (data[0]?.timestamp || data[0]?.date) {
      const dateValue = data[0]?.timestamp || data[0]?.date;
      metadata.push({
        icon: <Calendar className="h-4 w-4 text-gray-500" />,
        label: "Retrieved",
        value: typeof dateValue === 'string' 
          ? new Date(dateValue).toLocaleDateString() 
          : "Unknown date"
      });
    }
    
    // Add API version or identifier if available
    if (data[0]?.rawData?.api_version) {
      metadata.push({
        icon: <Hash className="h-4 w-4 text-gray-500" />,
        label: "API Version",
        value: data[0].rawData.api_version
      });
    }
    
    // Add processing status if available
    if (data[0]?.processed !== undefined) {
      metadata.push({
        icon: <Flag className="h-4 w-4 text-gray-500" />,
        label: "Status",
        value: data[0].processed ? "Processed" : "Raw"
      });
    }
    
    // Add API-specific tags if available
    if (data[0]?.tags && Array.isArray(data[0].tags) && data[0].tags.length > 0) {
      metadata.push({
        icon: <Tag className="h-4 w-4 text-gray-500" />,
        label: "Tags",
        value: data[0].tags.join(", ")
      });
    }
    
    // Add fallback mode information if in clinician view
    if (isClinicianView && data[0]?.fallbackMode) {
      metadata.push({
        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        label: "Data Processing",
        value: "Fallback Mode",
        highlight: true,
        tooltip: data[0].fallbackReason || "Schema inconsistency handled with fallbacks"
      });
    }
    
    return metadata;
  };
  
  const metadataItems = getMetadataItems();
  
  if (metadataItems.length <= 1 && !isClinicianView) return null;
  
  return (
    <div className="rounded-md border mb-4 p-4 bg-gray-50">
      <h3 className="font-medium mb-2 text-sm text-gray-600">Source Metadata</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {metadataItems.map((item, idx) => (
          <div key={idx} className="flex items-center">
            {item.icon}
            <span className={`ml-2 text-sm ${item.highlight ? 'font-medium' : ''}`}>
              <span className={`${item.highlight ? 'text-amber-700' : 'text-gray-500'}`}>{item.label}:</span> {' '}
              {item.highlight ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {item.value}
                </Badge>
              ) : item.value}
              {item.tooltip && isClinicianView && (
                <span className="block text-xs text-amber-600 ml-6 mt-1 italic">
                  {item.tooltip}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      
      {/* Display additional fallback information in clinician view */}
      {isClinicianView && data[0]?.fallbackMode && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md text-xs">
          <p className="font-medium text-amber-700">Data Fallback Applied</p>
          <p className="text-amber-600">{data[0].fallbackReason || "Schema inconsistency handled with fallbacks"}</p>
          {data[0].fallbackFields && (
            <p className="mt-1 text-amber-600">
              Fields used: {Array.isArray(data[0].fallbackFields) ? data[0].fallbackFields.join(', ') : 'unknown'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
