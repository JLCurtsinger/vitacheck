
// Debug flag for logging
const isDebug = process.env.DEBUG === 'true';

/**
 * Process and normalize RxCUI parameters from various input formats
 * @param params - Request parameters that might contain rxcui or rxcuis
 * @returns Array of resolved RxCUIs
 */
export function processRxCuiParameters(params: any): string[] {
  // Extract common parameters
  const { rxcui, rxcuis } = params;
  
  // Initialize empty array for resolved RxCUIs
  let resolvedRxcuis: string[] = [];
  
  if (Array.isArray(rxcuis)) {
    // Use the array directly
    resolvedRxcuis = rxcuis.filter(Boolean);
    if (isDebug) {
      console.log(`🔍 RxNorm: Using provided rxcuis array: ${resolvedRxcuis.join(', ')}`);
    }
  } else if (rxcuis && typeof rxcuis === 'string') {
    // If rxcuis is a string (maybe '+' delimited), split it
    resolvedRxcuis = rxcuis.split('+').filter(Boolean);
    if (isDebug) {
      console.log(`🔍 RxNorm: Converting string rxcuis to array: ${resolvedRxcuis.join(', ')}`);
    }
  } else if (rxcui) {
    // Fallback to single rxcui if provided
    resolvedRxcuis = [rxcui].filter(Boolean);
    if (isDebug) {
      console.log(`🔍 RxNorm: Using single rxcui: ${rxcui}`);
    }
  }
  
  return resolvedRxcuis;
}
