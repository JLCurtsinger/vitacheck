
import { useLocation } from "react-router-dom";
import { useInteractions } from "@/hooks/use-interactions";
import { LoadingIndicator } from "./results/LoadingIndicator";
import { ResultsHeader } from "./results/ResultsHeader";
import { InteractionsList } from "./results/InteractionsList";

export default function Results() {
  const location = useLocation();
  const medications = location.state?.medications || [];
  const { loading, interactions, hasAnyInteraction } = useInteractions(medications);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 pb-16 animate-fade-in">
      <ResultsHeader medications={medications} />
      
      <InteractionsList 
        interactions={interactions} 
        hasAnyInteraction={hasAnyInteraction} 
      />
    </div>
  );
}
