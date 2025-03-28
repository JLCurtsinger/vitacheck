
import { useMemo } from "react";
import { InteractionResult } from "@/lib/api-utils";
import { InteractionCard } from "./InteractionCard";
import { getRiskAssessment } from "./utils/risk-utils";

interface InteractionGroupProps {
  interactions: InteractionResult[];
  openSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
  groupName: string;
  emptyMessage?: string;
}

export function InteractionGroup({ 
  interactions, 
  openSections, 
  toggleSection,
  groupName,
  emptyMessage = "No data available for this group."
}: InteractionGroupProps) {
  if (interactions.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl shadow border">
        <p className="text-center text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {interactions.map((interaction, index) => {
        const id = `${groupName}-${interaction.medications.join('-')}-${index}`;
        const label = 'label' in interaction ? (interaction as any).label : interaction.medications.join(' + ');
        const risk = getRiskAssessment(interaction);
        
        return (
          <InteractionCard
            key={id}
            interaction={interaction}
            id={id}
            label={label}
            isOpen={openSections[id] !== false}
            onToggle={() => toggleSection(id)}
            risk={risk}
          />
        );
      })}
    </div>
  );
}
