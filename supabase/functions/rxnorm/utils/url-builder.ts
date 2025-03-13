
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
  const apiKey = Deno.env.get("RXNORM_API_KEY");
  
  if (!apiKey) {
    throw new Error("RxNorm API key not found in environment variables");
  }
  
  const queryParams = new URLSearchParams({
    ...endpoint.params,
    apiKey
  });
  
  return `${baseUrl}${endpoint.path}?${queryParams.toString()}`;
}
