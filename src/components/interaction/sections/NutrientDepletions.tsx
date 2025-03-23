
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NutrientDepletion } from "@/lib/api/utils/nutrient-depletion-utils";
import { cn } from "@/lib/utils";

interface NutrientDepletionsProps {
  depletions: NutrientDepletion[];
}

export function NutrientDepletions({ depletions }: NutrientDepletionsProps) {
  // If no depletions found, don't render anything
  if (!depletions || depletions.length === 0) {
    return null;
  }

  return (
    <div className="my-6 p-4 rounded-lg border border-gray-200 bg-gray-50/60">
      <h3 className="text-base font-semibold mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
        🧪 Possible Nutrient Depletions
      </h3>
      
      <p className="text-sm text-gray-600 mb-3">
        These medications may potentially deplete or reduce absorption of the following nutrients.
        Talk to your healthcare provider about whether supplementation is appropriate.
      </p>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Medication</TableHead>
              <TableHead className="w-1/2">Depleted Nutrient(s)</TableHead>
              <TableHead className="w-1/4">Sources</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {depletions.map((depletion, index) => (
              <TableRow key={`${depletion.medication}-${index}`}>
                <TableCell className="font-medium">{depletion.medication}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {depletion.depletedNutrients.map((nutrient, i) => (
                      <span 
                        key={`${nutrient}-${i}`}
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          nutrient.toLowerCase().includes("vitamin") ? "bg-blue-100 text-blue-800" :
                          nutrient.toLowerCase().includes("calcium") || nutrient.toLowerCase().includes("magnesium") ? "bg-amber-100 text-amber-800" :
                          nutrient.toLowerCase().includes("iron") ? "bg-red-100 text-red-800" :
                          nutrient.toLowerCase().includes("zinc") || nutrient.toLowerCase().includes("selenium") ? "bg-purple-100 text-purple-800" :
                          nutrient.toLowerCase().includes("potassium") || nutrient.toLowerCase().includes("sodium") ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-800"
                        )}
                      >
                        {nutrient}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{depletion.sources.join(", ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <p>Note: Nutrient depletion data comes from multiple sources and may not be complete. Consult with your healthcare provider before making any changes to your supplement regimen.</p>
      </div>
    </div>
  );
}
