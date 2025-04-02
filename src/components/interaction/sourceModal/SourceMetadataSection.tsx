
import { Clock, Database, Tag } from "lucide-react";
import { InteractionSource } from "@/lib/api/types";

interface SourceMetadataSectionProps {
  data: InteractionSource[];
  sourceName: string;
}

export function SourceMetadataSection({ data, sourceName }: SourceMetadataSectionProps) {
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
        icon: <Clock className="h-4 w-4 text-gray-500" />,
        label: "Retrieved",
        value: typeof dateValue === 'string' 
          ? new Date(dateValue).toLocaleDateString() 
          : "Unknown date"
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
    
    return metadata;
  };
  
  const metadataItems = getMetadataItems();
  
  if (metadataItems.length <= 1) return null;
  
  return (
    <div className="rounded-md border mb-4 p-4 bg-gray-50">
      <h3 className="font-medium mb-2 text-sm text-gray-600">Source Metadata</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {metadataItems.map((item, idx) => (
          <div key={idx} className="flex items-center">
            {item.icon}
            <span className="ml-2 text-sm">
              <span className="text-gray-500">{item.label}:</span> {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
