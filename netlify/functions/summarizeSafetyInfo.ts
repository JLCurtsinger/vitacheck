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

const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const { substance } = JSON.parse(event.body || '{}');
    
    if (!substance) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Substance name is required' }),
      };
    }

    // Step 1: Search PubMed
    const searchQuery = `${substance} AND (drug interaction OR adverse event OR contraindication OR food interaction OR pharmacokinetics OR pharmacovigilance) NOT rat[Title/Abstract] NOT mouse[Title/Abstract] NOT dogs[Title/Abstract]`;
    
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
          substance,
          summary: "No safety information was found for this substance. Please consult your healthcare provider.",
          source: "PubMed AI Summary",
          articleCount: 0,
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
          substance,
          summary: "No interaction-related findings were mentioned in the available literature.",
          source: "PubMed AI Summary",
          articleCount,
          pubmedIds: articleIds,
        }),
      };
    }

    // Step 3: Generate summary using OpenAI
    const prompt = `You are a medical research assistant. Summarize the following abstracts related to the drug ${substance} with a focus on:
- Common adverse events
- Drug interactions
- Contraindications
- Interactions with food, alcohol, or supplements

Avoid animal-only data. Do not speculate. If no interactions are mentioned, state that clearly.

Abstracts:
${abstracts}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content || 
      "No interaction-related findings were mentioned in the available literature.";

    // Return the summary
    return {
      statusCode: 200,
      body: JSON.stringify({
        substance,
        summary,
        source: "PubMed AI Summary",
        articleCount,
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

export { handler }; 