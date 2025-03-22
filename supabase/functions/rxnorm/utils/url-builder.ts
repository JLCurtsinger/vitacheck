
/**
 * Interface defining RxNorm API endpoint
 */
export interface RxNormEndpoint {
  path: string;
  params: Record<string, string>;
}

/**
 * Builds a complete URL for the RxNorm API
 * @param endpoint - The endpoint configuration
 * @returns Complete URL with query parameters
 */
export function buildRxNormUrl(endpoint: RxNormEndpoint): string {
  const baseUrl = "https://rxnav.nlm.nih.gov/REST";
  
  // Convert params to URL query string
  const queryParams = new URLSearchParams(endpoint.params);
  
  return `${baseUrl}${endpoint.path}?${queryParams.toString()}`;
}
