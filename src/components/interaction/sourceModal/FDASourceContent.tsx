import React, { useMemo, useEffect } from "react";
import { InteractionSource } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { DetailsSection } from "./DetailsSection";
import { FormattedContentSection } from "./FormattedContentSection";
import { formatDescriptionText, categorizeBulletPoints } from "../utils/formatDescription";
import { SourceMetadataSection } from "./SourceMetadataSection";
import { getSourceDisclaimer, getSourceContribution } from "./utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getCmsUsageStats } from "@/services/getCmsUsageOnly";

interface FDASourceContentProps {
  data: InteractionSource[];
  medications: string[];
  sourceName: string;
  clinicianView?: boolean;
}

export function FDASourceContent({ 
  data, 
  medications, 
  sourceName,
  clinicianView = false 
}: FDASourceContentProps) {
  // Add CMS usage data fetching
  useEffect(() => {
    const fetchCmsData = async () => {
      if (medications.length === 0) return;
      
      try {
        console.log(`[FDA Modal] Attempting to fetch CMS usage data for: ${medications[0]}`);
        const usageData = await getCmsUsageStats(medications[0]);
        console.log(`[FDA Modal] CMS usage data for ${medications[0]}:`, usageData);
      } catch (err) {
        console.error(`[FDA Modal] Error fetching CMS data for ${medications[0]}:`, err);
      }
    };

    fetchCmsData();
  }, [medications]);

  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No detailed information available from FDA drug labels.</p>
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

  // Extract any FDA-specific metadata
  const rawWarnings = useMemo(() => {
    const warnings: string[] = [];
    
    // Extract raw warnings from FDA data if available
    data.forEach(item => {
      if (item.rawData?.warnings && Array.isArray(item.rawData.warnings)) {
        warnings.push(...item.rawData.warnings);
      }
      if (item.rawData?.drug_interactions && Array.isArray(item.rawData.drug_interactions)) {
        warnings.push(...item.rawData.drug_interactions);
      }
    });
    
    return [...new Set(warnings)]; // Remove duplicates
  }, [data]);

  return (
    <div className="pb-6">
      {/* Source Metadata */}
      <SourceMetadataSection 
        data={data} 
        sourceName={sourceName}
        isClinicianView={clinicianView}
      />
      
      {/* Severity and confidence at the top */}
      <SeverityConfidenceSection data={data} clinicianView={clinicianView} />
      
      {/* Categorized FDA content sections - Severe risks first */}
      <FormattedContentSection 
        title="Critical Warnings" 
        points={formattedContent.categories.severeRisks}
        type="severe" 
      />
      
      {/* Moderate risks next */}
      <FormattedContentSection 
        title="Precautions" 
        points={formattedContent.categories.moderateRisks}
        type="warning" 
      />
      
      {/* General info last */}
      <FormattedContentSection 
        title="General Information" 
        points={formattedContent.categories.generalInfo}
        type="info" 
      />
      
      {/* Raw FDA Warnings if in clinician view */}
      {clinicianView && rawWarnings.length > 0 && (
        <div className="rounded-md border mb-4 p-4">
          <h3 className="font-medium mb-2">FDA Label Warnings</h3>
          <Accordion type="single" collapsible>
            <AccordionItem value="warnings">
              <AccordionTrigger className="text-sm">View Original Label Warnings</AccordionTrigger>
              <AccordionContent>
                <div className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-40">
                  <ul className="list-disc list-inside space-y-1">
                    {rawWarnings.map((warning, idx) => (
                      <li key={idx} className="mb-1 text-gray-800">{warning}</li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
      
      {/* Raw details section */}
      <DetailsSection data={data} showRaw={clinicianView} />
      
      {/* Source disclaimer */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 italic">
        {getSourceDisclaimer(sourceName)}
      </div>
      
      {/* Contribution to severity score */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        {getSourceContribution(data[0])}
      </div>
    </div>
  );
}
