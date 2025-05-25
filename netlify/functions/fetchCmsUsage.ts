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
  matched_on: 'Gnrc_Name' | 'Brnd_Name';
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

// Helper function to fetch CMS data
const fetchCmsData = async (searchTerm: string, field: 'Gnrc_Name' | 'Brnd_Name'): Promise<CmsApiResponse> => {
  const apiUrl = `https://data.cms.gov/data-api/v1/dataset/7e0b4365-fd63-4a29-8f5e-e0ac9f66a81b/data?filters[${field}]=${encodeURIComponent(searchTerm)}`;
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`CMS API responded with status: ${response.status}`);
  }

  return response.json() as Promise<CmsApiResponse>;
};

const handler: Handler = async (event) => {
  try {
    // Get and validate the generic name parameter
    const searchTerm = event.queryStringParameters?.gnrc_name?.trim();
    
    if (!searchTerm) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          medication: '',
          message: 'Generic name parameter is required'
        } as ErrorResponse)
      };
    }

    // Try generic name first
    let data: CmsApiResponse;
    let matchedOn: 'Gnrc_Name' | 'Brnd_Name' = 'Gnrc_Name';

    try {
      data = await fetchCmsData(searchTerm, 'Gnrc_Name');
    } catch (error) {
      console.error('Error fetching generic name data:', error);
      data = { data: [] };
    }

    // If no matches found with generic name, try brand name
    if (!data.data || data.data.length === 0) {
      try {
        data = await fetchCmsData(searchTerm, 'Brnd_Name');
        matchedOn = 'Brnd_Name';
      } catch (error) {
        console.error('Error fetching brand name data:', error);
        data = { data: [] };
      }
    }

    // If still no matches found
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

    // Calculate totals
    const totals = data.data.reduce((acc, record) => {
      acc.total_beneficiaries += record.Tot_Benes_2022 || 0;
      acc.total_claims += record.Tot_Clms_2022 || 0;
      acc.average_dosage_spend += record.Avg_Spnd_Per_Dsg_Unt_Wghtd_2022 || 0;
      return acc;
    }, {
      total_beneficiaries: 0,
      total_claims: 0,
      average_dosage_spend: 0
    });

    // Calculate average spend per unit
    const validSpendValues = data.data.filter(record => record.Avg_Spnd_Per_Dsg_Unt_Wghtd_2022 > 0);
    totals.average_dosage_spend = validSpendValues.length > 0
      ? totals.average_dosage_spend / validSpendValues.length
      : 0;

    // Round to 2 decimal places
    totals.average_dosage_spend = Math.round(totals.average_dosage_spend * 100) / 100;

    const successResponse: SuccessResponse = {
      success: true,
      medication: searchTerm,
      matched_rows: data.data.length,
      matched_on: matchedOn,
      totals,
      rows: data.data // Include raw data for diagnostics
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