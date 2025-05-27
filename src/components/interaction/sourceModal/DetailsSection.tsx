import React, { useState } from "react";
import { InteractionSource } from "@/lib/api/types";
import { Code, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface DetailsSectionProps {
  data: InteractionSource[];
  showRaw?: boolean;
}

export function DetailsSection({ data, showRaw = false }: DetailsSectionProps) {
  const [showRawData, setShowRawData] = useState(showRaw);

  if (!data || data.length === 0) return null;

  // Try to extract structured data from the rawData if available
  const extractStructuredData = () => {
    if (!data[0]?.rawData) return null;
    
    const rawData = data[0].rawData;
    const structured = [];
    
    // Add any warnings or alerts if present
    if (rawData.warnings && Array.isArray(rawData.warnings) && rawData.warnings.length > 0) {
      structured.push({
        title: "Warnings",
        content: rawData.warnings,
        type: "list"
      });
    }
    
    // Add any drug interactions specific data
    if (rawData.drug_interactions && Array.isArray(rawData.drug_interactions) && rawData.drug_interactions.length > 0) {
      structured.push({
        title: "Drug Interactions",
        content: rawData.drug_interactions,
        type: "list"
      });
    }
    
    // Add any contraindications if present
    if (rawData.contraindications && Array.isArray(rawData.contraindications) && rawData.contraindications.length > 0) {
      structured.push({
        title: "Contraindications",
        content: rawData.contraindications,
        type: "list"
      });
    }
    
    return structured.length > 0 ? structured : null;
  };
  
  const structuredData = extractStructuredData();

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-md">
          <p className="text-gray-700">
            {item.description || "No detailed description available"}
          </p>
          
          {showRaw && item.rawData && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm font-mono overflow-auto">
              <pre>{JSON.stringify(item.rawData, null, 2)}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
