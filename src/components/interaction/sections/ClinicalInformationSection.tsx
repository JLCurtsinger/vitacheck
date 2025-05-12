import { AlertCircle, Info, FileText } from "lucide-react";
import { InteractionResult } from "@/lib/api-utils";
import { cn } from "@/lib/utils";
import { CriticalWarnings } from "./CriticalWarnings";
import { ModerateRisks } from "./ModerateRisks";
import { GeneralInfo } from "./GeneralInfo";
import { severityLabels, getSeverityIcon, getSeverityClasses, getSeverityTextClasses } from "@/lib/utils/severity-utils";

interface ClinicalInformationSectionProps {
  interaction: InteractionResult;
  interactionKey: string;
}

export function ClinicalInformationSection({ interaction, interactionKey }: ClinicalInformationSectionProps) {
  // Format the description into bullet points
  const bulletPoints = interaction.description
    ? interaction.description.split(/[•\n]/).filter(point => point.trim())
    : [];

  // Extract severe risks
  const severeRisks = bulletPoints.filter(point => 
    point.toLowerCase().includes("severe") || 
    point.toLowerCase().includes("serious") ||
    point.toLowerCase().includes("critical")
  );

  // Extract moderate risks
  const moderateRisks = bulletPoints.filter(point => 
    point.toLowerCase().includes("moderate") || 
    point.toLowerCase().includes("caution") ||
    point.toLowerCase().includes("warning")
  );

  // Get general info (everything else)
  const generalInfo = bulletPoints.filter(point => 
    !severeRisks.includes(point) && !moderateRisks.includes(point)
  );

  // Determine which sections to show by default
  const showModerateRisks = moderateRisks.length > 0;
  const showGeneralInfo = generalInfo.length > 0;

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      getSeverityClasses(interaction.severity)
    )}>
      <h3 className={cn(
        "text-base font-semibold mb-3 pb-2 border-b",
        getSeverityClasses(interaction.severity)
      )}>
        <div className={cn("flex items-center gap-2", getSeverityTextClasses(interaction.severity))}>
          {getSeverityIcon(interaction.severity)} {severityLabels[interaction.severity]}
        </div>
      </h3>
      
      {bulletPoints.length > 0 ? (
        <>
          <CriticalWarnings severeRisks={severeRisks} />
          <ModerateRisks 
            moderateRisks={moderateRisks} 
            defaultOpen={showModerateRisks}
            key={`moderate-${interactionKey}-${showModerateRisks}`}
          />
          <GeneralInfo 
            generalInfo={generalInfo} 
            defaultOpen={showGeneralInfo}
            key={`general-${interactionKey}-${showGeneralInfo}`} 
          />
        </>
      ) : (
        <div className="text-gray-700 italic p-2">
          No detailed clinical information available for this interaction. Please consult your healthcare provider.
        </div>
      )}
    </div>
  );
}
