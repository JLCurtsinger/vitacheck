import { Handler } from '@netlify/functions';

// Type definitions for CMS API response
interface CmsDrugRecord {
  Gnrc_Name: string;
  Brnd_Name: string;
  Tot_Benes_2022: number;
  Tot_Clms_2022: number;
  Avg_Spnd_Per_Dsg_Unt_Wghtd_2022: number;
}

interface CmsApiResponse {
  data: CmsDrugRecord[];
}

// Type definitions for our function response
interface SuccessResponse {
  success: true;
  medication: string;
  matched_rows: number;
  totals: {
    total_beneficiaries: number;
    total_claims: number;
    average_dosage_spend: number;
  };
  rows?: CmsDrugRecord[];
}

interface ErrorResponse {
  success: false;
  medication: string;
  message: string;
}

type FunctionResponse = SuccessResponse | ErrorResponse;

// Helper function to normalize search terms
const normalizeSearchTerm = (term: string): string => {
  console.log(`[normalizeSearchTerm] Input: ${term}`);
  const normalized = term
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric characters
  console.log(`[normalizeSearchTerm] Output: ${normalized}`);
  return normalized;
};

// Helper function to check if strings match
const isMatch = (input: string, target: string): boolean => {
  console.log(`[isMatch] Comparing: "${input}" with "${target}"`);
  const normalizedInput = normalizeSearchTerm(input);
  const normalizedTarget = normalizeSearchTerm(target);
  
  // If either string is empty after normalization, return false
  if (!normalizedInput || !normalizedTarget) {
    console.log(`[isMatch] Empty after normalization, returning false`);
    return false;
  }
  
  // Check if one string contains the other
  const matches = normalizedInput.includes(normalizedTarget) || 
                 normalizedTarget.includes(normalizedInput);
  console.log(`[isMatch] Result: ${matches}`);
  return matches;
};

// Helper function to fetch CMS data
const fetchCmsData = async (searchTerm: string): Promise<CmsApiResponse> => {
  console.log(`[fetchCmsData] Starting fetch for: ${searchTerm}`);
  
  // Single keyword pull (up to 5000 rows)
  const url = 
    `https://data.cms.gov/data-api/v1/dataset/7e0b4365-fd63-4a29-8f5e-e0ac9f66a81b/data` +
    `?keyword=${encodeURIComponent(searchTerm)}` +
    `&size=5000`;
  console.log('🔍 [fetchCmsData] URL:', url);

  const response = await fetch(url);
  console.log(`[fetchCmsData] Response status: ${response.status}`);
  
  if (!response.ok) {
    console.error(`[fetchCmsData] Error response: ${response.status}`);
    throw new Error(`CMS API responded with status: ${response.status}`);
  }

  const json = await response.json();
  console.log(`[fetchCmsData] Raw response:`, json);
  
  // Normalize to array
  const records: CmsDrugRecord[] = Array.isArray(json)
    ? json
    : Array.isArray((json as any).data)
      ? (json as any).data
      : [];
  console.log(`[fetchCmsData] Normalized records length: ${records.length}`);

  // Now do our fuzzy match
  const matched = records.filter(record => {
    const matches = isMatch(searchTerm, record.Gnrc_Name) ||
                   isMatch(searchTerm, record.Brnd_Name);
    if (matches) {
      console.log(`[fetchCmsData] Matched record:`, record);
    }
    return matches;
  });
  console.log(`[fetchCmsData] Matched records length: ${matched.length}`);

  // Return in { data: [] } shape
  return { data: matched };
};

const handler: Handler = async (event) => {
  console.log(`[handler] Request received:`, event);
  
  try {
    // Get and validate the search term
    const searchTerm = event.queryStringParameters?.gnrc_name?.trim();
    console.log(`[handler] Search term: ${searchTerm}`);
    
    if (!searchTerm) {
      console.log(`[handler] No search term provided`);
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          medication: '',
          message: 'Medication name parameter is required'
        } as ErrorResponse)
      };
    }

    // Fetch data from CMS API
    console.log(`[handler] Fetching CMS data for: ${searchTerm}`);
    const data = await fetchCmsData(searchTerm);

    // If no data returned
    if (!data.data || data.data.length === 0) {
      console.log(`[handler] No data found for: ${searchTerm}`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          medication: searchTerm,
          message: 'No CMS data found for this medication name.'
        } as ErrorResponse)
      };
    }

    // Calculate totals from matched records
    console.log(`[handler] Calculating totals from ${data.data.length} records`);
    const totals = data.data.reduce((acc, record) => {
      const benes = Number(record.Tot_Benes_2022);
      if (!isNaN(benes)) {
        acc.total_beneficiaries += benes;
      }

      const clms = Number(record.Tot_Clms_2022);
      if (!isNaN(clms)) {
        acc.total_claims += clms;
      }

      const spend = Number(record.Avg_Spnd_Per_Dsg_Unt_Wghtd_2022);
      if (!isNaN(spend)) {
        acc.average_dosage_spend += spend;
        acc.validSpendCount++;
      }
      return acc;
    }, {
      total_beneficiaries: 0,
      total_claims: 0,
      average_dosage_spend: 0,
      validSpendCount: 0
    } as {
      total_beneficiaries: number;
      total_claims: number;
      average_dosage_spend: number;
      validSpendCount: number;
    });
    console.log(`[handler] Calculated totals:`, totals);

    // Calculate average spend per unit
    const averageSpend = totals.validSpendCount > 0
      ? totals.average_dosage_spend / totals.validSpendCount
      : 0;
    console.log(`[handler] Average spend: ${averageSpend}`);

    // Round all numbers to 2 decimal places
    const finalTotals = {
      total_beneficiaries: Math.round(totals.total_beneficiaries),
      total_claims: Math.round(totals.total_claims),
      average_dosage_spend: Math.round(averageSpend * 100) / 100
    };
    console.log(`[handler] Final totals:`, finalTotals);

    const successResponse: SuccessResponse = {
      success: true,
      medication: searchTerm,
      matched_rows: data.data.length,
      totals: finalTotals,
      rows: data.data // Include matched records for diagnostics
    };
    console.log(`[handler] Success response:`, successResponse);

    return {
      statusCode: 200,
      body: JSON.stringify(successResponse)
    };

  } catch (error) {
    console.error(`[handler] Error:`, error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        medication: event.queryStringParameters?.gnrc_name || '',
        message: 'An error occurred while fetching CMS data'
      } as ErrorResponse)
    };
  }
};

export { handler }; 