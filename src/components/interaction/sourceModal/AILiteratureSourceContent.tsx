
import React, { useMemo } from "react";
import { InteractionSource } from "@/lib/api/types";
import { formatDescriptionText } from "../utils/formatDescription";
import { UnreliableDataView } from "./aiLiterature/UnreliableDataView";
import { ReliableDataView } from "./aiLiterature/ReliableDataView";
import { NoDataView } from "./aiLiterature/NoDataView";

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
    hasAnyData,
    confidenceScore,
    referencedSources,
    reliability,
    bulletPoints,
    citations,
    isFallbackMode,
    fallbackInfo,
    hasServiceError
  } = useMemo(() => {
    if (!data || data.length === 0) return { 
      hasReliableData: false,
      hasAnyData: false,
      confidenceScore: 0,
      referencedSources: [],
      reliability: { isReliable: false },
      bulletPoints: [],
      citations: [],
      isFallbackMode: false,
      fallbackInfo: null,
      hasServiceError: false
    };
    
    // Check for fallback mode
    const isFallback = data.some(item => item.fallbackMode);
    const fallbackReason = data.find(item => item.fallbackReason)?.fallbackReason;
    const fallbackSources = data.find(item => item.sources)?.sources || [];
    
    // Check for service error indicators
    const hasError = data.some(item => 
      item.errorMessage || 
      (item.description && item.description.toLowerCase().includes('error occurred')) ||
      (item.description && item.description.toLowerCase().includes('rate limit'))
    );
    
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
    
    // Check if we have any PubMed IDs (direct evidence)
    const hasPubMedIds = data.some(item => item.pubMedIds && item.pubMedIds.length > 0);
    
    // Extract reliability info
    const reliabilityInfo = {
      isReliable: explicitlyReliable || implicitlyReliable || isFallback,
      reason: data[0]?.validationReason || undefined,
      hasPubMedEvidence: hasPubMedIds
    };
    
    // Check if we have any data at all (even if not reliable)
    const hasAny = data.some(item => item.description && item.description.length > 15);
    
    // Process all descriptions from all source items
    const allDescriptions = data
      .map(item => item.description)
      .filter(Boolean)
      .join(". ");
    
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
    
    // Log diagnostic information to help debug 
    console.log(`[AI Literature Analysis] Modal content diagnostic:`, {
      hasReliableData: explicitlyReliable || implicitlyReliable || isFallback,
      hasAnyData: hasAny,
      confidenceScore: avgConfidence,
      hasServiceError: hasError,
      isUsingFallback: isFallback,
      hasPubMedEvidence: hasPubMedIds,
      bulletPointsCount: formattedBulletPoints.length
    });
    
    return { 
      hasReliableData: explicitlyReliable || implicitlyReliable || isFallback,
      hasAnyData: hasAny,
      confidenceScore: avgConfidence,
      referencedSources: [...new Set(sources)],
      reliability: reliabilityInfo,
      bulletPoints: formattedBulletPoints,
      citations: [...new Set(extractedCitations)],
      isFallbackMode: isFallback,
      fallbackInfo: isFallback ? {
        reason: fallbackReason,
        sources: fallbackSources
      } : null,
      hasServiceError: hasError
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

  // If we have no data, show the no data view
  if (!hasAnyData) {
    return <NoDataView clinicianView={clinicianView} />;
  }

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
      isFallbackMode={isFallbackMode}
      fallbackInfo={fallbackInfo}
      hasServiceError={hasServiceError}
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
