
import { AlertCircle } from "lucide-react";
import { renderHTML } from "../utils/formatDescription";

interface CriticalWarningsProps {
  severeRisks: string[];
}

export function CriticalWarnings({ severeRisks }: CriticalWarningsProps) {
  if (severeRisks.length === 0) return null;
  
  return (
    <div className="mb-4">
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-3">
        <div className="flex items-center gap-2 font-bold mb-2">
          <AlertCircle className="h-5 w-5" />
          🚨 Critical Warnings - Requires Immediate Attention
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead className="bg-red-50">
              <tr>
                <th className="p-2 text-left">Risk</th>
                <th className="p-2 text-left">Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {severeRisks.map((point, index) => (
                <tr key={index} className="border-b border-red-200">
                  <td className="p-2">{renderHTML(point)}</td>
                  <td className="p-2 font-medium">
                    {point.toLowerCase().includes('fatal') || point.toLowerCase().includes('death') 
                      ? "Seek immediate medical advice. DO NOT combine these medications."
                      : "Contact healthcare provider before taking these medications together."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
