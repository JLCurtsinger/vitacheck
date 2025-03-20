
import { useLocation } from "react-router-dom";
import { useInteractions } from "@/hooks/use-interactions";
import { LoadingIndicator } from "./results/LoadingIndicator";
import { ResultsHeader } from "./results/ResultsHeader";
import { InteractionsList } from "./results/InteractionsList";
import { useEffect, useState } from "react";

export default function Results() {
  const location = useLocation();
  const [medications, setMedications] = useState<string[]>([]);
  const [searchKey, setSearchKey] = useState<string>(`search-${Date.now()}`);
  const { loading, interactions, hasAnyInteraction } = useInteractions(medications);
  
  // Update medications and search key when the location state changes
  useEffect(() => {
    const newMeds = location.state?.medications || [];
    setMedications(newMeds);
    // Generate a new search key to force a fresh API lookup
    setSearchKey(`search-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
    
    console.log("Results component received new medications:", newMeds);
  }, [location.state?.medications]);

  return (
    <div className="max-w-3xl mx-auto p-6 pb-16 animate-fade-in">
      <ResultsHeader medications={medications} />
      
      {loading ? (
        <LoadingIndicator />
      ) : (
        <InteractionsList 
          key={searchKey} // Force re-render when medications change
          interactions={interactions} 
          hasAnyInteraction={hasAnyInteraction} 
        />
      )}
    </div>
  );
}
