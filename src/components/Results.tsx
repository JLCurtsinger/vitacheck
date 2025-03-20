
import { useLocation } from "react-router-dom";
import { useInteractions } from "@/hooks/use-interactions";
import { LoadingIndicator } from "./results/LoadingIndicator";
import { ResultsHeader } from "./results/ResultsHeader";
import { InteractionsList } from "./results/InteractionsList";
import { useEffect } from "react";

export default function Results() {
  const location = useLocation();
  const medications = location.state?.medications || [];
  
  // Add key to force complete re-render when medications change
  const medicationsKey = medications.join('-');
  
  const { loading, interactions, hasAnyInteraction, requestId } = useInteractions(medications);

  // Log when component renders with new data
  useEffect(() => {
    console.log(`Results component rendering with request ID: ${requestId}`);
    console.log('Current medications:', medications);
    console.log('Has interactions:', hasAnyInteraction);
  }, [medications, hasAnyInteraction, requestId]);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 pb-16 animate-fade-in">
      <ResultsHeader medications={medications} />
      
      <InteractionsList 
        key={medicationsKey} // Add key to force fresh render
        interactions={interactions} 
        hasAnyInteraction={hasAnyInteraction} 
      />
    </div>
  );
}
