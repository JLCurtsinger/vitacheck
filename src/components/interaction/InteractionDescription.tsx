
import { useEffect, useState } from "react";
import { AlertCircle, FileText } from "lucide-react";
import { SourceAttribution } from "./SourceAttribution";
import { InteractionResult } from "@/lib/api-utils";
import { cn } from "@/lib/utils";
import { formatDescriptionText, categorizeBulletPoints } from "./utils/formatDescription";
import { CriticalWarnings } from "./sections/CriticalWarnings";
import { ModerateRisks } from "./sections/ModerateRisks";
import { GeneralInfo } from "./sections/GeneralInfo";
import { AdverseEvents } from "./sections/AdverseEvents";
import { SafeCombination } from "./sections/SafeCombination";
import { SeverityBreakdown } from "./sections/SeverityBreakdown";
import { NutrientDepletions } from "./sections/NutrientDepletions";
import { NutrientDepletion, analyzeNutrientDepletions } from "@/lib/api/utils/nutrient-depletion-utils";

interface InteractionDescriptionProps {
  interaction: InteractionResult;
}

export function InteractionDescription({ interaction }: InteractionDescriptionProps) {
  // Get unique source names to display
  const sourceNames = Array.from(new Set(interaction.sources.map(s => s.name))).filter(name => 
    name !== "No Data Available" && name !== "Unknown"
  );
  
  // Add adverse events source if available
  if (interaction.adverseEvents && interaction.adverseEvents.eventCount > 0) {
    if (!sourceNames.includes("OpenFDA Adverse Events")) {
      sourceNames.push("OpenFDA Adverse Events");
    }
  }
  
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
  
  // Check if we have adverse event data
  const hasAdverseEvents = interaction.adverseEvents && interaction.adverseEvents.eventCount > 0;
  
  // Generate a unique identifier for this interaction if id doesn't exist
  const interactionKey = interaction.id || 
    `${interaction.medications[0]}-${interaction.medications[1]}-${interaction.severity}`;
  
  // State for nutrient depletions
  const [nutrientDepletions, setNutrientDepletions] = useState<NutrientDepletion[]>([]);
  
  // Load nutrient depletion data
  useEffect(() => {
    const fetchNutrientDepletions = async () => {
      // Extract FDA warnings from sources
      const fdaWarnings: Record<string, string[]> = {};
      
      interaction.medications.forEach(med => {
        fdaWarnings[med] = [];
      });
      
      // Look for FDA warnings in the sources
      interaction.sources.forEach(source => {
        if (source.name === "FDA" && source.description) {
          // For pair interactions, just add to both medications for simplicity
          interaction.medications.forEach(med => {
            fdaWarnings[med].push(source.description);
          });
        }
      });
      
      const depletions = await analyzeNutrientDepletions(interaction.medications, fdaWarnings);
      setNutrientDepletions(depletions);
    };
    
    fetchNutrientDepletions();
  }, [interaction.medications, interaction.sources]);
  
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
    <div className="mb-6 space-y-4">
      {sourceNames.length > 0 && <SourceAttribution sources={sourceNames} interaction={interaction} />}

      {/* Clinical Interaction Description Section */}
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
      
      {/* Severity Breakdown Table - Pass adverseEvents data */}
      <SeverityBreakdown 
        sources={interaction.sources} 
        confidenceScore={interaction.confidenceScore}
        adverseEvents={interaction.adverseEvents}
      />
      
      {hasAdverseEvents && (
        <AdverseEvents adverseEvents={interaction.adverseEvents} />
      )}
      
      {/* Safe Combination with No Adverse Events */}
      <SafeCombination 
        isSafe={interaction.severity === "safe"} 
        hasAdverseEvents={hasAdverseEvents} 
      />
      
      {/* Nutrient Depletions Section */}
      <NutrientDepletions depletions={nutrientDepletions} />
      
      {/* Sources information */}
      {interaction.sources.length > 1 && (
        <div className="mt-2 text-xs text-gray-500">
          <p>This result combines data from multiple medical databases to provide comprehensive information.</p>
        </div>
      )}
    </div>
  );
}
