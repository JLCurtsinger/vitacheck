
import React from "react";
import { InteractionSource } from "@/lib/api/types";
import { Info } from "lucide-react";

interface DetailsSectionProps {
  data: InteractionSource[];
}

export function DetailsSection({ data }: DetailsSectionProps) {
  return (
    <div className="rounded-md border mb-4 p-4">
      <h3 className="font-medium mb-2 flex items-center">
        <Info className="h-4 w-4 mr-2 text-gray-500" />
        Details
      </h3>
      <div className="text-sm text-gray-700 max-h-60 overflow-y-auto">
        {data.map((item, idx) => (
          <p key={idx}>{item.description || "No detailed description available"}</p>
        ))}
      </div>
    </div>
  );
}
