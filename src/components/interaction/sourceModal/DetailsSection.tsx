
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
    <div className="rounded-md border mb-4 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium flex items-center">
          <Info className="h-4 w-4 mr-2 text-gray-500" />
          Details
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs"
          onClick={() => setShowRawData(!showRawData)}
        >
          <Code className="h-3 w-3 mr-1" />
          {showRawData ? "Hide Raw Data" : "Show Raw Data"}
        </Button>
      </div>
      
      {!showRawData ? (
        <div className="text-sm text-gray-700 max-h-60 overflow-y-auto">
          {data.map((item, idx) => (
            <p key={idx} className="mb-2">
              {item.description || "No detailed description available"}
            </p>
          ))}
        </div>
      ) : (
        <div>
          {/* Structured extracted data (if available) */}
          {structuredData && (
            <Accordion type="single" collapsible className="mb-3">
              {structuredData.map((section, index) => (
                <AccordionItem key={index} value={`section-${index}`}>
                  <AccordionTrigger className="text-sm font-medium">{section.title}</AccordionTrigger>
                  <AccordionContent>
                    {section.type === "list" ? (
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {section.content.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm">{section.content}</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          
          {/* Full Raw JSON Data */}
          <Collapsible className="w-full" defaultOpen={true}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 text-xs">
                Raw Source Data
                {true ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}
