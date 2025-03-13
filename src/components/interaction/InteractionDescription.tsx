
import { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { SourceAttribution } from "./SourceAttribution";
import { InteractionResult } from "@/lib/api-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InteractionDescriptionProps {
  interaction: InteractionResult;
}

export function InteractionDescription({ interaction }: InteractionDescriptionProps) {
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
  
  // Categorize bullet points by severity
  const severeRisks = bulletPoints.filter(point => 
    point.toLowerCase().includes('severe') || 
    point.toLowerCase().includes('fatal') || 
    point.toLowerCase().includes('death') ||
    point.toLowerCase().includes('dangerous') ||
    point.toLowerCase().includes('emergency') ||
    point.toLowerCase().includes('do not')
  );

  const moderateRisks = bulletPoints.filter(point => 
    !severeRisks.includes(point) && (
      point.toLowerCase().includes('caution') || 
      point.toLowerCase().includes('warning') ||
      point.toLowerCase().includes('moderate') ||
      point.toLowerCase().includes('monitor')
    )
  );

  const generalInfo = bulletPoints.filter(point => 
    !severeRisks.includes(point) && !moderateRisks.includes(point)
  );
  
  // Initialize state values based on content availability and priority
  const [showAdverseEvents, setShowAdverseEvents] = useState(false);
  
  // Set initial states based on priority - only one section open at a time
  const hasSevereRisks = severeRisks.length > 0;
  const hasModerateRisks = moderateRisks.length > 0;
  const hasGeneralInfo = generalInfo.length > 0;
  
  const [showModerateRisks, setShowModerateRisks] = useState(false);
  const [showGeneralInfo, setShowGeneralInfo] = useState(false);
  
  // Set the highest priority section to be open initially
  useEffect(() => {
    // Reset all to closed
    setShowModerateRisks(false);
    setShowGeneralInfo(false);
    
    // Then open highest priority section
    if (hasSevereRisks) {
      // Severe risks are always visible, no need to set state
    } else if (hasModerateRisks) {
      setShowModerateRisks(true);
    } else if (hasGeneralInfo) {
      setShowGeneralInfo(true);
    }
  }, [hasSevereRisks, hasModerateRisks, hasGeneralInfo]);
  
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
          "text-base font-semibold mb-3 pb-2 border-b flex items-center gap-2",
          interaction.severity === "severe" ? "text-red-700 border-red-200" : 
          interaction.severity === "minor" ? "text-yellow-700 border-yellow-200" : 
          interaction.severity === "safe" ? "text-green-700 border-green-200" : 
          "text-gray-700 border-gray-200"
        )}>
          {interaction.severity === "severe" && <AlertCircle className="h-5 w-5" />}
          {interaction.severity === "minor" && <AlertTriangle className="h-5 w-5" />}
          {interaction.severity === "safe" && <CheckCircle className="h-5 w-5" />}
          Clinical Interaction Information
        </h3>
        
        {/* Critical Warnings - Always visible */}
        {severeRisks.length > 0 && (
          <div className="mb-4">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-3">
              <div className="flex items-center gap-2 font-bold mb-2">
                <AlertCircle className="h-5 w-5" />
                🚨 Critical Warnings - Requires Immediate Attention
              </div>
              <div className="overflow-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="p-2 text-left">Risk</th>
                      <th className="p-2 text-left">Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {severeRisks.map((point, index) => (
                      <tr key={index} className="border-b border-red-200">
                        <td className="p-2">{renderHTML(point)}</td>
                        <td className="p-2 font-medium">
                          {point.toLowerCase().includes('fatal') || point.toLowerCase().includes('death') 
                            ? "Seek immediate medical advice. DO NOT combine these medications."
                            : "Contact healthcare provider before taking these medications together."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Moderate Risks - Expandable */}
        {moderateRisks.length > 0 && (
          <div className="mb-4 border border-yellow-200 rounded">
            <button 
              onClick={() => setShowModerateRisks(!showModerateRisks)}
              className="w-full p-3 flex items-center justify-between bg-yellow-50/70 text-yellow-700 font-medium hover:bg-yellow-50"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                ⚠️ Moderate Risks - Important Precautions 
              </div>
              {showModerateRisks ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {showModerateRisks && (
              <div className="p-3">
                <table className="w-full border-collapse">
                  <thead className="bg-yellow-50">
                    <tr>
                      <th className="p-2 text-left">Precaution</th>
                      <th className="p-2 text-left">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moderateRisks.map((point, index) => (
                      <tr key={index} className="border-b border-yellow-100">
                        <td className="p-2">{renderHTML(point)}</td>
                        <td className="p-2">
                          Monitor for side effects. Consult healthcare provider if symptoms occur.
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* General Information - Expandable */}
        {generalInfo.length > 0 && (
          <div className="mb-2 border border-gray-200 rounded">
            <button 
              onClick={() => setShowGeneralInfo(!showGeneralInfo)}
              className="w-full p-3 flex items-center justify-between bg-gray-50/70 text-gray-700 font-medium hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ℹ️ General Information
              </div>
              {showGeneralInfo ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            
            {showGeneralInfo && (
              <div className="p-3 space-y-2">
                {generalInfo.map((point, index) => (
                  <div key={index} className="flex items-start gap-2 py-1 border-b border-gray-100">
                    <span className="mt-1">•</span>
                    <p className="text-gray-700">{renderHTML(point)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* When no bulletpoints are found */}
        {bulletPoints.length === 0 && (
          <div className="text-gray-700 italic p-2">
            No detailed clinical information available for this interaction. Please consult your healthcare provider.
          </div>
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

