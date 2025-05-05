
import { useCallback, useState } from "react";
import { SourceBadge } from "./SourceBadge";
import { SourceDetailsModal } from "../SourceDetailsModal";
import { SourceAttributionProps, SourceModalData } from "./types";

export function SourceAttribution({ sources, interaction }: SourceAttributionProps) {
  const [selectedSource, setSelectedSource] = useState<SourceModalData | null>(null);
  
  if (!sources.length) return null;
  
  // Sort sources to prioritize FDA Adverse Events
  const sortedSources = [...sources].sort((a, b) => {
    if (a.includes("Adverse")) return -1;
    if (b.includes("Adverse")) return 1;
    return a.localeCompare(b);
  });
  
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
        severity: "unknown", // Fixed: Don't access severity on adverseEvents
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
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-medium text-gray-500 mr-1">Data Sources:</span>
        {sortedSources.map((source, index) => (
          <SourceBadge 
            key={index} 
            source={source}
            onClick={() => handleSourceClick(source)}
          />
        ))}
      </div>
      
      <SourceDetailsModal 
        isOpen={!!selectedSource} 
        onClose={handleCloseModal} 
        source={selectedSource} 
      />
    </>
  );
}
