# Vitacheck - Medication Interaction Checker

## Overview

Vitacheck is a comprehensive medication interaction checking system that helps users identify potential risks when combining different medications and supplements. The application queries multiple medical databases and APIs to provide thorough, reliable information about drug interactions.

## Key Features

- Multi-source verification: Checks multiple medical databases (RxNorm, SUPP.AI, FDA)
- Cross-validation: Identifies and flags discrepancies between different data sources
- High-risk combination detection: Built-in checks for known dangerous drug combinations
- User-friendly interface: Clear presentation of interaction risks and severity levels

## Architecture

### Frontend Components

- `/src/components/MedicationForm.tsx`: Main form for entering medications
- `/src/components/Results.tsx`: Displays interaction check results
- `/src/components/interaction/*`: Components for rendering different aspects of interaction results

### Data Flow

1. User enters medications in MedicationForm
2. Form submission triggers interaction checks
3. Multiple APIs are queried simultaneously:
   - RxNorm for medication identification and basic interactions (via Netlify Functions)
   - SUPP.AI for supplement interactions
   - FDA database for additional warnings
4. Results are aggregated and cross-validated
5. Findings are displayed with appropriate severity indicators

### API Integration Points

#### RxNorm API (via Netlify Functions)
- Purpose: Medication identification and standardization
- Endpoint: `/.netlify/functions/rxnorm`
- Operations:
  - `rxcui`: Lookup medication identifiers
  - `interactions`: Check drug interactions
- Environment Variables:
  - `VITE_RXNORM_API_KEY`: Required for RxNorm API access

#### FDA API (`/src/lib/api/fda.ts`)
- Purpose: Official FDA warnings and precautions
- Endpoint: `/drug/label.json`
- Provides: Official warnings, contraindications, and adverse effects

#### SUPP.AI Integration (`/src/lib/api/suppai.ts`)
- Purpose: Supplement interaction checking
- Provides: Natural supplement and medication interaction data

### Core Utilities

#### Interaction Processing (`/src/lib/api/utils/pair-processing-utils.ts`)
- Manages the core logic for processing medication pairs
- Aggregates data from multiple sources
- Determines final severity ratings
- Handles discrepancy detection

#### High-Risk Combinations (`/src/lib/api/utils/high-risk-interactions.ts`)
- Maintains database of known dangerous combinations
- Provides immediate warnings for high-risk scenarios

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## API Keys and Environment Variables

Required API keys:
- FDA API key (for extended access)
- SUPP.AI API key
- RxNorm API key (if using premium features)

## Testing

The application includes:
- Unit tests for core utilities
- Integration tests for API interactions
- End-to-end tests for critical user flows

## Deployment

The application can be deployed using:
1. Lovable's built-in deployment feature
2. Manual deployment to any static hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with detailed description

## License

This project is licensed under the MIT License - see the LICENSE file for details.
