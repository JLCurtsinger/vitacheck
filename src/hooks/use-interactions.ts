
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
  const [requestId, setRequestId] = useState<string>(`req-${Date.now()}`); // Track request ID to prevent stale results

  useEffect(() => {
    if (!medications.length) {
      navigate("/check");
      return;
    }

    // Generate new request ID for this specific search
    const currentRequestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setRequestId(currentRequestId);
    
    const fetchInteractions = async () => {
      try {
        console.log(`[${currentRequestId}] Fetching interactions for medications:`, medications);
        setLoading(true);
        
        const results = await checkInteractions(medications);
        
        // Ensure we're not processing stale results from a previous request
        if (requestId !== currentRequestId) {
          console.log(`[${currentRequestId}] Ignoring stale results for previous request ${requestId}`);
          return;
        }
        
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
        
        console.log(`[${currentRequestId}] Sorted ${sortedResults.length} interaction results by severity`);
        
        setInteractions(sortedResults);
        
        // Check if any significant interaction was found (severe or moderate)
        setHasAnyInteraction(results.some(result => 
          result.severity === "minor" || 
          result.severity === "moderate" || 
          result.severity === "severe"
        ));
        
        console.log(`[${currentRequestId}] Interaction results:`, {
          count: results.length,
          hasInteractions: results.some(r => 
            r.severity === "minor" || 
            r.severity === "moderate" || 
            r.severity === "severe"
          ),
          severities: results.map(r => r.severity).join(', ')
        });
      } catch (error) {
        console.error(`[${currentRequestId}] Error checking interactions:`, error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check interactions. Please try again later."
        });
      } finally {
        if (requestId === currentRequestId) {
          setLoading(false);
        }
      }
    };

    fetchInteractions();
  }, [medications, navigate, toast, requestId]);

  return {
    loading,
    interactions,
    hasAnyInteraction
  };
}
