
import React, { useMemo, useState } from "react";
import { InteractionSource } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { DetailsSection } from "./DetailsSection";
import { formatDescriptionText, createHTMLProps } from "../utils/formatDescription";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SourceMetadataSection } from "./SourceMetadataSection";
import { getSourceDisclaimer, getSourceContribution } from "./utils";
import { Book, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AILiteratureSourceContentProps {
  data: InteractionSource[];
  medications: string[];
}

export function AILiteratureSourceContent({ data, medications }: AILiteratureSourceContentProps) {
  const [clinicianView, setClinicianView] = useState(false);
  
  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No detailed information available from AI Literature Analysis.</p>
      </div>
    );
  }

  // Format description text into bullet points
  const formattedContent = useMemo(() => {
    if (!data || data.length === 0) return { bulletPoints: [] };
    
    // Process all descriptions from all source items
    const allDescriptions = data.map(item => item.description).filter(Boolean).join(". ");
    
    // Format the text into bullet points
    const bulletPoints = formatDescriptionText(allDescriptions, medications);
    
    return { bulletPoints };
  }, [data, medications]);

  // Extract any citations or references
  const citations = useMemo(() => {
    const refs: string[] = [];
    
    // Extract citation text if available
    data.forEach(item => {
      if (item.rawData?.citations && Array.isArray(item.rawData.citations)) {
        refs.push(...item.rawData.citations);
      }
      // Look for citation-like text in the description
      const citationRegex = /\[([\d,\s]+)\]/g;
      const description = item.description || '';
      let match;
      while ((match = citationRegex.exec(description)) !== null) {
        refs.push(match[0]);
      }
    });
    
    return [...new Set(refs)]; // Remove duplicates
  }, [data]);

  return (
    <>
      {/* Clinician View Toggle */}
      <div className="flex items-center justify-end space-x-2 mb-4 sticky top-0 bg-white p-2 z-10 rounded-md border border-gray-100 shadow-sm">
        <Label htmlFor="clinician-view" className="text-sm font-medium">
          Clinician View
        </Label>
        <Switch
          id="clinician-view"
          checked={clinicianView}
          onCheckedChange={setClinicianView}
        />
      </div>
      
      {/* Source Metadata */}
      <SourceMetadataSection data={data} sourceName="AI Literature Analysis" />
      
      {/* Severity and confidence at the top */}
      <SeverityConfidenceSection data={data} />
      
      {/* Literature Analysis Summary */}
      <div className="rounded-md border mb-4 p-4">
        <h3 className="font-medium mb-3 flex items-center">
          <Book className="h-4 w-4 mr-2 text-amber-700" />
          Literature Analysis
        </h3>
        <div className="space-y-2">
          {formattedContent.bulletPoints.length > 0 ? (
            formattedContent.bulletPoints.map((point, idx) => (
              <p key={idx} className="text-sm" dangerouslySetInnerHTML={createHTMLProps(point)} />
            ))
          ) : (
            <p className="text-sm text-gray-500">No detailed analysis available.</p>
          )}
        </div>
      </div>
      
      {/* Citations if available */}
      {citations.length > 0 && (
        <div className="rounded-md border mb-4 p-4 bg-amber-50">
          <h3 className="font-medium mb-2 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-amber-700" />
            Literature Citations
          </h3>
          
          {clinicianView ? (
            <Accordion type="single" collapsible>
              <AccordionItem value="citations">
                <AccordionTrigger className="text-sm">View All Citations</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-amber-100/50 p-3 rounded text-sm">
                    {citations.map((citation, idx) => (
                      <div key={idx} className="mb-1 text-amber-800">
                        {citation}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <div className="text-sm">
              {citations.slice(0, 3).map((citation, idx) => (
                <div key={idx} className="mb-1 text-amber-800">
                  {citation}
                </div>
              ))}
              {citations.length > 3 && (
                <div className="text-amber-600 text-xs italic">
                  And {citations.length - 3} more citations (activate Clinician View to see all)
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Raw details section */}
      <DetailsSection data={data} showRaw={clinicianView} />
      
      {/* Source disclaimer */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 italic">
        {getSourceDisclaimer("AI LITERATURE ANALYSIS")}
      </div>
      
      {/* Contribution to severity score */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        {getSourceContribution(data[0])}
      </div>
    </>
  );
}
