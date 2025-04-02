
import React from "react";
import { AlertCircle, Info, AlertTriangle } from "lucide-react";
import { createHTMLProps } from "../utils/formatDescription";

interface FormattedSectionProps {
  title: string;
  points: string[];
  type: "warning" | "info" | "severe" | "metadata";
}

export function FormattedContentSection({ title, points, type }: FormattedSectionProps) {
  const getIconAndColor = () => {
    switch (type) {
      case "severe":
        return { icon: <AlertCircle className="h-5 w-5 text-red-600" />, textColor: "text-red-600", bgColor: "bg-red-50 border-red-200" };
      case "warning":
        return { icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />, textColor: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-200" };
      case "metadata":
        return { icon: <Info className="h-5 w-5 text-blue-600" />, textColor: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" };
      case "info":
      default:
        return { icon: <Info className="h-5 w-5 text-gray-600" />, textColor: "text-gray-600", bgColor: "bg-gray-50 border-gray-200" };
    }
  };

  const { icon, textColor, bgColor } = getIconAndColor();

  if (points.length === 0) return null;

  return (
    <div className={`rounded-md border mb-4 p-4 ${bgColor}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className={`font-medium ${textColor}`}>{title}</h3>
      </div>
      <div className="space-y-2">
        {points.map((point, idx) => (
          <p key={idx} className="text-sm" dangerouslySetInnerHTML={createHTMLProps(point)} />
        ))}
      </div>
    </div>
  );
}
