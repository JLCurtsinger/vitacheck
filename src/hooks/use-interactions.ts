
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { checkInteractions, checkAllCombinations, CombinationResult } from "@/lib/api/medication-service";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Enhanced cache for storing interaction results
// This will persist during the session until the page is reloaded
const interactionCache = new Map<string, CombinationResult[]>();

export function useInteractions(medications: string[]) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<CombinationResult[]>([]);
  const [hasAnyInteraction, setHasAnyInteraction] = useState(false);
  const [requestId, setRequestId] = useState<string>(`req-${Date.now()}`);
  
  // Add states for different combination types
  const [singleResults, setSingleResults] = useState<CombinationResult[]>([]);
  const [pairResults, setPairResults] = useState<CombinationResult[]>([]);
  const [tripleResults, setTripleResults] = useState<CombinationResult[]>([]);

  // Create a cache key based on medications (sorted to ensure consistent key regardless of order)
  const getCacheKey = useCallback((meds: string[]) => {
    return [...meds].sort().join('|');
  }, []);

  useEffect(() => {
    // Generate a unique request ID for each new search
    const newRequestId = `req-${Date.now()}-${medications.join('-')}`;
    
    // Reset state for each new medication list
    setLoading(true);
    setInteractions([]);
    setSingleResults([]);
    setPairResults([]);
    setTripleResults([]);
    setHasAnyInteraction(false);
    setRequestId(newRequestId);
    
    console.log(`[${newRequestId}] Starting new interaction search for medications:`, medications);
    
    if (!medications.length) {
      navigate("/check");
      return;
    }

    const fetchInteractions = async () => {
      try {
        const cacheKey = getCacheKey(medications);

        // Check if we already have cached results for this exact set of medications
        if (interactionCache.has(cacheKey)) {
          console.log(`[${newRequestId}] Using cached interaction results for:`, medications);
          const cachedResults = interactionCache.get(cacheKey)!;
          
          // Apply the custom sorting function before setting state
          const sortedResults = applySortingRules(cachedResults);
          
          setInteractions(sortedResults);
          
          // Separate results by type
          setSingleResults(sortedResults.filter(r => r.type === 'single'));
          setPairResults(sortedResults.filter(r => r.type === 'pair'));
          setTripleResults(sortedResults.filter(r => r.type === 'triple'));
          
          // Check if any interaction was found with severity moderate or severe
          setHasAnyInteraction(sortedResults.some(result => 
            result.severity === "moderate" || result.severity === "severe" || result.severity === "minor"
          ));
          
          setLoading(false);
          return;
        }
        
        console.log(`[${newRequestId}] Fetching interactions for medications:`, medications);
        // Use the enhanced function that returns combination types
        const results = await checkAllCombinations(medications);
        
        // Log the results to help debug confidence score issues
        console.log(`[${newRequestId}] Received interaction results:`, 
          results.map(r => ({
            type: r.type,
            label: r.label,
            severity: r.severity, 
            confidenceScore: r.confidenceScore
          }))
        );
        
        // Apply the custom sorting function
        const sortedResults = applySortingRules(results);
        
        // Store results in cache
        interactionCache.set(cacheKey, sortedResults);
        
        setInteractions(sortedResults);
        
        // Separate results by type
        setSingleResults(sortedResults.filter(r => r.type === 'single'));
        setPairResults(sortedResults.filter(r => r.type === 'pair'));
        setTripleResults(sortedResults.filter(r => r.type === 'triple'));
        
        // Check if any interaction was found with severity moderate or severe
        setHasAnyInteraction(results.some(result => 
          result.severity === "moderate" || result.severity === "severe" || result.severity === "minor"
        ));
        
        // Log interaction check to database (non-blocking)
        if (user && medications.length > 0) {
          // Determine highest severity
          const severityOrder = {
            severe: 0,
            moderate: 1,
            minor: 2,
            unknown: 3,
            safe: 4,
          };
          
          const highestSeverity = results.reduce((highest, result) => {
            return severityOrder[result.severity] < severityOrder[highest]
              ? result.severity
              : highest;
          }, results[0]?.severity || 'unknown');
          
          // Insert into interaction_checks table (non-blocking, ignore errors)
          supabase
            .from('interaction_checks')
            .insert({
              user_id: user.id,
              medications: medications,
              highest_severity: highestSeverity,
              result_summary: null,
            })
            .then(({ error }) => {
              if (error) {
                console.error('Failed to log interaction check', error);
              }
            })
            .catch((err) => {
              console.error('Error logging interaction check', err);
            });
        }
        
        console.log(`[${newRequestId}] Interaction processing complete:`, {
          count: results.length,
          singles: sortedResults.filter(r => r.type === 'single').length,
          pairs: sortedResults.filter(r => r.type === 'pair').length,
          triples: sortedResults.filter(r => r.type === 'triple').length,
          hasInteractions: results.some(r => r.severity !== "safe" && r.severity !== "unknown")
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
  }, [medications, navigate, toast, getCacheKey]); 

  // Helper function to sort results by type and severity
  const applySortingRules = (results: CombinationResult[]): CombinationResult[] => {
    return [...results].sort((a, b) => {
      // First sort by type (triple > pair > single)
      const typeOrder = { 'triple': 0, 'pair': 1, 'single': 2 };
      const typeDiff = typeOrder[a.type] - typeOrder[b.type];
      
      if (typeDiff !== 0) return typeDiff;
      
      // Then sort by severity within each type
      const severityOrder = {
        "severe": 0,
        "moderate": 1,
        "minor": 2, 
        "unknown": 3,
        "safe": 4
      };
      
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  };

  return {
    loading,
    interactions,
    hasAnyInteraction,
    requestId,
    // Return separated results by type
    singleResults,
    pairResults,
    tripleResults
  };
}
