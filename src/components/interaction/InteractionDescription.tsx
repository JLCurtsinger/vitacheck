
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChevronDown, ChevronUp, Info, XCircle, CheckCircle } from "lucide-react";
import { SourceAttribution } from "./SourceAttribution";
import { InteractionResult } from "@/lib/api-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InteractionDescriptionProps {
  interaction: InteractionResult;
  finalSeverity: "safe" | "minor" | "severe" | "unknown";
}

export function InteractionDescription({ interaction, finalSeverity }: InteractionDescriptionProps) {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showAdverseEvents, setShowAdverseEvents] = useState(false);
  
  // Get unique source names to display
  const sourceNames = Array.from(new Set(interaction.sources.map(s => s.name))).filter(name => 
    name !== "No Data Available" && name !== "Unknown"
  );
  
  // Helper to format description text into bullet points
  const formatDescriptionText = (text: string) => {
    if (!text) return [];
    
    // Split by common delimiters in medical text
    const sections = text.split(/(?:\. |; |\n)/g).filter(section => section.trim().length > 0);
    
    // Format each section
    return sections.map(section => {
      // Bold medication names if they appear in the text
      const formattedSection = section.replace(
        new RegExp(`(${interaction.medications.join('|')})`, 'gi'), 
        '<b>$1</b>'
      );
      
      // Bold key risk terms
      return formattedSection
        .replace(/(risk|warning|caution|avoid|severe|dangerous|fatal|death)/gi, '<b>$1</b>')
        .replace(/(\bdo not\b)/gi, '<b>$1</b>');
    });
  };
  
  // Get severity icon
  const getSeverityIcon = () => {
    switch (finalSeverity) {
      case "severe":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "minor":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "safe":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "unknown":
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get severity class
  const getSeverityClass = () => {
    switch (finalSeverity) {
      case "severe":
        return "text-red-600";
      case "minor":
        return "text-yellow-600";
      case "safe":
        return "text-green-600";
      case "unknown":
      default:
        return "text-gray-600";
    }
  };
  
  // Get severity title
  const getSeverityTitle = () => {
    const medicationNames = interaction.medications.join(" + ");
    
    switch (finalSeverity) {
      case "severe":
        return `🚨 Severe Interaction: ${medicationNames}`;
      case "minor":
        return `⚠️ Minor Interaction: ${medicationNames}`;
      case "safe":
        return `✅ Safe Combination: ${medicationNames}`;
      case "unknown":
      default:
        return `ℹ️ Unknown Interaction: ${medicationNames}`;
    }
  };
  
  // Format the description into bullet points
  const bulletPoints = formatDescriptionText(interaction.description);
  
  // Create a concise summary (first 2 bullet points or shortened description)
  const summary = bulletPoints.length > 0 
    ? bulletPoints.slice(0, 2)
    : [interaction.description?.substring(0, 150) + (interaction.description?.length > 150 ? "..." : "")];
  
  // Check if we have adverse event data
  const hasAdverseEvents = interaction.adverseEvents && interaction.adverseEvents.eventCount > 0;
  
  // Function to render HTML content safely
  const renderHTML = (html: string) => {
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };
  
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("font-medium", getSeverityClass())}>
          {getSeverityTitle()}
        </div>
      </div>
      
      {sourceNames.length > 0 && <SourceAttribution sources={sourceNames} />}

      {finalSeverity === "severe" ? (
        <Alert variant="destructive" className="mt-2 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            <p className="font-medium mb-2">Do not combine these medications without healthcare provider approval.</p>
            
            <div className="mt-2">
              {!showFullDetails ? (
                // Show summary
                <div>
                  {summary.map((point, index) => (
                    <div key={index} className="flex items-start gap-2 mb-1">
                      <span className="mt-1">🔹</span>
                      <p>{renderHTML(point)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                // Show all bullet points
                <div>
                  {bulletPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-2 mb-1">
                      <span className="mt-1">🔹</span>
                      <p>{renderHTML(point)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Adverse Events Section for Severe Interactions */}
            {hasAdverseEvents && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="font-medium text-red-700 mb-2">
                  ⚠️ Real-world reports suggest potential adverse reactions when combining these medications. Consult a doctor.
                </div>
                
                {showAdverseEvents && (
                  <div className="mt-2 text-sm">
                    <p className="mb-2">Based on FDA adverse event reports, the following reactions have been reported:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      {interaction.adverseEvents.commonReactions.map((reaction, index) => (
                        <li key={index} className="text-red-800">{reaction}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-red-600">
                      Total of {interaction.adverseEvents.eventCount} reports, including {interaction.adverseEvents.seriousCount} serious cases.
                    </p>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAdverseEvents(!showAdverseEvents)}
                  className="w-full mt-2 bg-white text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  {showAdverseEvents ? (
                    <>Hide Details <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>View Adverse Event Details <ChevronDown className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            )}
            
            {bulletPoints.length > 2 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="w-full mt-3 flex items-center justify-center gap-1"
              >
                {showFullDetails ? (
                  <>Show Less <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>View Full Details <ChevronDown className="h-4 w-4" /></>
                )}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            {getSeverityIcon()}
            <h3 className={cn("font-medium", getSeverityClass())}>
              {finalSeverity === "safe" ? "Safe to take together" : finalSeverity === "minor" ? "Minor interaction possible" : "Interaction status unknown"}
            </h3>
          </div>
          
          <div className="mt-3">
            {!showFullDetails ? (
              // Show summary
              <div>
                {summary.map((point, index) => (
                  <div key={index} className="flex items-start gap-2 mb-2">
                    <span className="mt-1">•</span>
                    <p className="text-gray-700">{renderHTML(point)}</p>
                  </div>
                ))}
              </div>
            ) : (
              // Show all bullet points
              <div>
                {bulletPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-2 mb-2">
                    <span className="mt-1">•</span>
                    <p className="text-gray-700">{renderHTML(point)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Adverse Events Section for Non-Severe Interactions */}
          {hasAdverseEvents && finalSeverity !== "safe" && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="font-medium text-yellow-700 mb-2">
                ⚠️ Real-world reports suggest potential adverse reactions when combining these medications. Consult a doctor.
              </div>
              
              {showAdverseEvents && (
                <div className="mt-2 text-sm">
                  <p className="mb-2">Based on FDA adverse event reports, the following reactions have been reported:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {interaction.adverseEvents.commonReactions.map((reaction, index) => (
                      <li key={index} className="text-yellow-800">{reaction}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-yellow-600">
                    Total of {interaction.adverseEvents.eventCount} reports, including {interaction.adverseEvents.seriousCount} serious cases.
                  </p>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdverseEvents(!showAdverseEvents)}
                className="w-full mt-2 bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50 hover:text-yellow-700"
              >
                {showAdverseEvents ? (
                  <>Hide Details <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>View Adverse Event Details <ChevronDown className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          )}
          
          {/* Safe Combination with No Adverse Events */}
          {finalSeverity === "safe" && !hasAdverseEvents && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <p className="font-medium">No significant adverse events reported for this combination.</p>
              </div>
            </div>
          )}
          
          {bulletPoints.length > 2 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="w-full mt-2 flex items-center justify-center gap-1"
            >
              {showFullDetails ? (
                <>Show Less <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>View Full Details <ChevronDown className="h-4 w-4" /></>
              )}
            </Button>
          )}
        </div>
      )}
      
      {interaction.sources.length > 1 && (
        <div className="mt-4 text-xs text-gray-500">
          <p>This result combines data from multiple medical databases to provide comprehensive information.</p>
        </div>
      )}
    </div>
  );
}
