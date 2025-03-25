
/**
 * FDA Service
 * Exports all FDA-related API services
 */

export { fetchDrugLabelInfo } from './label-service';
export { fetchAdverseEventData } from './adverse-events-service';
export type { FDALabelData } from './label-service';
export type { FDAEventData } from './adverse-events-service';
