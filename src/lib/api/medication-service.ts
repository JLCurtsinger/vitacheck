
export { lookupMedication } from './services/medication-lookup';
export { checkInteractions } from './services/interaction-checker';
export { checkAllCombinations } from './services/combination-checker';
export type { CombinationResult } from './services/combination-types';
export * from './types';
export { 
  fetchPubMedIds, 
  fetchPubMedAbstracts, 
  summarizePubMedAbstracts 
} from './services/pubmed';
