
import React from "react";

export function SeverityLegend() {
  return (
    <div className="mt-4 text-xs space-y-1 text-gray-600">
      <div>
        <span className="inline-block w-3 h-3 rounded-full bg-red-600 mr-1"></span> 
        <strong>Severe Interaction:</strong> ≥1% of total cases are severe
      </div>
      <div>
        <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span> 
        <strong>Moderate Interaction:</strong> 0.1% - 0.99% of cases are severe
      </div>
      <div>
        <span className="inline-block w-3 h-3 rounded-full bg-green-600 mr-1"></span> 
        <strong>Minor Interaction:</strong> &lt;0.1% of cases are severe
      </div>
      <div>
        <span className="inline-block w-3 h-3 rounded-full bg-gray-400 mr-1"></span> 
        <strong>No Known Interaction:</strong> 0 reports found
      </div>
    </div>
  );
}
