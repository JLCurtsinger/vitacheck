
import { useState, useEffect } from "react";
import { InteractionResult } from "@/lib/api-utils";
import { cn } from "@/lib/utils";
import { AlertCircle, FileText } from "lucide-react";
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
    // Reset all to closed first
    setShowModerateRisks(false);
    setShowGeneralInfo(false);
    
    // Then open the highest priority section
    if (hasSevereRisks) {
      // Severe risks are always visible, no need to set state
    } else if (hasModerateRisks) {
      setShowModerateRisks(true);
    } else if (hasGeneralInfo) {
      setShowGeneralInfo(true);
    }
  }, [interactionKey, hasSevereRisks, hasModerateRisks, hasGeneralInfo]);

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      interaction.severity === "severe" ? "bg-red-50/60 border-red-200" : 
      interaction.severity === "moderate" ? "bg-yellow-50/70 border-yellow-300" :
      interaction.severity === "minor" ? "bg-yellow-50/60 border-yellow-200" : 
      interaction.severity === "safe" ? "bg-green-50/60 border-green-200" : 
      "bg-gray-50/60 border-gray-200"
    )}>
      <h3 className={cn(
        "text-base font-semibold mb-3 pb-2 border-b flex items-center gap-2",
        interaction.severity === "severe" ? "text-red-700 border-red-200" : 
        interaction.severity === "moderate" ? "text-yellow-700 border-yellow-300" :
        interaction.severity === "minor" ? "text-yellow-600 border-yellow-200" : 
        interaction.severity === "safe" ? "text-green-700 border-green-200" : 
        "text-gray-700 border-gray-200"
      )}>
        {(interaction.severity === "severe" || interaction.severity === "moderate") && <AlertCircle className="h-5 w-5" />}
        {interaction.severity === "minor" && <AlertCircle className="h-5 w-5 text-yellow-500" />}
        {interaction.severity === "safe" && <FileText className="h-5 w-5" />}
        Clinical Interaction Information
      </h3>
      
      {/* Critical Warnings - Always visible */}
      <CriticalWarnings severeRisks={severeRisks} />
      
      {/* Moderate Risks - Expandable */}
      <ModerateRisks 
        moderateRisks={moderateRisks} 
        defaultOpen={showModerateRisks} 
        key={`moderate-${interactionKey}-${showModerateRisks}`}
      />
      
      {/* General Information - Expandable */}
      <GeneralInfo 
        generalInfo={generalInfo} 
        defaultOpen={showGeneralInfo}
        key={`general-${interactionKey}-${showGeneralInfo}`} 
      />
      
      {bulletPoints.length === 0 && (
        <div className="text-gray-700 italic p-2">
          No detailed clinical information available for this interaction. Please consult your healthcare provider.
        </div>
      )}
    </div>
  );
}
