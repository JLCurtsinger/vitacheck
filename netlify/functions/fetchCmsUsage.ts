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
  return term
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric characters
};

// Helper function to calculate string similarity
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeSearchTerm(str1);
  const s2 = normalizeSearchTerm(str2);
  
  // If either string is empty after normalization, return 0
  if (!s1 || !s2) return 0;
  
  // If one string contains the other, return high similarity
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Calculate word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = new Set([...words1, ...words2]).size;
  
  return commonWords.length / totalWords;
};

// Helper function to fetch CMS data
const fetchCmsData = async (searchTerm: string): Promise<CmsApiResponse> => {
  const apiUrl = `https://data.cms.gov/data-api/v1/dataset/7e0b4365-fd63-4a29-8f5e-e0ac9f66a81b/data?keyword=${encodeURIComponent(searchTerm)}&size=1000`;
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`CMS API responded with status: ${response.status}`);
  }

  return response.json() as Promise<CmsApiResponse>;
};

const handler: Handler = async (event) => {
  try {
    // Get and validate the search term
    const searchTerm = event.queryStringParameters?.gnrc_name?.trim();
    
    if (!searchTerm) {
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
    const data = await fetchCmsData(searchTerm);

    // If no data returned
    if (!data.data || data.data.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          medication: searchTerm,
          message: 'No CMS data found for this medication name.'
        } as ErrorResponse)
      };
    }

    // Find best matches using fuzzy matching
    const normalizedSearch = normalizeSearchTerm(searchTerm);
    const matches = data.data.filter(record => {
      const genericMatch = calculateSimilarity(record.Gnrc_Name, normalizedSearch);
      const brandMatch = calculateSimilarity(record.Brnd_Name, normalizedSearch);
      return genericMatch > 0.5 || brandMatch > 0.5; // Threshold for considering a match
    });

    // If no good matches found
    if (matches.length === 0) {
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
    const totals = matches.reduce((acc, record) => {
      acc.total_beneficiaries += record.Tot_Benes_2022 || 0;
      acc.total_claims += record.Tot_Clms_2022 || 0;
      acc.average_dosage_spend += record.Avg_Spnd_Per_Dsg_Unt_Wghtd_2022 || 0;
      return acc;
    }, {
      total_beneficiaries: 0,
      total_claims: 0,
      average_dosage_spend: 0
    });

    // Calculate weighted average for dosage spend
    const validSpendValues = matches.filter(record => record.Avg_Spnd_Per_Dsg_Unt_Wghtd_2022 > 0);
    totals.average_dosage_spend = validSpendValues.length > 0
      ? totals.average_dosage_spend / validSpendValues.length
      : 0;

    // Round all numbers to 2 decimal places
    totals.average_dosage_spend = Math.round(totals.average_dosage_spend * 100) / 100;
    totals.total_beneficiaries = Math.round(totals.total_beneficiaries);
    totals.total_claims = Math.round(totals.total_claims);

    const successResponse: SuccessResponse = {
      success: true,
      medication: searchTerm,
      matched_rows: matches.length,
      totals,
      rows: matches // Include matched records for diagnostics
    };

    return {
      statusCode: 200,
      body: JSON.stringify(successResponse)
    };

  } catch (error) {
    console.error('Error fetching CMS data:', error);

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