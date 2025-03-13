
import { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { renderHTML } from "../utils/formatDescription";

interface GeneralInfoProps {
  generalInfo: string[];
  defaultOpen: boolean;
}

export function GeneralInfo({ generalInfo, defaultOpen = false }: GeneralInfoProps) {
  const [showGeneralInfo, setShowGeneralInfo] = useState(defaultOpen);
  
  if (generalInfo.length === 0) return null;
  
  return (
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
  );
}
