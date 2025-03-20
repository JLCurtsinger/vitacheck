
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
    // Generate a truly unique request ID for each new search
    const newRequestId = `req-${Date.now()}-${medications.join('-')}`;
    
    // Reset state for each new medication list
    setLoading(true);
    setInteractions([]);
    setHasAnyInteraction(false);
    setRequestId(newRequestId);
    
    console.log(`[${newRequestId}] Starting new interaction search for medications:`, medications);
    
    if (!medications.length) {
      navigate("/check");
      return;
    }

    const fetchInteractions = async () => {
      try {
        console.log(`[${newRequestId}] Fetching interactions for medications:`, medications);
        const results = await checkInteractions(medications);
        
        // Log the results to help debug confidence score issues
        console.log(`[${newRequestId}] Received interaction results:`, 
          results.map(r => ({
            meds: r.medications.join('+'), 
            severity: r.severity, 
            confidenceScore: r.confidenceScore
          }))
        );
        
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
        
        console.log(`[${newRequestId}] Interaction processing complete:`, {
          count: results.length,
          hasInteractions: results.some(r => r.severity !== "safe" && r.severity !== "unknown"),
          confidenceScores: results.map(r => r.confidenceScore)
        });
      } catch (error) {
        console.error(`[${newRequestId}] Error checking interactions:`, error);
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
  }, [medications, navigate, toast]); // Removed requestId dependency to prevent infinite loops

  return {
    loading,
    interactions,
    hasAnyInteraction,
    requestId
  };
}
