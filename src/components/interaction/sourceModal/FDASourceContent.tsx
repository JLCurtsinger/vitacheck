
import React, { useMemo } from "react";
import { InteractionSource } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { DetailsSection } from "./DetailsSection";
import { FormattedContentSection } from "./FormattedContentSection";
import { formatDescriptionText, categorizeBulletPoints } from "../utils/formatDescription";

interface FDASourceContentProps {
  data: InteractionSource[];
  medications: string[];
}

export function FDASourceContent({ data, medications }: FDASourceContentProps) {
  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No detailed information available for this source.</p>
      </div>
    );
  }

  // Format description text into bullet points when the source changes
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
    <>
      {/* Severity and confidence at the top */}
      <SeverityConfidenceSection data={data} />
      
      {/* Categorized FDA content sections - Moderate risks and General info first */}
      <FormattedContentSection 
        title="Precautions" 
        points={formattedContent.categories.moderateRisks}
        type="warning" 
      />
      
      <FormattedContentSection 
        title="General Information" 
        points={formattedContent.categories.generalInfo}
        type="info" 
      />
      
      {/* Critical warnings next */}
      <FormattedContentSection 
        title="Critical Warnings" 
        points={formattedContent.categories.severeRisks}
        type="severe" 
      />
      
      {/* Raw details section moved to the bottom */}
      <DetailsSection data={data} />
    </>
  );
}
