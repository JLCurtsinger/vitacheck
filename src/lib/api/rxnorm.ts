
/**
 * RxNorm API Integration Module
 * Handles interactions with the RxNorm API for medication lookups and interaction checking.
 * Enhanced with a comprehensive fallback system for improved resilience.
 * 
 * This is a barrel file that re-exports functionality from more focused modules.
 */

// Export main functionality
export { getRxCUI } from './services/rxcui-lookup';
export { getDrugInteractions } from './services/drug-interactions';

// Also export types for better TypeScript integration
export interface RxNormResponse {
  status: "success" | "error";
  data?: {
    idGroup?: {
      rxnormId?: string[];
    };
  };
  error?: string;
  details?: string;
  message?: string;
}

export interface RxNormInteractionResponse {
  status: "success" | "error";
  data?: {
    fullInteractionTypeGroup?: Array<{
      fullInteractionType: Array<{
        interactionPair: Array<{
          description: string;
          severity?: string;
        }>;
      }>;
    }>;
  };
  error?: string;
  details?: string;
  message?: string;
}
