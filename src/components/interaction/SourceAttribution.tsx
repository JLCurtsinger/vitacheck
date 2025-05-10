
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Database, FileText, TestTube, AlertTriangle, BookOpen, BarChart, ServerIcon } from "lucide-react";
import { InteractionResult, AdverseEventData } from "@/lib/api/types";
import { SourceDetailsModal } from "./modal/SourceDetailsModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface SourceAttributionProps {
  sources: string[];
  interaction?: InteractionResult;
}

export function SourceAttribution({ sources, interaction }: SourceAttributionProps) {
  const [selectedSource, setSelectedSource] = useState<{
    name: string;
    data: any[];
    medications: string[];
  } | null>(null);
  
  if (!sources.length) return null;
  
  // Check if this is a fallback result from the database
  const isFromDatabase = interaction?.fromDatabase === true;
  const isFromCache = interaction?.fromCache === true;
  
  // Sort sources to prioritize FDA Adverse Events
  const sortedSources = [...sources].sort((a, b) => {
    if (a.includes("Adverse")) return -1;
    if (b.includes("Adverse")) return 1;
    return a.localeCompare(b);
  });
  
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
      case 'VITACHECK SAFETY DATABASE':
        return <ServerIcon className="h-3 w-3 mr-1" />;
      default:
        if (source.includes("Database")) {
          return <ServerIcon className="h-3 w-3 mr-1" />;
        }
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
      case 'VITACHECK SAFETY DATABASE':
        return "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700";
      default:
        if (source.includes("Database")) {
          return "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700";
        }
        return "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700";
    }
  };
  
  // Handle opening the modal with source details
  const handleSourceClick = (sourceName: string) => {
    if (!interaction) return;
    
    // Extract relevant data from interaction based on source name
    const sourceData = interaction.sources.filter(src => 
      src.name.toUpperCase() === sourceName.toUpperCase()
    );
    
    // Handle special case for adverse events
    if (sourceName.toUpperCase().includes("ADVERSE") && interaction.adverseEvents) {
      const adverseEventSource = {
        name: "OpenFDA Adverse Events",
        severity: interaction.adverseEvents ? "unknown" : "unknown",
        description: `${interaction.adverseEvents.eventCount} adverse events reported for this combination`,
        adverseEvents: interaction.adverseEvents
      };
      
      setSelectedSource({
        name: sourceName,
        data: [adverseEventSource],
        medications: interaction.medications
      });
      
      return;
    }
    
    setSelectedSource({
      name: sourceName,
      data: sourceData,
      medications: interaction.medications
    });
  };
  
  const handleCloseModal = useCallback(() => {
    setSelectedSource(null);
  }, []);
  
  return (
    <>
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-500 mr-1">Data Sources:</span>
          {sortedSources.map((source, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className={`flex items-center cursor-pointer ${getSourceColorClass(source)}`}
              onClick={() => handleSourceClick(source)}
            >
              {getSourceIcon(source)}
              {source}
            </Badge>
          ))}
        </div>
        
        {isFromDatabase && (
          <Alert className="bg-gray-50 border-gray-200 mt-2">
            <InfoIcon className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-700">
              <strong>Data Source:</strong> VitaCheck Safety Database (used as fallback; no current external sources found)
            </AlertDescription>
          </Alert>
        )}
        
        {isFromCache && (
          <Alert className="bg-gray-50 border-gray-200 mt-2">
            <InfoIcon className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-700">
              <strong>Data Source:</strong> Session cache (used as fallback; external APIs and database queries failed)
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <SourceDetailsModal 
        isOpen={!!selectedSource} 
        onClose={handleCloseModal} 
        source={selectedSource} 
      />
    </>
  );
}
