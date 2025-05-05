
import React from "react";

interface ReliabilityBannerProps {
  message: string;
}

export function ReliabilityBanner({ message }: ReliabilityBannerProps) {
  return (
    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
      <p className="text-sm text-amber-800">
        <strong>Low Confidence Analysis:</strong> {message}
      </p>
    </div>
  );
}
