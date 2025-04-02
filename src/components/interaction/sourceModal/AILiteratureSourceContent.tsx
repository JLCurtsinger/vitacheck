
import React, { useMemo } from "react";
import { InteractionSource } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { DetailsSection } from "./DetailsSection";
import { formatDescriptionText } from "../utils/formatDescription";
import { SourceMetadataSection } from "./SourceMetadataSection";
import { Badge } from "@/components/ui/badge";

// Import the new components
import { LiteratureSummary } from "./aiLiterature/LiteratureSummary";
import { LiteratureCitations } from "./aiLiterature/LiteratureCitations";
import { NoReliableDataAlert } from "./aiLiterature/NoReliableDataAlert";
import { LiteratureSourceFooter } from "./aiLiterature/LiteratureSourceFooter";
import { ConfidenceIndicator } from "./aiLiterature/ConfidenceIndicator";

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
    return <NoReliableDataAlert confidenceScore={confidenceScore} />;
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
      <ConfidenceIndicator confidenceScore={confidenceScore} />
      
      {/* Severity and confidence at the top */}
      <SeverityConfidenceSection data={data} clinicianView={clinicianView} />
      
      {/* Literature Analysis Summary */}
      <LiteratureSummary bulletPoints={formattedContent.bulletPoints} />
      
      {/* Citations if available */}
      <LiteratureCitations citations={citations} clinicianView={clinicianView} />
      
      {/* Raw details section */}
      {clinicianView && (
        <DetailsSection data={data} showRaw={true} />
      )}
      
      {/* Source disclaimer and contribution */}
      <LiteratureSourceFooter sourceData={data[0]} />
    </div>
  );
}
