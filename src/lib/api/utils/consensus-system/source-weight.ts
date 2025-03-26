/**
 * Source Weight Determination
 * 
 * This module calculates the relative weight to assign to different 
 * data sources when determining interaction severity.
 */

import { InteractionSource } from '../../types';
import { logSourceSeverityIssues } from '../debug-logger';

/**
 * Determines the weight to assign to a source based on its reliability 
 * and the quality of evidence it provides
 * 
 * @param source The interaction source to analyze
 * @returns A weight between 0 and 1, with higher values indicating greater reliability
 */
export function determineSourceWeight(source: InteractionSource): number {
  // Log any issues with source severity
  logSourceSeverityIssues(source, 'SourceWeight');
  
  // Guard against null or undefined sources
  if (!source || !source.name) {
    return 0;
  }
  
  // Base weights by source type
  let baseWeight = 0;
  
  // RxNorm is considered highly reliable
  if (source.name === 'RxNorm') {
    baseWeight = 0.85;
  }
  // FDA sources are also highly reliable
  else if (source.name === 'FDA') {
    baseWeight = 0.80;
  }
  // OpenFDA Adverse Events are based on real-world data
  else if (source.name === 'OpenFDA Adverse Events') {
    baseWeight = 0.90;
  }
  // SUPP.AI has a moderate weight
  else if (source.name === 'SUPP.AI') {
    baseWeight = 0.60;
  }
  // AI Literature Analysis gets a moderate weight 
  else if (source.name === 'AI Literature Analysis') {
    baseWeight = 0.65;
  }
  // Other sources get a lower default weight
  else {
    baseWeight = 0.50;
  }
  
  // Adjust weight based on confidence if provided
  if (source.confidence && source.confidence > 0) {
    // Convert confidence (0-100) to a multiplier (0.5-1.5)
    const confidenceMultiplier = 0.5 + (source.confidence / 100);
    baseWeight *= confidenceMultiplier;
  }
  
  // Adjust weight based on source data quality
  
  // Event data gets a bonus because it's based on real reports
  if (source.eventData && source.eventData.totalEvents > 0) {
    const eventAdjustment = Math.min(0.2, source.eventData.totalEvents / 1000 * 0.1);
    baseWeight += eventAdjustment;
    
    // Higher percentage of serious events increases weight
    if (source.eventData.seriousPercentage && source.eventData.seriousPercentage > 5) {
      baseWeight += 0.1;
    }
  }
  
  // Safety check for invalid severity
  if (!source.severity || source.severity === "unknown") {
    // If no clear severity, reduce the weight
    baseWeight *= 0.5;
  }
  
  // Ensure final weight is between 0 and 1
  return Math.max(0, Math.min(1, baseWeight));
}
