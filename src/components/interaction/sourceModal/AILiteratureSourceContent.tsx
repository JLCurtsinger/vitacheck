
import React, { useMemo } from "react";
import { InteractionSource } from "@/lib/api/types";
import { formatDescriptionText } from "../utils/formatDescription";
import { UnreliableDataView } from "./aiLiterature/UnreliableDataView";
import { ReliableDataView } from "./aiLiterature/ReliableDataView";

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
    referencedSources,
    reliability,
    bulletPoints,
    citations
  } = useMemo(() => {
    if (data.length === 0) return { 
      hasReliableData: false, 
      confidenceScore: 0,
      referencedSources: [],
      reliability: { isReliable: false },
      bulletPoints: [],
      citations: []
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
    
    // Process all descriptions from all source items
    const allDescriptions = data.map(item => item.description).filter(Boolean).join(". ");
    
    // Format the text into bullet points
    const formattedBulletPoints = formatDescriptionText(allDescriptions, medications);
    
    // Extract any citations or references
    const extractedCitations: string[] = [];
    
    // Extract citation text if available
    data.forEach(item => {
      if (item.rawData?.citations && Array.isArray(item.rawData.citations)) {
        extractedCitations.push(...item.rawData.citations);
      }
      
      // Look for citation-like text in the description
      if (item.description) {
        const citationRegex = /\[([\d,\s]+)\]/g;
        let match;
        while ((match = citationRegex.exec(item.description)) !== null) {
          extractedCitations.push(match[0]);
        }
      }
    });
    
    return { 
      hasReliableData: explicitlyReliable || implicitlyReliable,
      confidenceScore: avgConfidence,
      referencedSources: [...new Set(sources)],
      reliability: reliabilityInfo,
      bulletPoints: formattedBulletPoints,
      citations: [...new Set(extractedCitations)]
    };
  }, [data, medications]);
  
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

  // Show appropriate view based on data reliability
  return hasReliableData ? (
    <ReliableDataView
      data={data}
      confidenceScore={confidenceScore}
      sourcesReferenced={sourcesReferenced}
      bulletPoints={bulletPoints}
      citations={citations}
      medications={medications}
      reliability={reliability}
      clinicianView={clinicianView}
    />
  ) : (
    <UnreliableDataView
      data={data}
      confidenceScore={confidenceScore}
      sourcesReferenced={sourcesReferenced}
      bulletPoints={bulletPoints}
      reliability={reliability}
      clinicianView={clinicianView}
    />
  );
}
