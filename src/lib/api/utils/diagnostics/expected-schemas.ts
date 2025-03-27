
/**
 * Expected API Response Schemas
 * 
 * This module defines the expected schemas for various API responses
 * to help with validation and debugging.
 */

// Expected schema for RxNorm API response
export const rxNormExpectedSchema = {
  // Response when using interact endpoint
  fullInteractionTypeGroup: [
    {
      sourceType: "", // String - e.g., "DrugBank"
      sourceName: "", // String - e.g., "DrugBank"
      fullInteractionType: [
        {
          comment: "", // String
          minConcept: [
            {
              rxcui: "", // String - RxNorm ID
              name: "",  // String - Drug name
              tty: ""    // String - Term type
            }
          ],
          interactionPair: [
            {
              interactionConcept: [
                {
                  minConceptItem: {
                    rxcui: "", // String - RxNorm ID
                    name: ""   // String - Drug name
                  }
                }
              ],
              description: "", // String - Interaction description
              severity: ""     // Optional String - Interaction severity
            }
          ]
        }
      ]
    }
  ],
  
  // Standardized response in our system
  sources: [
    {
      name: "",       // String - Source name, e.g., "RxNorm"
      severity: "",   // String - One of "safe", "minor", "moderate", "severe", "unknown"
      description: "", // String - Description of the interaction
      confidence: 0   // Number - Confidence score
    }
  ]
};

// Expected schema for SUPP.AI API response
export const suppAiExpectedSchema = {
  // Direct SUPP.AI API response
  interactions: [
    {
      drug1: "",         // String - First drug name
      drug2: "",         // String - Second drug name
      evidence: "",      // String - Interaction evidence
      evidence_count: 0, // Number - Count of evidence sources
      label: ""          // String - Label for the interaction
    }
  ],
  
  // Our standardized response
  sources: [
    {
      name: "",        // String - Source name, e.g., "SUPP.AI"
      severity: "",    // String - One of "safe", "minor", "moderate", "severe", "unknown"
      description: "", // String - Description of the interaction
      confidence: 0    // Number - Confidence score
    }
  ]
};

// Expected schema for FDA API response
export const fdaExpectedSchema = {
  // Our standardized response
  sources: [
    {
      name: "",        // String - Source name, e.g., "FDA"
      severity: "",    // String - One of "safe", "minor", "moderate", "severe", "unknown"
      description: "", // String - Description of the interaction
      confidence: 0    // Number - Confidence score
    }
  ],
  
  // Direct FDA API response structure
  results: [
    {
      adverse_reactions: "", // String - Adverse reactions text
      boxed_warnings: "",    // String - Black box warnings
      drug_interactions: ""  // String - Drug interactions text
    }
  ]
};

// Expected schema for Adverse Events response
export const adverseEventsExpectedSchema = {
  eventCount: 0,     // Number - Total count of adverse events
  seriousCount: 0,   // Number - Count of serious events
  totalEvents: 0,    // Number - Alternative field for total events
  commonReactions: [ // Array of strings - Most common reactions
    ""
  ]
};

// Expected schema for AI Literature Analysis response
export const aiAnalysisExpectedSchema = {
  source: "",        // String - Source name, e.g., "AI Literature Analysis"
  severity: "",      // String - One of "safe", "minor", "moderate", "severe", "unknown"
  description: "",   // String - Analysis description
  confidence: 0,     // Number - Confidence score
  processed: true,   // Boolean - Whether processing was completed
  sources: [         // Array of quoted literature references
    {
      citation: "",  // String - Citation text
      year: 0,       // Number - Publication year
      relevance: 0   // Number - Relevance score
    }
  ]
};
