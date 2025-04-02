
import React from "react";
import { FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface LiteratureCitationsProps {
  citations: string[];
  clinicianView: boolean;
}

export function LiteratureCitations({ citations, clinicianView }: LiteratureCitationsProps) {
  if (citations.length === 0) return null;

  return (
    <div className="rounded-md border mb-4 p-4 bg-amber-50">
      <h3 className="font-medium mb-2 flex items-center">
        <FileText className="h-4 w-4 mr-2 text-amber-700" />
        Literature Citations
      </h3>
      
      {clinicianView ? (
        <Accordion type="single" collapsible>
          <AccordionItem value="citations">
            <AccordionTrigger className="text-sm">View All Citations</AccordionTrigger>
            <AccordionContent>
              <div className="bg-amber-100/50 p-3 rounded text-sm">
                {citations.map((citation, idx) => (
                  <div key={idx} className="mb-1 text-amber-800">
                    {citation}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <div className="text-sm">
          {citations.slice(0, 3).map((citation, idx) => (
            <div key={idx} className="mb-1 text-amber-800">
              {citation}
            </div>
          ))}
          {citations.length > 3 && (
            <div className="text-amber-600 text-xs italic">
              And {citations.length - 3} more citations (activate Clinician View to see all)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
