import React, { useEffect, useMemo, useState } from "react";
import { InteractionSource } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { DetailsSection } from "./DetailsSection";
import { FormattedContentSection } from "./FormattedContentSection";
import { SourceMetadataSection } from "./SourceMetadataSection";
import { getSourceDisclaimer, getSourceContribution } from "./utils";
import { getCmsUsageStats } from "@/services/getCmsUsageOnly";

interface Props {
  data: InteractionSource[];
  medications: string[];
  clinicianView?: boolean;
}

// Local state to hold CMS Part D usage
const useRealWorldUsage = (medName: string) => {
  const [usage, setUsage] = useState<{ total_beneficiaries: number } | null>(null);
  useEffect(() => {
    if (!medName) return;
    getCmsUsageStats(medName)
      .then(stats => setUsage({ total_beneficiaries: stats.users }))
      .catch(console.error);
  }, [medName]);
  return usage;
};

export function AdverseEventsSourceContent({ data, medications, clinicianView }: Props) {
  // Pull in CMS usage for first med
  const cmsUsage = useRealWorldUsage(medications[0]);

  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No adverse event data available.</p>
      </div>
    );
  }

  // Extract adverse events data with proper fallbacks and optional chaining
  const {
    totalEvents: eventCount = 0,
    seriousEvents: seriousCount = 0,
    commonReactions = []
  } = data[0].rawData?.adverseEvents || {};

  // Build your details string, weaving in CMS usage when available
  const detailsText = useMemo(() => {
    const base = `${eventCount.toLocaleString()} adverse events reported, with ${seriousCount} serious cases (${((seriousCount/eventCount)*100).toFixed(2)}%).`;
    if (cmsUsage) {
      const pctOfUsers = ((eventCount / cmsUsage.total_beneficiaries) * 100).toFixed(2);
      return `${base} Out of ${cmsUsage.total_beneficiaries.toLocaleString()} people who claimed this medication in CMS Part D, that's ${pctOfUsers}% of users. Common reactions include: ${commonReactions.join(", ")}.`;
    }
    return `${base} Common reactions include: ${commonReactions.join(", ")}.`;
  }, [eventCount, seriousCount, commonReactions, cmsUsage]);

  // Update the data object with the details text
  const updatedData = useMemo(() => {
    if (!data[0]) return data;
    return [{
      ...data[0],
      description: detailsText
    }];
  }, [data, detailsText]);

  return (
    <div className="pb-6">
      {/* Source Metadata */}
      <SourceMetadataSection 
        data={updatedData} 
        sourceName="OpenFDA Adverse Events"
        isClinicianView={clinicianView}
      />
      
      {/* Severity and confidence at the top */}
      <SeverityConfidenceSection data={updatedData} clinicianView={clinicianView} />
      
      {/* Adverse Events Summary */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h4 className="font-medium mb-2">Adverse Events Summary</h4>
        <p className="text-gray-700">
          {detailsText}
        </p>
      </div>
      
      {/* Raw details section */}
      <DetailsSection data={updatedData} showRaw={clinicianView} />
      
      {/* Source disclaimer */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 italic">
        {getSourceDisclaimer("OpenFDA Adverse Events")}
      </div>
      
      {/* Contribution to severity score */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        {getSourceContribution(updatedData[0])}
      </div>
    </div>
  );
}
