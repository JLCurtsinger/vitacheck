
import React, { useMemo } from "react";
import { InteractionSource } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { DetailsSection } from "./DetailsSection";
import { formatDescriptionText, createHTMLProps } from "../utils/formatDescription";

interface AILiteratureSourceContentProps {
  data: InteractionSource[];
  medications: string[];
}

export function AILiteratureSourceContent({ data, medications }: AILiteratureSourceContentProps) {
  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No detailed information available for this source.</p>
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

  return (
    <>
      {/* Severity and confidence at the top */}
      <SeverityConfidenceSection data={data} />
      
      {/* Literature Analysis Summary first */}
      <div className="rounded-md border mb-4 p-4">
        <h3 className="font-medium mb-2">Literature Analysis</h3>
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
      
      {/* Raw details section moved to the bottom */}
      <DetailsSection data={data} />
    </>
  );
}
