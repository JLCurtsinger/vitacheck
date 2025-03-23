
import React, { useMemo } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InteractionSource, AdverseEventData } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, HelpCircle, Info, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDescriptionText, categorizeBulletPoints, createHTMLProps } from "./utils/formatDescription";

// We need to define a custom type to handle the special case for adverse events
interface SourceData extends InteractionSource {
  adverseEvents?: AdverseEventData;
}

interface SourceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: {
    name: string;
    data: SourceData[]; // Updated type to our custom interface
    medications: string[];
  } | null;
}

export function SourceDetailsModal({ isOpen, onClose, source }: SourceDetailsModalProps) {
  if (!source) return null;
  
  const { name, data, medications } = source;
  
  // Use useMemo to format description text into bullet points when the source changes
  const formattedContent = useMemo(() => {
    if (!data || data.length === 0) return { bulletPoints: [], categories: { severeRisks: [], moderateRisks: [], generalInfo: [] }};
    
    // Process all descriptions from all source items
    const allDescriptions = data.map(item => item.description).filter(Boolean).join(". ");
    
    // Format the text into bullet points
    const bulletPoints = formatDescriptionText(allDescriptions, medications);
    
    // Categorize bullet points
    const categories = categorizeBulletPoints(bulletPoints);
    
    return { bulletPoints, categories };
  }, [data, medications]);
  
  // Get the appropriate color class for the source header
  const getSourceColorClass = (sourceName: string) => {
    switch (sourceName.toUpperCase()) {
      case 'RXNORM':
        return "bg-blue-50 text-blue-700 border-blue-200";
      case 'FDA':
        return "bg-purple-50 text-purple-700 border-purple-200";
      case 'FDA ADVERSE EVENTS':
        return "bg-red-50 text-red-700 border-red-200";
      case 'SUPP.AI':
        return "bg-green-50 text-green-700 border-green-200";
      case 'AI LITERATURE ANALYSIS':
        return "bg-amber-50 text-amber-700 border-amber-200";
      case 'OPENFDA ADVERSE EVENTS':
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };
  
  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "severe":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "moderate":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "minor":
        return <HelpCircle className="h-4 w-4 text-blue-600" />;
      case "safe":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-600" />;
    }
  };
  
  // Determine if we should show the source-specific UI based on the source name
  const renderSourceSpecificUI = () => {
    if (data.length === 0) {
      return (
        <div className="p-6 text-center">
          <p className="text-gray-600">No detailed information available for this source.</p>
        </div>
      );
    }
    
    // Standard severity and confidence table for all sources
    const standardTable = (
      <div className="rounded-md border mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {getSeverityIcon(item.severity)}
                    <span className="capitalize">{item.severity}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {item.confidence ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {item.confidence}%
                    </Badge>
                  ) : "N/A"}
                </TableCell>
                <TableCell className="max-w-xs">
                  {item.description || "No detailed description available"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
    
    // Source-specific UI components based on source type
    if (name.toUpperCase().includes("ADVERSE")) {
      return (
        <>
          {standardTable}
          
          {data[0]?.adverseEvents && (
            <div className="rounded-md border p-4 mb-4">
              <h3 className="font-medium mb-2">Reported Adverse Events</h3>
              <p className="text-sm mb-2">Total events: {data[0].adverseEvents.eventCount}</p>
              <div className="grid grid-cols-2 gap-2">
                {data[0].adverseEvents.commonReactions && data[0].adverseEvents.commonReactions.length > 0 ? (
                  data[0].adverseEvents.commonReactions.slice(0, 8).map((reaction, idx) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                      {reaction}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-gray-500 text-sm">
                    No detailed event information available
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      );
    } else if (name.toUpperCase().includes("FDA")) {
      return (
        <>
          {standardTable}
          
          {/* Categorized FDA content sections */}
          {formattedContent.categories.severeRisks.length > 0 && (
            <div className="rounded-md border mb-4 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-medium text-red-600">Critical Warnings</h3>
              </div>
              <div className="space-y-2">
                {formattedContent.categories.severeRisks.map((point, idx) => (
                  <p key={idx} className="text-sm" dangerouslySetInnerHTML={createHTMLProps(point)} />
                ))}
              </div>
            </div>
          )}
          
          {formattedContent.categories.moderateRisks.length > 0 && (
            <div className="rounded-md border mb-4 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-600">Precautions</h3>
              </div>
              <div className="space-y-2">
                {formattedContent.categories.moderateRisks.map((point, idx) => (
                  <p key={idx} className="text-sm" dangerouslySetInnerHTML={createHTMLProps(point)} />
                ))}
              </div>
            </div>
          )}
          
          {formattedContent.categories.generalInfo.length > 0 && (
            <div className="rounded-md border mb-4 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-600">General Information</h3>
              </div>
              <div className="space-y-2">
                {formattedContent.categories.generalInfo.map((point, idx) => (
                  <p key={idx} className="text-sm" dangerouslySetInnerHTML={createHTMLProps(point)} />
                ))}
              </div>
            </div>
          )}
        </>
      );
    } else if (name.toUpperCase().includes("AI") || name.toUpperCase().includes("LITERATURE")) {
      return (
        <>
          {standardTable}
          
          {/* Literature Analysis Summary */}
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
        </>
      );
    }
    
    // Default UI for other sources
    return standardTable;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className={`rounded-lg px-3 py-1 inline-block ${getSourceColorClass(name)}`}>
            {name} Data Source
          </div>
          <DialogTitle className="text-xl mt-2">
            Interaction Details from {name}
          </DialogTitle>
          <DialogDescription>
            Information about {medications.join(' + ')} interaction from {name} database
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-10rem)] pr-4">
          <div className="space-y-4 pb-4">
            {renderSourceSpecificUI()}
            
            <div className="text-sm text-gray-500 italic">
              Note: This data is sourced directly from the {name} database and represents 
              their assessment of this interaction.
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
