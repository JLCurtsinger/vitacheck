
/**
 * PubMed Data Service
 * Handles fetching and processing data from the PubMed/Entrez E-Utilities API
 */

// Re-export all PubMed-related functions
export { fetchPubMedIds } from './fetch-ids';
export { fetchPubMedAbstracts } from './fetch-abstracts';
export { summarizePubMedAbstracts } from './summarize-abstracts';
