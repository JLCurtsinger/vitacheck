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

  // Find the OpenFDA Adverse Events source and extract data
  const pairSource = data.find(d => d.name === "OpenFDA Adverse Events");
  const raw = pairSource?.rawData || {};

  const eventCount = raw.totalEvents ?? raw.adverseEvents?.totalEvents ?? raw.total ?? 0;
  const seriousCount = raw.seriousEvents ?? raw.adverseEvents?.seriousEvents ?? raw.serious ?? 0;
  const totalUsers = raw.total_beneficiaries ?? raw.users ?? 0;
  const commonReactions = raw.commonReactions ?? raw.adverseEvents?.commonReactions ?? [];

  const percent = totalUsers ? ((eventCount / totalUsers) * 100).toFixed(2) : "0.00";
  const seriousPercent = totalUsers ? ((seriousCount / totalUsers) * 100).toFixed(4) : "0.0000";

  // Build your details string
  const detailsText = useMemo(() => {
    return `${eventCount.toLocaleString()} adverse events reported, with ${seriousCount} serious cases (${seriousPercent}%). Out of ${totalUsers.toLocaleString()} people who claimed this medication in CMS Part D, that's ${percent}% of users. Common reactions include: ${commonReactions.join(", ") || "None listed"}.`;
  }, [eventCount, seriousCount, seriousPercent, totalUsers, percent, commonReactions]);

  // Update the data object with the details text
  const updatedData = useMemo(() => {
    if (!pairSource) return data;
    return [{
      ...pairSource,
      description: detailsText
    }];
  }, [data, pairSource, detailsText]);

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
          {eventCount.toLocaleString()} adverse events reported, with {seriousCount} serious cases ({seriousPercent}%).
          Out of {totalUsers.toLocaleString()} people who claimed this medication in CMS Part D, 
          that's {percent}% of users.
          <br />
          Common reactions include: {commonReactions.join(", ") || "None listed"}.
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
