
import React, { useMemo, useState } from "react";
import { InteractionSource } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { DetailsSection } from "./DetailsSection";
import { FormattedContentSection } from "./FormattedContentSection";
import { formatDescriptionText, categorizeBulletPoints } from "../utils/formatDescription";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SourceMetadataSection } from "./SourceMetadataSection";
import { getSourceDisclaimer, getSourceContribution } from "./utils";
import { ExternalLink } from "lucide-react";

interface SuppAISourceContentProps {
  data: InteractionSource[];
  medications: string[];
}

export function SuppAISourceContent({ data, medications }: SuppAISourceContentProps) {
  const [clinicianView, setClinicianView] = useState(false);
  
  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No detailed information available from SUPP.AI.</p>
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

  // Extract any evidence URLs from SUPP.AI data
  const evidenceLinks = useMemo(() => {
    const links: string[] = [];
    
    // Extract evidence URL if available in the raw data
    data.forEach(item => {
      if (item.rawData?.evidence_url) {
        links.push(item.rawData.evidence_url);
      }
      if (item.rawData?.evidence_urls && Array.isArray(item.rawData.evidence_urls)) {
        item.rawData.evidence_urls.forEach((url: string) => links.push(url));
      }
    });
    
    return [...new Set(links)]; // Remove duplicates
  }, [data]);

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
      <SourceMetadataSection data={data} sourceName="SUPP.AI" />
      
      {/* Severity and confidence at the top */}
      <SeverityConfidenceSection data={data} />
      
      {/* Literature Evidence Links if available */}
      {evidenceLinks.length > 0 && (
        <div className="rounded-md border mb-4 p-4 bg-green-50 border-green-200">
          <h3 className="font-medium mb-2 flex items-center">
            <ExternalLink className="h-4 w-4 mr-2 text-green-700" />
            Literature Evidence
          </h3>
          <div className="space-y-2">
            {evidenceLinks.map((link, idx) => (
              <div key={idx} className="flex">
                <Badge variant="outline" className="bg-green-100 border-green-300 text-green-800 text-xs">
                  Source {idx+1}
                </Badge>
                <a 
                  href={link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-sm text-green-700 hover:underline"
                >
                  View publication evidence
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
        {getSourceDisclaimer("SUPP.AI")}
      </div>
      
      {/* Contribution to severity score */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        {getSourceContribution(data[0])}
      </div>
    </>
  );
}
