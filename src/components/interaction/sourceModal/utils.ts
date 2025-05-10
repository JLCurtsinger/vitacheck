
import { InteractionSource } from "@/lib/api/types";

/**
 * Returns the appropriate color class for a source
 */
export function getSourceColorClass(source: string) {
  switch (source.toUpperCase()) {
    case 'RXNORM':
      return "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700";
    case 'FDA':
      return "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700";
    case 'FDA ADVERSE EVENTS':
      return "bg-red-50 hover:bg-red-100 border-red-200 text-red-700";
    case 'SUPP.AI':
      return "bg-green-50 hover:bg-green-100 border-green-200 text-green-700";
    case 'AI LITERATURE ANALYSIS':
      return "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700";
    case 'OPENFDA ADVERSE EVENTS':
      return "bg-red-50 hover:bg-red-100 border-red-200 text-red-700";
    default:
      return "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700";
  }
}

/**
 * Returns a user-friendly display name for a source
 */
export function getSourceDisplayName(source: string) {
  switch (source.toUpperCase()) {
    case 'RXNORM':
      return "RxNorm National Drug Database";
    case 'FDA':
      return "FDA Drug Labeling Information";
    case 'FDA ADVERSE EVENTS':
      return "FDA Adverse Event Reporting System";
    case 'SUPP.AI':
      return "SUPP.AI Supplement Database";
    case 'AI LITERATURE ANALYSIS':
      return "AI-Enhanced Literature Analysis";
    case 'OPENFDA ADVERSE EVENTS':
      return "OpenFDA Adverse Event Reports";
    case 'VITACHECK SAFETY DATABASE':
      return "VitaCheck Safety Database (fallback mode)";
    default:
      return source;
  }
}

/**
 * Returns the appropriate icon name for a severity level
 */
export function getSeverityIcon(severity: string) {
  switch (severity.toLowerCase()) {
    case 'severe':
      return "XCircle";
    case 'moderate':
    case 'minor':
      return "AlertTriangle";
    case 'unknown':
      return "HelpCircle";
    case 'safe':
      return "CheckCircle";
    default:
      return "HelpCircle";
  }
}

/**
 * Returns the appropriate color class for a severity icon
 */
export function getSeverityIconColor(severity: string) {
  switch (severity.toLowerCase()) {
    case 'severe':
      return "text-red-500";
    case 'moderate':
      return "text-amber-500";
    case 'minor':
      return "text-yellow-500";
    case 'unknown':
      return "text-gray-500";
    case 'safe':
      return "text-green-500";
    default:
      return "text-gray-500";
  }
}

/**
 * Returns a disclaimer for a specific source
 */
export function getSourceDisclaimer(sourceName: string) {
  switch (sourceName.toUpperCase()) {
    case 'RXNORM':
      return "RxNorm data is maintained by the National Library of Medicine and represents FDA-approved prescription and over-the-counter drugs. This information should not be considered complete or comprehensive.";
    case 'FDA':
      return "FDA data is sourced from drug labeling information submitted to the FDA. It may not reflect all known interactions or the latest research findings.";
    case 'FDA ADVERSE EVENTS':
    case 'OPENFDA ADVERSE EVENTS':
      return "Adverse event reports are submitted voluntarily and do not prove causation between medications and reported effects. Reports may be incomplete or contain errors.";
    case 'SUPP.AI':
      return "SUPP.AI data is gathered from scientific literature about supplement-drug interactions. Not all interactions have been clinically validated.";
    case 'AI LITERATURE ANALYSIS':
      return "AI Literature Analysis uses machine learning to extract potential interactions from medical literature. These findings should be verified by healthcare professionals.";
    case 'VITACHECK SAFETY DATABASE':
      return "VitaCheck Safety Database contains previously processed interaction data. This is being shown as a fallback because current API sources returned no results.";
    default:
      return "This information is provided for educational purposes only and should not replace professional medical advice.";
  }
}

/**
 * Returns a description of how this source contributes to the severity score
 */
export function getSourceContribution(
  source: InteractionSource | undefined,
  eventCount?: number,
  seriousCount?: number
) {
  if (!source) {
    return "This source contributes to the overall interaction assessment.";
  }

  // For adverse events
  if (eventCount && eventCount > 0) {
    const seriousPercent = seriousCount && eventCount ? Math.round((seriousCount / eventCount) * 100) : 0;
    
    if (seriousPercent > 30 && eventCount > 10) {
      return `This source significantly impacts the severity assessment due to ${seriousCount} serious adverse events (${seriousPercent}% of reports).`;
    } else if (eventCount > 100) {
      return `This source moderately impacts the severity assessment with ${eventCount} reported events.`;
    } else {
      return `This source has a minor impact on the severity assessment with ${eventCount} reported events.`;
    }
  }

  // Based on source confidence
  if (source.confidence) {
    if (source.confidence > 80) {
      return `This source has high confidence (${source.confidence}%) and significantly influences the overall assessment.`;
    } else if (source.confidence > 50) {
      return `This source has moderate confidence (${source.confidence}%) and contributes to the overall assessment.`;
    } else {
      return `This source has low confidence (${source.confidence}%) and minimally impacts the overall assessment.`;
    }
  }

  // Fallback for sources without confidence score
  if (source.severity === "severe") {
    return "This source reports a severe interaction risk which significantly increases the overall risk assessment.";
  } else if (source.severity === "moderate") {
    return "This source reports a moderate interaction risk which contributes to the overall risk assessment.";
  } else if (source.severity === "minor") {
    return "This source reports a minor interaction risk which slightly increases the overall risk assessment.";
  }

  return "This source contributes to the overall interaction assessment.";
}
