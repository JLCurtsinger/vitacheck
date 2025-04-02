
/**
 * Shared utilities for source modals
 */

// Get the appropriate color class for each source
export function getSourceColorClass(source: string): string {
  switch (source.toUpperCase()) {
    case 'RXNORM':
      return "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700";
    case 'FDA':
      return "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700";
    case 'FDA ADVERSE EVENTS':
    case 'OPENFDA ADVERSE EVENTS':
      return "bg-red-50 hover:bg-red-100 border-red-200 text-red-700";
    case 'SUPP.AI':
      return "bg-green-50 hover:bg-green-100 border-green-200 text-green-700";
    case 'AI LITERATURE ANALYSIS':
      return "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700";
    default:
      return "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700";
  }
}

// Get the appropriate severity icon
export function getSeverityIcon(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'severe':
      return "XCircle";
    case 'moderate':
      return "AlertTriangle";
    case 'minor':
      return "AlertTriangle";
    case 'safe':
      return "CheckCircle";
    default:
      return "HelpCircle";
  }
}

// Get appropriate severity icon color
export function getSeverityIconColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'severe':
      return "text-red-600";
    case 'moderate':
      return "text-orange-500";
    case 'minor':
      return "text-yellow-500";
    case 'safe':
      return "text-green-500";
    default:
      return "text-gray-500";
  }
}

// Get the disclaimer text based on source
export function getSourceDisclaimer(source: string): string {
  switch (source.toUpperCase()) {
    case 'OPENFDA ADVERSE EVENTS':
    case 'FDA ADVERSE EVENTS':
      return "Note: Adverse event reports reflect correlation, not causation. These events are submitted voluntarily and may not confirm a proven interaction.";
    case 'RXNORM':
      return "Note: RxNorm provides standardized drug-drug interaction information based on clinical research and established medical knowledge.";
    case 'SUPP.AI':
      return "Note: SUPP.AI data is derived from biomedical literature and may include both established and emerging interaction information.";
    case 'FDA':
      return "Note: FDA drug label data represents manufacturer-provided information that has been reviewed by the FDA.";
    case 'AI LITERATURE ANALYSIS':
      return "Note: This analysis is based on AI processing of medical literature and should be verified against other authoritative sources.";
    default:
      return "Note: This data source provides one perspective on this interaction. Consider multiple sources for clinical decision making.";
  }
}

// Calculate source contribution to severity score
export function getSourceContribution(source: any, totalEvents?: number, severeEvents?: number): string {
  if (source.name.toUpperCase().includes('ADVERSE') && totalEvents) {
    return `This data source contributed ${totalEvents} cases (${severeEvents || 0} severe), which influenced the final severity rating through VitaCheck's weighted consensus model.`;
  } else if (source.confidence) {
    return `This data source contributed to the final severity rating with ${source.confidence}% confidence through VitaCheck's weighted consensus model.`;
  } else {
    return `This data source was considered in VitaCheck's weighted consensus model for the final severity rating.`;
  }
}
