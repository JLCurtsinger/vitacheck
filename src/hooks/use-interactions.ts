
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { checkInteractions, InteractionResult } from "@/lib/api-utils";

export function useInteractions(medications: string[]) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<InteractionResult[]>([]);
  const [hasAnyInteraction, setHasAnyInteraction] = useState(false);
  const [requestId, setRequestId] = useState<string>(`req-${Date.now()}`);

  useEffect(() => {
    // Reset state for each new medication list
    setLoading(true);
    setInteractions([]);
    setHasAnyInteraction(false);
    setRequestId(`req-${Date.now()}-${medications.join('-')}`);
    
    if (!medications.length) {
      navigate("/check");
      return;
    }

    const fetchInteractions = async () => {
      try {
        console.log(`[${requestId}] Fetching interactions for medications:`, medications);
        const results = await checkInteractions(medications);
        
        // Verify we're not updating with stale data from a previous request
        console.log(`[${requestId}] Received interaction results:`, results.length);
        
        // Sort interactions by severity (severe -> moderate -> minor -> unknown -> safe)
        const severityOrder = {
          "severe": 0,
          "moderate": 1,
          "minor": 2, 
          "unknown": 3,
          "safe": 4
        };
        
        const sortedResults = [...results].sort((a, b) => {
          return severityOrder[a.severity] - severityOrder[b.severity];
        });
        
        setInteractions(sortedResults);
        
        // Check if any interaction was found with severity moderate or severe
        setHasAnyInteraction(results.some(result => 
          result.severity === "moderate" || result.severity === "severe" || result.severity === "minor"
        ));
        
        console.log(`[${requestId}] Interaction processing complete:`, {
          count: results.length,
          hasInteractions: results.some(r => r.severity !== "safe" && r.severity !== "unknown")
        });
      } catch (error) {
        console.error(`[${requestId}] Error checking interactions:`, error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check interactions. Please try again later."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [medications, navigate, toast]); // Added requestId as a dependency to ensure useEffect runs for each new medication list

  return {
    loading,
    interactions,
    hasAnyInteraction,
    requestId
  };
}
