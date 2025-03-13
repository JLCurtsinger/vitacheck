
import { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { createHTMLProps } from "../utils/formatDescription";

interface ModerateRisksProps {
  moderateRisks: string[];
  defaultOpen: boolean;
}

export function ModerateRisks({ moderateRisks, defaultOpen = false }: ModerateRisksProps) {
  const [showModerateRisks, setShowModerateRisks] = useState(defaultOpen);
  
  // Ensure the component respects changes to defaultOpen prop
  useEffect(() => {
    setShowModerateRisks(defaultOpen);
  }, [defaultOpen]);
  
  if (moderateRisks.length === 0) return null;
  
  return (
    <div className="mb-4 border border-yellow-200 rounded">
      <button 
        onClick={() => setShowModerateRisks(!showModerateRisks)}
        className="w-full p-3 flex items-center justify-between bg-yellow-50/70 text-yellow-700 font-medium hover:bg-yellow-50"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          ⚠️ Moderate Risks - Important Precautions 
        </div>
        {showModerateRisks ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      
      {showModerateRisks && (
        <div className="p-3">
          <table className="w-full border-collapse">
            <thead className="bg-yellow-50">
              <tr>
                <th className="p-2 text-left">Precaution</th>
                <th className="p-2 text-left">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {moderateRisks.map((point, index) => (
                <tr key={index} className="border-b border-yellow-100">
                  <td className="p-2" dangerouslySetInnerHTML={createHTMLProps(point)}></td>
                  <td className="p-2">
                    Monitor for side effects. Consult healthcare provider if symptoms occur.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
