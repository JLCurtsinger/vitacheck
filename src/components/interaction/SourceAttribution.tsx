
import { Badge } from "@/components/ui/badge";
import { Database, FileText, Flask } from "lucide-react";

interface SourceAttributionProps {
  sources: string[];
}

export function SourceAttribution({ sources }: SourceAttributionProps) {
  if (!sources.length) return null;
  
  // Get the appropriate icon for each source
  const getSourceIcon = (source: string) => {
    switch (source.toUpperCase()) {
      case 'RXNORM':
        return <Database className="h-3 w-3 mr-1" />;
      case 'FDA':
        return <FileText className="h-3 w-3 mr-1" />;
      case 'SUPP.AI':
        return <Flask className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };
  
  // Get the appropriate color class for each source
  const getSourceColorClass = (source: string) => {
    switch (source.toUpperCase()) {
      case 'RXNORM':
        return "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700";
      case 'FDA':
        return "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700";
      case 'SUPP.AI':
        return "bg-green-50 hover:bg-green-100 border-green-200 text-green-700";
      default:
        return "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700";
    }
  };
  
  return (
    <div className="flex flex-wrap gap-1 mb-3">
      <span className="text-sm font-medium text-gray-500 mr-1">Sources:</span>
      {sources.map((source, index) => (
        <Badge 
          key={index} 
          variant="outline" 
          className={`flex items-center ${getSourceColorClass(source)}`}
        >
          {getSourceIcon(source)}
          {source}
        </Badge>
      ))}
    </div>
  );
}
