
import { useState, useEffect } from 'react';
import { 
  fetchPubMedIds, 
  fetchPubMedAbstracts, 
  summarizePubMedAbstracts 
} from '@/lib/api/services/pubmed';

interface PubMedFallbackResult {
  summary: string | null;
  isLoading: boolean;
  error: string | null;
  sourceIds: string[];
}

/**
 * Hook to handle fetching PubMed fallback data when structured interactions are not found
 * 
 * @param searchTerm - Medication name to search for
 * @param shouldFetch - Whether to initiate the fallback process
 * @returns PubMed summary, loading state, error state, and source IDs
 */
export function usePubMedFallback(
  searchTerm: string | undefined,
  shouldFetch: boolean
): PubMedFallbackResult {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceIds, setSourceIds] = useState<string[]>([]);

  useEffect(() => {
    // Only run if we have a search term and should fetch
    if (!searchTerm || !shouldFetch) {
      return;
    }

    const fetchPubMedFallback = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`[PubMed Fallback] Starting fallback process for: ${searchTerm}`);
        
        // Step 1: Fetch PubMed article IDs
        const ids = await fetchPubMedIds(searchTerm);
        setSourceIds(ids);
        
        if (!ids || ids.length === 0) {
          console.log(`[PubMed Fallback] No PubMed IDs found for: ${searchTerm}`);
          setSummary('No scientific literature was found for this substance.');
          setIsLoading(false);
          return;
        }
        
        console.log(`[PubMed Fallback] Found ${ids.length} PubMed IDs: ${ids.join(', ')}`);
        
        // Step 2: Fetch article abstracts
        const abstractText = await fetchPubMedAbstracts(ids);
        
        if (!abstractText || abstractText.trim() === '') {
          console.log(`[PubMed Fallback] No abstracts found for IDs: ${ids.join(', ')}`);
          setSummary('No detailed information could be extracted from the scientific literature.');
          setIsLoading(false);
          return;
        }
        
        // Step 3: Generate summary using Netlify function
        const summaryText = await summarizePubMedAbstracts(abstractText, searchTerm);
        console.log(`[PubMed Fallback] Generated summary for: ${searchTerm}`);
        
        setSummary(summaryText);
      } catch (err) {
        console.error('[PubMed Fallback] Error in fallback process:', err);
        setError(`Failed to retrieve scientific literature: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setSummary('Could not retrieve scientific literature at this time.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPubMedFallback();
  }, [searchTerm, shouldFetch]);

  return { summary, isLoading, error, sourceIds };
}
