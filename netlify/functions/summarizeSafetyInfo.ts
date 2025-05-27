import { Handler } from '@netlify/functions';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PubMedSearchResponse {
  esearchresult: {
    idlist: string[];
    count: string;
  };
}

interface PubMedArticle {
  MedlineCitation: {
    Article: {
      Abstract?: {
        AbstractText: string | string[];
      };
    };
  };
}

interface FDALabelData {
  description?: string;
  boxed_warning?: string;
  adverse_reactions?: string;
  contraindications?: string;
  warnings_and_cautions?: string;
  drug_interactions?: string;
}

interface RequestBody {
  medicationName: string;
  fdaData?: FDALabelData;
}

const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse and validate request body
    const body = JSON.parse(event.body || '{}') as RequestBody;
    const { medicationName, fdaData } = body;
    
    if (!medicationName) {
      console.error('Missing required field: medicationName');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Medication name is required' }),
      };
    }

    // Step 1: Search PubMed
    const searchQuery = `${medicationName} AND ("adverse reactions" OR "toxicity" OR "drug safety" OR "drug interactions") NOT rat[Title/Abstract] NOT mouse[Title/Abstract] NOT dogs[Title/Abstract]`;
    
    const searchResponse = await axios.get<PubMedSearchResponse>(
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
      {
        params: {
          db: 'pubmed',
          retmax: 5,
          retmode: 'json',
          term: searchQuery,
        },
      }
    );

    const articleIds = searchResponse.data.esearchresult.idlist;
    const articleCount = parseInt(searchResponse.data.esearchresult.count);

    // If no articles found, return fallback message
    if (articleCount === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          summary: "No safety information was found for this medication. Please consult your healthcare provider.",
          confidence: 0,
          pubmedIds: [],
        }),
      };
    }

    // Step 2: Fetch article abstracts
    const fetchResponse = await axios.get(
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi',
      {
        params: {
          db: 'pubmed',
          retmode: 'xml',
          id: articleIds.join(','),
        },
      }
    );

    // Parse XML response
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const parsedData = parser.parse(fetchResponse.data);
    const articles = Array.isArray(parsedData.PubmedArticleSet.PubmedArticle)
      ? parsedData.PubmedArticleSet.PubmedArticle
      : [parsedData.PubmedArticleSet.PubmedArticle];

    // Extract abstracts
    const abstracts = articles
      .map((article: PubMedArticle) => {
        const abstract = article.MedlineCitation.Article.Abstract;
        if (!abstract) return '';
        
        // Handle both string and array formats
        if (Array.isArray(abstract.AbstractText)) {
          return abstract.AbstractText.join(' ');
        }
        return abstract.AbstractText;
      })
      .filter(Boolean)
      .join('\n\n');

    // If no abstracts found, return fallback message
    if (!abstracts.trim()) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          summary: "No safety-related findings were mentioned in the available literature.",
          confidence: 0,
          pubmedIds: articleIds,
        }),
      };
    }

    // Step 3: Prepare FDA label data for context
    let fdaContext = '';
    if (fdaData) {
      const fdaFields = [
        { key: 'description', label: 'Description' },
        { key: 'boxed_warning', label: 'Boxed Warning' },
        { key: 'adverse_reactions', label: 'Adverse Reactions' },
        { key: 'contraindications', label: 'Contraindications' },
        { key: 'warnings_and_cautions', label: 'Warnings and Cautions' },
        { key: 'drug_interactions', label: 'Drug Interactions' },
      ];

      fdaContext = fdaFields
        .map(({ key, label }) => {
          const value = fdaData[key as keyof FDALabelData];
          return value ? `${label}:\n${value}\n` : '';
        })
        .filter(Boolean)
        .join('\n');
    }

    // Step 4: Generate summary using OpenAI
    const prompt = `You are a medical research assistant. Summarize safety information for ${medicationName} based on the following data:

${fdaContext ? `FDA Label Information:\n${fdaContext}\n\n` : ''}Recent Medical Literature:\n${abstracts}

Focus on:
- Common adverse events
- Drug interactions
- Contraindications
- Interactions with food, alcohol, or supplements

Avoid animal-only data. Do not speculate. If no interactions are mentioned, state that clearly.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content || 
      "No safety-related findings were mentioned in the available literature.";

    // Calculate confidence score based on available data
    const confidence = calculateConfidenceScore(fdaData, articleCount, abstracts);

    // Return the summary
    return {
      statusCode: 200,
      body: JSON.stringify({
        summary,
        confidence,
        pubmedIds: articleIds,
      }),
    };

  } catch (error) {
    console.error('Error in summarizeSafetyInfo:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate safety summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

// Helper function to calculate confidence score
function calculateConfidenceScore(
  fdaData: FDALabelData | undefined,
  articleCount: number,
  abstracts: string
): number {
  let score = 0;
  
  // Base score from FDA data
  if (fdaData) {
    const fdaFields = [
      'description',
      'boxed_warning',
      'adverse_reactions',
      'contraindications',
      'warnings_and_cautions',
      'drug_interactions',
    ];
    
    const filledFields = fdaFields.filter(field => 
      Boolean(fdaData[field as keyof FDALabelData])
    ).length;
    
    score += (filledFields / fdaFields.length) * 40; // FDA data contributes up to 40%
  }
  
  // Score from PubMed data
  const hasPubMedData = articleCount > 0 && abstracts.trim().length > 0;
  if (hasPubMedData) {
    score += Math.min(articleCount / 5, 1) * 30; // Article count contributes up to 30%
    score += Math.min(abstracts.length / 5000, 1) * 30; // Abstract length contributes up to 30%
  }
  
  return Math.round(score);
}

export { handler }; 
