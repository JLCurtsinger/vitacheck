
import React, { useMemo, useState } from "react";
import { InteractionSource } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { DetailsSection } from "./DetailsSection";
import { FormattedContentSection } from "./FormattedContentSection";
import { formatDescriptionText, categorizeBulletPoints } from "../utils/formatDescription";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SourceMetadataSection } from "./SourceMetadataSection";
import { getSourceDisclaimer, getSourceContribution } from "./utils";

interface RxNormSourceContentProps {
  data: InteractionSource[];
  medications: string[];
}

export function RxNormSourceContent({ data, medications }: RxNormSourceContentProps) {
  const [clinicianView, setClinicianView] = useState(false);
  
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
    <>
      {/* Clinician View Toggle */}
      <div className="flex items-center justify-end space-x-2 mb-4">
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
      <SourceMetadataSection data={data} sourceName="RxNorm" />
      
      {/* Severity and confidence at the top */}
      <SeverityConfidenceSection data={data} />
      
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
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 italic">
        {getSourceDisclaimer("RXNORM")}
      </div>
      
      {/* Contribution to severity score */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        {getSourceContribution(data[0])}
      </div>
    </>
  );
}
