
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { checkInteractions, checkAllCombinations, CombinationResult } from "@/lib/api/medication-service";

// Enhanced cache for storing interaction results
// This will persist during the session until the page is reloaded
const interactionCache = new Map<string, CombinationResult[]>();

export function useInteractions(medications: string[]) {
  const navigate = useNavigate();
  const { toast } = useToast();
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
          
          setInteractions(cachedResults);
          
          // Separate results by type
          setSingleResults(cachedResults.filter(r => r.type === 'single'));
          setPairResults(cachedResults.filter(r => r.type === 'pair'));
          setTripleResults(cachedResults.filter(r => r.type === 'triple'));
          
          // Check if any interaction was found with severity moderate or severe
          setHasAnyInteraction(cachedResults.some(result => 
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
        
        // Sort interactions by severity (severe -> moderate -> minor -> unknown -> safe)
        const severityOrder = {
          "severe": 0,
          "moderate": 1,
          "minor": 2, 
          "unknown": 3,
          "safe": 4
        };
        
        // Sort within each type category
        const sortedResults = [...results].sort((a, b) => {
          // First sort by type (single, pair, triple)
          const typeOrder = { 'single': 0, 'pair': 1, 'triple': 2 };
          const typeDiff = typeOrder[a.type] - typeOrder[b.type];
          
          if (typeDiff !== 0) return typeDiff;
          
          // Then sort by severity within each type
          return severityOrder[a.severity] - severityOrder[b.severity];
        });
        
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
