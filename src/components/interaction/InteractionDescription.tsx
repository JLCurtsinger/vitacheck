
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChevronDown, ChevronUp, FileText, CheckCircle } from "lucide-react";
import { SourceAttribution } from "./SourceAttribution";
import { InteractionResult } from "@/lib/api-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InteractionDescriptionProps {
  interaction: InteractionResult;
}

export function InteractionDescription({ interaction }: InteractionDescriptionProps) {
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
    <div className="mb-6 space-y-4">
      {sourceNames.length > 0 && <SourceAttribution sources={sourceNames} />}

      {/* Clinical Interaction Description Section */}
      <div className={cn(
        "p-4 rounded-lg border",
        interaction.severity === "severe" ? "bg-red-50/60 border-red-200" : 
        interaction.severity === "minor" ? "bg-yellow-50/60 border-yellow-200" : 
        interaction.severity === "safe" ? "bg-green-50/60 border-green-200" : 
        "bg-gray-50/60 border-gray-200"
      )}>
        <h3 className={cn(
          "text-base font-semibold mb-3 pb-2 border-b",
          interaction.severity === "severe" ? "text-red-700 border-red-200" : 
          interaction.severity === "minor" ? "text-yellow-700 border-yellow-200" : 
          interaction.severity === "safe" ? "text-green-700 border-green-200" : 
          "text-gray-700 border-gray-200"
        )}>
          Clinical Interaction Information
        </h3>
        
        <div className="mt-3 space-y-3">
          {!showFullDetails ? (
            // Show summary
            <div className="space-y-3">
              {summary.map((point, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <p className="text-gray-700">{renderHTML(point)}</p>
                </div>
              ))}
            </div>
          ) : (
            // Show all bullet points
            <div className="space-y-3">
              {bulletPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <p className="text-gray-700">{renderHTML(point)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {bulletPoints.length > 2 && (
          <Button 
            variant="ghost" 
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
      </div>
      
      {/* FDA Adverse Event Section - always show if available, with improved formatting */}
      {hasAdverseEvents && (
        <div className={cn(
          "mt-4 p-4 rounded-lg border",
          interaction.adverseEvents.seriousCount > 0 
            ? "bg-red-50/60 border-red-200" 
            : "bg-yellow-50/60 border-yellow-200"
        )}>
          <h3 className={cn(
            "text-base font-semibold flex items-center gap-2 mb-3 pb-2 border-b",
            interaction.adverseEvents.seriousCount > 0 
              ? "text-red-700 border-red-200" 
              : "text-yellow-700 border-yellow-200"
          )}>
            <FileText className="h-4 w-4" />
            📝 Real-World Reports from FDA Adverse Events
          </h3>
          
          <div className="font-medium mb-3">
            {interaction.adverseEvents.seriousCount > 0 
              ? "⚠️ Real-world data shows serious adverse events reported for this combination. Consult a doctor before use."
              : "⚠️ Real-world reports suggest potential adverse reactions when combining these medications."}
          </div>
          
          <div className="text-sm mb-2">
            <span className="font-medium">Report Summary:</span> {interaction.adverseEvents.eventCount} total reports
            {interaction.adverseEvents.seriousCount > 0 && 
              `, including ${interaction.adverseEvents.seriousCount} serious cases`
            }
          </div>
          
          {showAdverseEvents ? (
            <div className="mt-3 space-y-1">
              <div className="font-medium mb-1">Common reported reactions:</div>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {interaction.adverseEvents.commonReactions.map((reaction, index) => (
                  <li key={index} className={cn(
                    interaction.adverseEvents.seriousCount > 0 
                      ? "text-red-800" 
                      : "text-yellow-800"
                  )}>
                    {reaction}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAdverseEvents(!showAdverseEvents)}
            className={cn(
              "w-full mt-3",
              interaction.adverseEvents.seriousCount > 0 
                ? "bg-white text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700" 
                : "bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50 hover:text-yellow-700"
            )}
          >
            {showAdverseEvents ? (
              <>Hide Details <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>View Adverse Event Details <ChevronDown className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      )}
      
      {/* Safe Combination with No Adverse Events - show explicitly */}
      {interaction.severity === "safe" && !hasAdverseEvents && (
        <div className="mt-4 p-3 bg-green-50/60 border border-green-200 rounded-md">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <p className="font-medium">No significant adverse events reported for this combination.</p>
          </div>
        </div>
      )}
      
      {/* Sources information */}
      {interaction.sources.length > 1 && (
        <div className="mt-2 text-xs text-gray-500">
          <p>This result combines data from multiple medical databases to provide comprehensive information.</p>
        </div>
      )}
    </div>
  );
}
