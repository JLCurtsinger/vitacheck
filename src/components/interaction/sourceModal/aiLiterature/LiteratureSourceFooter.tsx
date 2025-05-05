
import React from "react";
import { InteractionSource } from "@/lib/api/types";

interface LiteratureSourceFooterProps {
  sourceData: InteractionSource;
  isFallback?: boolean;
}

export function LiteratureSourceFooter({ 
  sourceData,
  isFallback = false
}: LiteratureSourceFooterProps) {
  return (
    <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
      <p className="italic">
        {isFallback ? (
          <>
            This summary is generated from available data sources and is intended for informational purposes only.
            Always consult a healthcare provider before making decisions about medications.
          </>
        ) : (
          <>
            This summary is based on available medical literature and is intended for informational purposes only.
            Always consult a healthcare provider before making decisions about medications.
          </>
        )}
      </p>
      {sourceData && sourceData.pubMedIds && sourceData.pubMedIds.length > 0 && (
        <div className="mt-2 text-xs">
          <strong>PubMed References:</strong> {sourceData.pubMedIds.map(id => (
            <a 
              key={id}
              href={`https://pubmed.ncbi.nlm.nih.gov/${id}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-600 hover:underline"
            >
              {id}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
