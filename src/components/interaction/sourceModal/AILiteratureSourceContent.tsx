
import React, { useMemo } from "react";
import { InteractionSource } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { DetailsSection } from "./DetailsSection";
import { formatDescriptionText } from "../utils/formatDescription";
import { SourceMetadataSection } from "./SourceMetadataSection";
import { Badge } from "@/components/ui/badge";

// Import the components
import { 
  LiteratureSummary, 
  LiteratureCitations, 
  NoReliableDataAlert, 
  LiteratureSourceFooter, 
  ConfidenceIndicator 
} from "./aiLiterature";

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
  // Check if we have valid and usable data
  const { 
    hasReliableData,
    confidenceScore,
    sourcesReferenced,
    reliability
  } = useMemo(() => {
    if (data.length === 0) return { 
      hasReliableData: false, 
      confidenceScore: 0,
      sourcesReferenced: [],
      reliability: { isReliable: false }
    };
    
    // Get all confidence scores that are valid numbers
    const validConfidences = data
      .map(item => item.confidence)
      .filter(score => typeof score === 'number');
      
    // Calculate the average confidence
    const sum = validConfidences.length > 0
      ? validConfidences.reduce((total, score) => total + score, 0)
      : 0;
      
    const avgConfidence = validConfidences.length > 0
      ? Math.round(sum / validConfidences.length)
      : 0;
    
    // Check if any source is explicitly marked as reliable
    const explicitlyReliable = data.some(item => item.isReliable === true);
    
    // Check if any source has a high enough confidence to be considered reliable
    const implicitlyReliable = data.some(item => 
      (typeof item.confidence === 'number' && item.confidence >= 40) &&
      !item.description?.toLowerCase().includes('error occurred')
    );
    
    // Extract sources referenced if present
    const sources = data
      .filter(item => item.rawData?.sources || item.sources)
      .flatMap(item => item.rawData?.sources || item.sources || [])
      .filter(Boolean);
    
    // Extract reliability info
    const reliabilityInfo = {
      isReliable: explicitlyReliable || implicitlyReliable,
      reason: data[0]?.validationReason || undefined
    };
    
    return { 
      hasReliableData: explicitlyReliable || implicitlyReliable,
      confidenceScore: avgConfidence,
      sourcesReferenced: [...new Set(sources)],
      reliability: reliabilityInfo
    };
  }, [data]);
  
  // Get unique cited sources
  const sourcesReferenced = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Collect all unique sources
    const allSources = new Set<string>();
    
    data.forEach(item => {
      if (item.rawData?.sources && Array.isArray(item.rawData.sources)) {
        item.rawData.sources.forEach(source => allSources.add(source));
      }
      
      // Also check for sources field directly
      if (item.sources && Array.isArray(item.sources)) {
        item.sources.forEach(source => allSources.add(source));
      }
    });
    
    return Array.from(allSources);
  }, [data]);
  
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
      if (item.description) {
        const citationRegex = /\[([\d,\s]+)\]/g;
        let match;
        while ((match = citationRegex.exec(item.description)) !== null) {
          refs.push(match[0]);
        }
      }
    });
    
    return [...new Set(refs)]; // Remove duplicates
  }, [data]);

  // Show a reduced view for unreliable data, but still provide feedback
  if (!hasReliableData) {
    // For clinician view, show unreliable data with warning banner
    if (clinicianView) {
      return (
        <div className="pb-6">
          <div className="flex items-center justify-between mb-4">
            <SourceMetadataSection 
              data={data} 
              sourceName="AI Literature Analysis"
              isClinicianView={true}
            />
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
              Beta
            </Badge>
          </div>
          
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>Low Confidence Analysis:</strong> This AI analysis didn't meet reliability thresholds, but is shown for research purposes.
            </p>
          </div>
          
          <ConfidenceIndicator confidenceScore={confidenceScore} />
          
          <LiteratureSummary 
            bulletPoints={formattedContent.bulletPoints}
            sourcesReferenced={sourcesReferenced}
            reliability={reliability}
          />
          
          <DetailsSection data={data} showRaw={true} />
        </div>
      );
    }
    
    // For regular users, show the no reliable data alert
    return <NoReliableDataAlert confidenceScore={confidenceScore} />;
  }

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
      <LiteratureSummary 
        bulletPoints={formattedContent.bulletPoints} 
        sourcesReferenced={sourcesReferenced}
        reliability={reliability}
      />
      
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
