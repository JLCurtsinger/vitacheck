import { cn } from "@/lib/utils";

export const severityLabels = {
  severe: "Severe Interaction Detected",
  moderate: "Moderate Interaction Detected",
  minor: "Minor Interaction Detected",
  safe: "No Interaction Detected",
  unknown: "Interaction Risk Unknown"
};

export const severityColors = {
  severe: {
    background: "bg-red-50/30",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800 border-red-200"
  },
  moderate: {
    background: "bg-yellow-50/40",
    border: "border-yellow-300",
    text: "text-yellow-700",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  minor: {
    background: "bg-yellow-50/30",
    border: "border-yellow-200",
    text: "text-yellow-600",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  safe: {
    background: "bg-green-50/30",
    border: "border-green-200",
    text: "text-green-700",
    badge: "bg-green-100 text-green-800 border-green-200"
  },
  unknown: {
    background: "bg-gray-50/30",
    border: "border-gray-200",
    text: "text-gray-700",
    badge: "bg-gray-100 text-gray-800 border-gray-200"
  }
};

export const severityIcons = {
  severe: "🚨",
  moderate: "⚠️",
  minor: "ℹ️",
  safe: "✅",
  unknown: "ℹ️"
};

export function getSeverityClasses(severity: keyof typeof severityColors) {
  return cn(
    severityColors[severity].background,
    severityColors[severity].border
  );
}

export function getSeverityTextClasses(severity: keyof typeof severityColors) {
  return severityColors[severity].text;
}

export function getSeverityBadgeClasses(severity: keyof typeof severityColors) {
  return severityColors[severity].badge;
}

export function getSeverityIcon(severity: keyof typeof severityIcons) {
  return severityIcons[severity];
} 