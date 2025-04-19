
import { useState, useEffect } from "react";
import { InteractionResult } from "@/lib/api-utils";
import { cn } from "@/lib/utils";
import { AlertCircle, FileText, Info } from "lucide-react";
import { formatDescriptionText, categorizeBulletPoints } from "../utils/formatDescription";
import { CriticalWarnings } from "./CriticalWarnings";
import { ModerateRisks } from "./ModerateRisks";
import { GeneralInfo } from "./GeneralInfo";

interface ClinicalInformationSectionProps {
  interaction: InteractionResult;
  interactionKey: string;
}

export function ClinicalInformationSection({ interaction, interactionKey }: ClinicalInformationSectionProps) {
  // Format the description into bullet points
  const bulletPoints = formatDescriptionText(interaction.description, interaction.medications);
  
  // Categorize bullet points by severity
  const { 
    severeRisks, 
    moderateRisks, 
    generalInfo,
    hasSevereRisks,
    hasModerateRisks, 
    hasGeneralInfo 
  } = categorizeBulletPoints(bulletPoints);
  
  // Initialize state values based on content availability and priority
  const [showModerateRisks, setShowModerateRisks] = useState(false);
  const [showGeneralInfo, setShowGeneralInfo] = useState(false);
  
  // Set the highest priority section to be open initially
  useEffect(() => {
    setShowModerateRisks(false);
    setShowGeneralInfo(false);
    
    if (hasSevereRisks) {
      // Severe risks are always visible
    } else if (hasModerateRisks) {
      setShowModerateRisks(true);
    } else if (hasGeneralInfo) {
      setShowGeneralInfo(true);
    }
  }, [interactionKey, hasSevereRisks, hasModerateRisks, hasGeneralInfo]);

  const getSeverityClasses = () => {
    switch (interaction.severity) {
      case "severe":
        return "bg-red-50/60 border-red-200";
      case "moderate":
        return "bg-yellow-50/70 border-yellow-300";
      case "minor":
        return "bg-yellow-50/60 border-yellow-200";
      case "safe":
        return "bg-green-50/60 border-green-200";
      default:
        return "bg-gray-50/60 border-gray-200";
    }
  };

  const getSeverityTitle = () => {
    switch (interaction.severity) {
      case "severe":
        return (
          <div className="text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            🔴 Critical Warnings – Requires Immediate Attention
          </div>
        );
      case "moderate":
        return (
          <div className="text-yellow-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            🟡 Moderate Risks – Important Precautions
          </div>
        );
      case "minor":
        return (
          <div className="text-yellow-600 flex items-center gap-2">
            <Info className="h-5 w-5" />
            🟢 Minor Interaction – Low Risk
          </div>
        );
      case "safe":
        return (
          <div className="text-green-700 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ✅ No Known Interaction
          </div>
        );
      default:
        return (
          <div className="text-gray-700 flex items-center gap-2">
            <Info className="h-5 w-5" />
            ⚠️ Interaction Risk – Not Enough Data
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      getSeverityClasses()
    )}>
      <h3 className={cn(
        "text-base font-semibold mb-3 pb-2 border-b",
        interaction.severity === "severe" ? "border-red-200" : 
        interaction.severity === "moderate" ? "border-yellow-300" :
        interaction.severity === "minor" ? "border-yellow-200" : 
        interaction.severity === "safe" ? "border-green-200" : 
        "border-gray-200"
      )}>
        {getSeverityTitle()}
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
