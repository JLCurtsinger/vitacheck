
/**
 * Expected API Response Schemas
 * 
 * This module defines the expected schemas for various API responses
 * to help with validation and debugging.
 */

// Multiple schema variations supported for RxNorm API response
export const rxNormExpectedSchemas = [
  // Primary schema - Response when using interact endpoint
  {
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
    ]
  },
  
  // Alternative schema - Our standardized format
  {
    sources: [
      {
        name: "",       // String - Source name, e.g., "RxNorm"
        severity: "",   // String - One of "safe", "minor", "moderate", "severe", "unknown"
        description: "", // String - Description of the interaction
        confidence: 0   // Number - Confidence score
      }
    ]
  },
  
  // Minimal schema - Direct description and severity fields
  {
    description: "",  // String - Description of the interaction
    severity: ""      // String - Severity rating
  }
];

// Multiple schema variations supported for SUPP.AI API response
export const suppAiExpectedSchemas = [
  // Primary schema - Direct SUPP.AI API response
  {
    interactions: [
      {
        drug1: "",         // String - First drug name
        drug2: "",         // String - Second drug name
        evidence: "",      // String - Interaction evidence
        evidence_count: 0, // Number - Count of evidence sources
        label: ""          // String - Label for the interaction
      }
    ]
  },
  
  // Alternative schema - Our standardized response
  {
    sources: [
      {
        name: "",        // String - Source name, e.g., "SUPP.AI"
        severity: "",    // String - One of "safe", "minor", "moderate", "severe", "unknown"
        description: "", // String - Description of the interaction
        confidence: 0    // Number - Confidence score
      }
    ]
  },
  
  // Minimal schema - Direct description field
  {
    description: "",    // String - Description of the interaction
    evidence_count: 0   // Number - Count of evidence sources
  }
];

// Multiple schema variations supported for FDA API response
export const fdaExpectedSchemas = [
  // Primary schema - Our standardized response
  {
    sources: [
      {
        name: "",        // String - Source name, e.g., "FDA"
        severity: "",    // String - One of "safe", "minor", "moderate", "severe", "unknown"
        description: "", // String - Description of the interaction
        confidence: 0    // Number - Confidence score
      }
    ]
  },
  
  // Alternative schema - Direct FDA API response structure
  {
    results: [
      {
        adverse_reactions: "", // String - Adverse reactions text
        boxed_warnings: "",    // String - Black box warnings
        drug_interactions: ""  // String - Drug interactions text
      }
    ]
  },
  
  // Minimal schema - Direct warning fields
  {
    warnings: [""],     // Array of strings - Warning texts
    description: ""     // String - Description text
  }
];

// Expected schema for Adverse Events response
export const adverseEventsExpectedSchemas = [
  // Primary schema
  {
    eventCount: 0,     // Number - Total count of adverse events
    seriousCount: 0,   // Number - Count of serious events
    commonReactions: [ // Array of strings - Most common reactions
      ""
    ]
  },
  
  // Alternative schema
  {
    totalEvents: 0,     // Number - Alternative field for total events
    seriousEvents: 0,   // Number - Alternative field for serious events
    nonSeriousEvents: 0, // Number - Alternative field for non-serious events
    reactions: [""]     // Array of strings - Alternative field for reactions
  }
];

// Expected schema for AI Literature Analysis response
export const aiAnalysisExpectedSchemas = [
  // Primary schema
  {
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
  },
  
  // Alternative schema - Minimal fields
  {
    description: "",   // String - Analysis description
    severity: "",      // String - One of "safe", "minor", "moderate", "severe", "unknown"
    references: [""]   // Array of strings - References
  }
];
