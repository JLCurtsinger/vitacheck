
import { InteractionSource } from "@/lib/api/types";

/**
 * Get the appropriate color class for the source header
 */
export const getSourceColorClass = (sourceName: string) => {
  switch (sourceName.toUpperCase()) {
    case 'RXNORM':
      return "bg-blue-50 text-blue-700 border-blue-200";
    case 'FDA':
      return "bg-purple-50 text-purple-700 border-purple-200";
    case 'FDA ADVERSE EVENTS':
      return "bg-red-50 text-red-700 border-red-200";
    case 'SUPP.AI':
      return "bg-green-50 text-green-700 border-green-200";
    case 'AI LITERATURE ANALYSIS':
      return "bg-amber-50 text-amber-700 border-amber-200";
    case 'OPENFDA ADVERSE EVENTS':
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

/**
 * Get severity icon component
 */
export const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "severe":
      return "XCircle";
    case "moderate":
      return "AlertTriangle";
    case "minor":
      return "HelpCircle";
    case "safe":
      return "CheckCircle";
    default:
      return "HelpCircle";
  }
};

/**
 * Get severity icon color
 */
export const getSeverityIconColor = (severity: string) => {
  switch (severity) {
    case "severe":
      return "text-red-600";
    case "moderate":
      return "text-yellow-600";
    case "minor":
      return "text-blue-600";
    case "safe":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};
