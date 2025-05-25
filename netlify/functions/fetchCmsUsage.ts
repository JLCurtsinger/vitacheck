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

// Helper function to check if strings match
const isMatch = (input: string, target: string): boolean => {
  const normalizedInput = normalizeSearchTerm(input);
  const normalizedTarget = normalizeSearchTerm(target);
  
  // If either string is empty after normalization, return false
  if (!normalizedInput || !normalizedTarget) return false;
  
  // Check if one string contains the other
  return normalizedInput.includes(normalizedTarget) || 
         normalizedTarget.includes(normalizedInput);
};

// Helper function to fetch CMS data
const fetchCmsData = async (searchTerm: string): Promise<CmsApiResponse> => {
  // Try exact match on generic name first
  const genericUrl = `https://data.cms.gov/data-api/v1/dataset/7e0b4365-fd63-4a29-8f5e-e0ac9f66a81b/data?filters[Gnrc_Name]=${encodeURIComponent(searchTerm)}&size=100`;
  console.log('🔍 [GENERIC] URL:', genericUrl);
  
  const genericResponse = await fetch(genericUrl);
  
  if (!genericResponse.ok) {
    throw new Error(`CMS API responded with status: ${genericResponse.status}`);
  }

  const genericJson = await genericResponse.json();
  const genericRecords: CmsDrugRecord[] = Array.isArray(genericJson)
    ? genericJson
    : Array.isArray((genericJson as any).data)
      ? (genericJson as any).data
      : [];
  console.log('   ↓ genericRecords.length =', genericRecords.length);
  console.log('   ✏️ genericRecords sample:', genericRecords[0]);
  if (genericRecords.length > 0) return { data: genericRecords };

  // Try exact match on brand name next
  const brandUrl = `https://data.cms.gov/data-api/v1/dataset/7e0b4365-fd63-4a29-8f5e-e0ac9f66a81b/data?filters[Brnd_Name]=${encodeURIComponent(searchTerm)}&size=100`;
  console.log('🔍 [BRAND]   URL:', brandUrl);
  
  const brandResponse = await fetch(brandUrl);
  
  if (!brandResponse.ok) {
    throw new Error(`CMS API responded with status: ${brandResponse.status}`);
  }

  const brandJson = await brandResponse.json();
  const brandRecords: CmsDrugRecord[] = Array.isArray(brandJson)
    ? brandJson
    : Array.isArray((brandJson as any).data)
      ? (brandJson as any).data
      : [];
  console.log('   ↓ brandRecords.length =', brandRecords.length);
  console.log('   ✏️ brandRecords sample:', brandRecords[0]);
  if (brandRecords.length > 0) return { data: brandRecords };

  // Fall back to keyword search if no exact matches found
  const keywordUrl = `https://data.cms.gov/data-api/v1/dataset/7e0b4365-fd63-4a29-8f5e-e0ac9f66a81b/data?keyword=${encodeURIComponent(searchTerm)}&size=1000`;
  console.log('🔍 [FALLBACK] URL:', keywordUrl);
  
  const keywordResponse = await fetch(keywordUrl);
  
  if (!keywordResponse.ok) {
    throw new Error(`CMS API responded with status: ${keywordResponse.status}`);
  }

  const fallbackJson = await keywordResponse.json();
  const fallbackRecords: CmsDrugRecord[] = Array.isArray(fallbackJson)
    ? fallbackJson
    : Array.isArray((fallbackJson as any).data)
      ? (fallbackJson as any).data
      : [];
  console.log('   ↓ fallbackRecords.length =', fallbackRecords.length);
  console.log('   ✏️ fallbackRecords sample:', fallbackRecords[0]);
  return { data: fallbackRecords };
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

    // Find matches using normalized comparison
    const matches = data.data.filter(record => 
      isMatch(searchTerm, record.Gnrc_Name) || 
      isMatch(searchTerm, record.Brnd_Name)
    );

    // If no matches found
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
      // Only add values if they exist and are numbers
      if (typeof record.Tot_Benes_2022 === 'number') {
        acc.total_beneficiaries += record.Tot_Benes_2022;
      }
      if (typeof record.Tot_Clms_2022 === 'number') {
        acc.total_claims += record.Tot_Clms_2022;
      }
      if (typeof record.Avg_Spnd_Per_Dsg_Unt_Wghtd_2022 === 'number' && 
          record.Avg_Spnd_Per_Dsg_Unt_Wghtd_2022 > 0) {
        acc.average_dosage_spend += record.Avg_Spnd_Per_Dsg_Unt_Wghtd_2022;
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

    // Calculate average spend per unit
    const averageSpend = totals.validSpendCount > 0
      ? totals.average_dosage_spend / totals.validSpendCount
      : 0;

    // Round all numbers to 2 decimal places
    const finalTotals = {
      total_beneficiaries: Math.round(totals.total_beneficiaries),
      total_claims: Math.round(totals.total_claims),
      average_dosage_spend: Math.round(averageSpend * 100) / 100
    };

    const successResponse: SuccessResponse = {
      success: true,
      medication: searchTerm,
      matched_rows: matches.length,
      totals: finalTotals,
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