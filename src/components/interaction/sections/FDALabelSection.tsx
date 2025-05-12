import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FDALabelData {
  boxed_warning?: string;
  adverse_reactions?: string;
  contraindications?: string;
  warnings_and_cautions?: string;
  drug_interactions?: string;
}

interface FDALabelSectionProps {
  data: FDALabelData | null;
  medicationName: string;
}

export function FDALabelSection({ data, medicationName }: FDALabelSectionProps) {
  // If no data is available, show the fallback message
  if (!data || Object.keys(data).length === 0) {
    return (
      <Alert variant="default" className="bg-muted/50">
        <AlertDescription>
          No safety information was found for {medicationName}. Please consult your healthcare provider.
        </AlertDescription>
      </Alert>
    );
  }

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 500) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Helper function to render a section
  const renderSection = (title: string, content: string | undefined) => {
    if (!content) return null;
    
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {truncateText(content)}
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">General Safety Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Boxed Warning - if present */}
        {data.boxed_warning && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {data.boxed_warning}
            </AlertDescription>
          </Alert>
        )}

        {/* Other sections */}
        {renderSection("Common Adverse Reactions", data.adverse_reactions)}
        {renderSection("Contraindications", data.contraindications)}
        {renderSection("Warnings and Cautions", data.warnings_and_cautions)}
        {renderSection("Drug Interactions", data.drug_interactions)}

        {/* Source attribution */}
        <div className="text-xs text-gray-500 mt-4">
          Source: FDA Drug Label
        </div>
      </CardContent>
    </Card>
  );
} 