
import React, { useMemo, useState } from "react";
import { InteractionSource } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { DetailsSection } from "./DetailsSection";
import { FormattedContentSection } from "./FormattedContentSection";
import { formatDescriptionText, categorizeBulletPoints } from "../utils/formatDescription";
import { SourceMetadataSection } from "./SourceMetadataSection";
import { getSourceDisclaimer, getSourceContribution } from "./utils";

interface RxNormSourceContentProps {
  data: InteractionSource[];
  medications: string[];
  clinicianView?: boolean;
}

export function RxNormSourceContent({ 
  data, 
  medications,
  clinicianView = false 
}: RxNormSourceContentProps) {
  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No detailed information available from RxNorm.</p>
      </div>
    );
  }

  // Format description text into bullet points
  const formattedContent = useMemo(() => {
    if (!data || data.length === 0) return { bulletPoints: [], categories: { severeRisks: [], moderateRisks: [], generalInfo: [] }};
    
    // Process all descriptions from all source items
    const allDescriptions = data.map(item => item.description).filter(Boolean).join(". ");
    
    // Format the text into bullet points
    const bulletPoints = formatDescriptionText(allDescriptions, medications);
    
    // Categorize bullet points
    const categories = categorizeBulletPoints(bulletPoints);
    
    return { bulletPoints, categories };
  }, [data, medications]);

  return (
    <div className="pb-6">
      {/* Source Metadata */}
      <SourceMetadataSection 
        data={data} 
        sourceName="RxNorm" 
        isClinicianView={clinicianView}
      />
      
      {/* Severity and confidence at the top */}
      <SeverityConfidenceSection data={data} clinicianView={clinicianView} />
      
      {/* Critical warnings first */}
      <FormattedContentSection 
        title="Critical Warnings" 
        points={formattedContent.categories.severeRisks}
        type="severe" 
      />
      
      {/* Precautions next */}
      <FormattedContentSection 
        title="Precautions" 
        points={formattedContent.categories.moderateRisks}
        type="warning" 
      />
      
      {/* General information */}
      <FormattedContentSection 
        title="General Information" 
        points={formattedContent.categories.generalInfo}
        type="info" 
      />
      
      {/* Raw details section */}
      <DetailsSection data={data} showRaw={clinicianView} />
      
      {/* Source disclaimer */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 italic">
        {getSourceDisclaimer("RXNORM")}
      </div>
      
      {/* Contribution to severity score */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        {getSourceContribution(data[0])}
      </div>
    </div>
  );
}
