
import React from "react";

interface DistributionBarProps {
  severeWidth: number;
  moderateWidth: number;
  minorWidth: number;
  hasData: boolean;
}

export function DistributionBar({ severeWidth, moderateWidth, minorWidth, hasData }: DistributionBarProps) {
  if (!hasData) {
    return <div className="text-gray-400 italic">No data available</div>;
  }

  return (
    <div 
      className="flex h-4 w-full overflow-hidden rounded-full bg-gray-200" 
      title={`Severe: ${severeWidth.toFixed(1)}%, Moderate: ${moderateWidth.toFixed(1)}%, Minor: ${minorWidth.toFixed(1)}%`}
    >
      {severeWidth > 0 && (
        <div 
          className="h-full bg-red-600" 
          style={{ width: `${severeWidth}%` }}
          aria-label={`Severe cases: ${severeWidth.toFixed(1)}%`}
        ></div>
      )}
      {moderateWidth > 0 && (
        <div 
          className="h-full bg-yellow-500" 
          style={{ width: `${moderateWidth}%` }}
          aria-label={`Moderate cases: ${moderateWidth.toFixed(1)}%`}
        ></div>
      )}
      {minorWidth > 0 && (
        <div 
          className="h-full bg-green-600" 
          style={{ width: `${minorWidth}%` }}
          aria-label={`Minor cases: ${minorWidth.toFixed(1)}%`}
        ></div>
      )}
    </div>
  );
}
