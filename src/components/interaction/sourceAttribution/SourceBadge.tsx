
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Database, FileText, TestTube, AlertTriangle, BookOpen, BarChart } from "lucide-react";

interface SourceBadgeProps {
  source: string;
  onClick: () => void;
}

export function SourceBadge({ source, onClick }: SourceBadgeProps) {
  // Get the appropriate icon for each source
  const getSourceIcon = (source: string) => {
    switch (source.toUpperCase()) {
      case 'RXNORM':
        return <Database className="h-3 w-3 mr-1" />;
      case 'FDA':
        return <FileText className="h-3 w-3 mr-1" />;
      case 'FDA ADVERSE EVENTS':
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'SUPP.AI':
        return <TestTube className="h-3 w-3 mr-1" />;
      case 'AI LITERATURE ANALYSIS':
        return <BookOpen className="h-3 w-3 mr-1" />;
      case 'OPENFDA ADVERSE EVENTS':
        return <BarChart className="h-3 w-3 mr-1" />;
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
      case 'FDA ADVERSE EVENTS':
        return "bg-red-50 hover:bg-red-100 border-red-200 text-red-700";
      case 'SUPP.AI':
        return "bg-green-50 hover:bg-green-100 border-green-200 text-green-700";
      case 'AI LITERATURE ANALYSIS':
        return "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700";
      case 'OPENFDA ADVERSE EVENTS':
        return "bg-red-50 hover:bg-red-100 border-red-200 text-red-700";
      default:
        return "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700";
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center cursor-pointer ${getSourceColorClass(source)}`}
      onClick={onClick}
    >
      {getSourceIcon(source)}
      {source}
    </Badge>
  );
}
