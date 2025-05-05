
/**
 * Re-export file for backward compatibility
 * This file re-exports all PubMed functions from the new modular structure
 * @deprecated Use direct imports from 'src/lib/api/services/pubmed' instead
 */

export { 
  fetchPubMedIds,
  fetchPubMedAbstracts,
  summarizePubMedAbstracts
} from './pubmed';

