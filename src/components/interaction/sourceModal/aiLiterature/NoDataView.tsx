
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileQuestion } from "lucide-react";

interface NoDataViewProps {
  clinicianView?: boolean;
}

export function NoDataView({ clinicianView = false }: NoDataViewProps) {
  return (
    <div className="p-6">
      <Alert variant="default" className="bg-gray-50 border-gray-200">
        <FileQuestion className="h-4 w-4 text-gray-700" />
        <AlertTitle className="text-gray-700">No Literature Analysis Available</AlertTitle>
        <AlertDescription className="text-gray-600">
          {clinicianView ? (
            <>
              No literature analysis data could be generated for this combination.
              This could be due to a lack of published research or technical constraints
              in retrieving or processing relevant information.
            </>
          ) : (
            <>
              There is currently no literature analysis available for this combination
              of medications or supplements.
            </>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
