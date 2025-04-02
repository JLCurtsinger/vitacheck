
import React, { useMemo } from "react";
import { InteractionSource } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { DetailsSection } from "./DetailsSection";
import { formatDescriptionText, createHTMLProps } from "../utils/formatDescription";
import { SourceMetadataSection } from "./SourceMetadataSection";
import { getSourceDisclaimer, getSourceContribution } from "./utils";
import { Book, FileText, AlertCircle, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface AILiteratureSourceContentProps {
  data: InteractionSource[];
  medications: string[];
  clinicianView?: boolean;
}

export function AILiteratureSourceContent({ 
  data, 
  medications,
  clinicianView = false 
}: AILiteratureSourceContentProps) {
  // Check if we have valid and reliable data
  const hasReliableData = useMemo(() => {
    if (data.length === 0) return false;
    
    // Check for reliability flag or minimum confidence threshold
    return data.some(item => 
      (item.isReliable === true) || 
      (typeof item.confidence === 'number' && item.confidence >= 60)
    );
  }, [data]);
  
  // Get average confidence score from all data items
  const confidenceScore = useMemo(() => {
    if (data.length === 0) return 0;
    
    const validConfidences = data
      .map(item => item.confidence)
      .filter(score => typeof score === 'number');
      
    if (validConfidences.length === 0) return 0;
    
    const sum = validConfidences.reduce((total, score) => total + score, 0);
    return Math.round(sum / validConfidences.length);
  }, [data]);
  
  // If no data or all data is unreliable, show appropriate message
  if (data.length === 0 || !hasReliableData) {
    return (
      <div className="p-6">
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-700" />
          <AlertTitle className="text-amber-700">No Reliable Data Available</AlertTitle>
          <AlertDescription className="text-amber-800">
            AI Literature Analysis was unable to retrieve reliable data for this combination.
            {confidenceScore > 0 && confidenceScore < 60 && (
              <span className="block mt-2 text-xs">
                (Confidence score: {confidenceScore}% - below threshold of 60%)
              </span>
            )}
          </AlertDescription>
        </Alert>
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
    <div className="pb-6">
      {/* Source Metadata with Beta label */}
      <div className="flex items-center justify-between mb-4">
        <SourceMetadataSection 
          data={data} 
          sourceName="AI Literature Analysis"
          isClinicianView={clinicianView}
        />
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
          Beta
        </Badge>
      </div>
      
      {/* Confidence indicator */}
      <div className="mb-4 flex items-center gap-2">
        <Info className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">
          Confidence: {confidenceScore}%
          {confidenceScore >= 80 && <span className="text-green-600 ml-1">(High)</span>}
          {confidenceScore >= 60 && confidenceScore < 80 && <span className="text-amber-600 ml-1">(Moderate)</span>}
        </span>
      </div>
      
      {/* Severity and confidence at the top */}
      <SeverityConfidenceSection data={data} clinicianView={clinicianView} />
      
      {/* Literature Analysis Summary */}
      <div className="rounded-md border mb-4 p-4">
        <h3 className="font-medium mb-3 flex items-center">
          <Book className="h-4 w-4 mr-2 text-amber-700" />
          AI Literature Summary
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
      {clinicianView && (
        <DetailsSection data={data} showRaw={true} />
      )}
      
      {/* Source disclaimer */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 italic">
        {getSourceDisclaimer("AI LITERATURE ANALYSIS")} This source uses AI to analyze medical literature and may not reflect official guidance.
      </div>
      
      {/* Contribution to severity score */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        {getSourceContribution(data[0])}
      </div>
    </div>
  );
}
