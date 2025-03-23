
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InteractionSource } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, HelpCircle, XCircle } from "lucide-react";

interface SourceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: {
    name: string;
    data: InteractionSource[];
    medications: string[];
  } | null;
}

export function SourceDetailsModal({ isOpen, onClose, source }: SourceDetailsModalProps) {
  if (!source) return null;
  
  const { name, data, medications } = source;
  
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
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
        
        {data.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">No detailed information available for this source.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-md border">
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
            
            {name === "OpenFDA Adverse Events" && data[0]?.adverseEvents && (
              <div className="rounded-md border p-4">
                <h3 className="font-medium mb-2">Reported Adverse Events</h3>
                <p className="text-sm mb-2">Total events: {data[0].adverseEvents.eventCount}</p>
                <div className="grid grid-cols-2 gap-2">
                  {data[0].adverseEvents.events.slice(0, 8).map((event, idx) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                      {event.term} ({event.count})
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-sm text-gray-500 italic">
              Note: This data is sourced directly from the {name} database and represents 
              their assessment of this interaction.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
