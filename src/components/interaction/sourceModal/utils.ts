
import { AlertTriangle, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import { LucideIcon } from "lucide-react";

/**
 * Returns the appropriate icon for a given severity level
 */
export function getSeverityIcon(severity: string): LucideIcon {
  switch (severity) {
    case 'severe':
      return XCircle;
    case 'moderate':
      return AlertTriangle;
    case 'minor':
      return AlertTriangle;
    case 'safe':
      return CheckCircle;
    default:
      return HelpCircle;
  }
}

/**
 * Returns the appropriate color class for a given severity level
 */
export function getSeverityIconColor(severity: string): string {
  switch (severity) {
    case 'severe':
      return 'text-red-500';
    case 'moderate':
      return 'text-amber-500';
    case 'minor':
      return 'text-yellow-500';
    case 'safe':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Returns a human-readable source name
 */
export function getSourceDisplayName(sourceName: string): string {
  // Map of source codes to display names
  const sourceNameMap: Record<string, string> = {
    'RxNorm': 'RxNorm Database',
    'SUPP.AI': 'SUPP.AI Research',
    'FDA': 'FDA Safety Data',
    'OpenFDA Adverse Events': 'FDA Adverse Event Reports',
    'AI Literature Analysis': 'Medical Literature Analysis',
    'VitaCheck Safety Database': 'VitaCheck Historical Data'
  };
  
  return sourceNameMap[sourceName] || sourceName;
}
