
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

  useEffect(() => {
    if (!medications.length) {
      navigate("/check");
      return;
    }

    const fetchInteractions = async () => {
      try {
        console.log('Fetching interactions for medications:', medications);
        const results = await checkInteractions(medications);
        
        // Sort interactions by severity (severe -> minor -> unknown -> safe)
        const sortedResults = [...results].sort((a, b) => {
          const severityOrder = {
            "severe": 0,
            "minor": 1, 
            "unknown": 2,
            "safe": 3
          };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });
        
        setInteractions(sortedResults);
        
        // Check if any interaction was found
        setHasAnyInteraction(results.some(result => 
          result.severity === "minor" || result.severity === "severe"
        ));
        
        console.log('Interaction results:', {
          count: results.length,
          hasInteractions: results.some(r => r.severity === "minor" || r.severity === "severe")
        });
      } catch (error) {
        console.error('Error checking interactions:', error);
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
  }, [medications, navigate, toast]);

  return {
    loading,
    interactions,
    hasAnyInteraction
  };
}
