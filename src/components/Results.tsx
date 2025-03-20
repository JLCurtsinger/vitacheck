
import { useLocation } from "react-router-dom";
import { useInteractions } from "@/hooks/use-interactions";
import { LoadingIndicator } from "./results/LoadingIndicator";
import { ResultsHeader } from "./results/ResultsHeader";
import { InteractionsList } from "./results/InteractionsList";
import { useEffect } from "react";

export default function Results() {
  const location = useLocation();
  const medications = location.state?.medications || [];
  
  // Create a unique key based on the medications to force re-renders
  const searchKey = `${medications.join('-')}-${Date.now()}`;
  
  const { loading, interactions, hasAnyInteraction, requestId } = useInteractions(medications);

  // Enhanced logging for debugging confidence score issues
  useEffect(() => {
    console.log(`Results component rendering with request ID: ${requestId}`);
    console.log('Current medications:', medications);
    console.log('Has interactions:', hasAnyInteraction);
    console.log('Interactions detail:', interactions.map(int => ({
      meds: int.medications.join('+'),
      severity: int.severity,
      confidenceScore: int.confidenceScore
    })));
  }, [medications, hasAnyInteraction, requestId, interactions]);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 pb-16 animate-fade-in">
      <ResultsHeader medications={medications} />
      
      <InteractionsList 
        key={searchKey} // Add unique key with timestamp to force complete re-render
        interactions={interactions} 
        hasAnyInteraction={hasAnyInteraction} 
      />
    </div>
  );
}
