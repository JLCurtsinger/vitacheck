import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface FDALabelData {
  boxed_warning?: string;
  adverse_reactions?: string;
  contraindications?: string;
  warnings_and_cautions?: string;
  drug_interactions?: string;
  description?: string;
}

interface SafetySummary {
  substance: string;
  summary: string;
  source: string;
  articleCount: number;
  pubmedIds: string[];
}

interface FDALabelSectionProps {
  data: FDALabelData | null;
  medicationName: string;
}

export function FDALabelSection({ data, medicationName }: FDALabelSectionProps) {
  const [safetySummary, setSafetySummary] = useState<SafetySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSafetySummary = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/.netlify/functions/summarizeSafetyInfo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ substance: medicationName }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch safety summary');
        }

        const summary = await response.json();
        console.log("[DEBUG] Safety Summary Response:", summary);
        setSafetySummary(summary);
      } catch (err) {
        console.error('Error fetching safety summary:', err);
        setError('Failed to load safety summary');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSafetySummary();
  }, [medicationName]);

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

  // Render the AI summary section
  const renderAISummary = () => {
    console.log("[DEBUG] Rendering safety summary block", { safetySummary, isLoading });
    
    if (!safetySummary?.summary) {
      if (isLoading) {
        return (
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-200 p-4 shadow-sm mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 mb-3">
              <Sparkles className="w-4 h-4" />
              AI-Generated Safety Summary
            </div>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-purple-100 rounded w-3/4"></div>
              <div className="h-4 bg-purple-100 rounded"></div>
              <div className="h-4 bg-purple-100 rounded w-5/6"></div>
            </div>
          </div>
        );
      }
      return null;
    }

    return (
      <div className="rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-200 p-4 shadow-sm mt-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 mb-3">
          <Sparkles className="w-4 h-4" />
          AI-Generated Safety Summary
        </div>

        <p className="text-sm text-gray-800 whitespace-pre-wrap">
          {safetySummary.summary}
        </p>

        <div className="mt-4 space-y-1">
          <p className="text-xs text-gray-600">
            Generated using recent PubMed literature on {medicationName}. AI-generated on {new Date().toLocaleDateString()}.
          </p>
          
          {safetySummary.pubmedIds.length > 0 && (
            <p className="text-xs text-blue-700 underline">
              Sources: {safetySummary.pubmedIds.map(id => `https://pubmed.ncbi.nlm.nih.gov/${id}`).join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Render the FDA warnings section
  const renderFDAWarnings = () => {
    if (!data) return null;

    const hasWarnings = data.description || 
                       data.boxed_warning || 
                       data.warnings_and_cautions || 
                       data.contraindications || 
                       data.adverse_reactions;

    if (!hasWarnings) return null;

    return (
      <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-4 shadow-sm mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          FDA Safety Warning
        </div>

        <div className="space-y-3">
          {data.description && (
            <div className="text-sm text-gray-800">
              {data.description}
            </div>
          )}
          
          {data.boxed_warning && (
            <div className="text-sm text-gray-800">
              <span className="font-medium">Boxed Warning:</span> {data.boxed_warning}
            </div>
          )}
          
          {data.warnings_and_cautions && (
            <div className="text-sm text-gray-800">
              <span className="font-medium">Warnings and Cautions:</span> {data.warnings_and_cautions}
            </div>
          )}
          
          {data.contraindications && (
            <div className="text-sm text-gray-800">
              <span className="font-medium">Contraindications:</span> {data.contraindications}
            </div>
          )}
          
          {data.adverse_reactions && (
            <div className="text-sm text-gray-800">
              <span className="font-medium">Adverse Reactions:</span> {data.adverse_reactions}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Source: FDA Drug Label
        </div>
      </div>
    );
  };

  // If no FDA data is available, show the fallback message
  if (!data || Object.keys(data).length === 0) {
    return (
      <Alert variant="default" className="bg-muted/50">
        <AlertDescription>
          {isLoading ? (
            "Loading safety information..."
          ) : safetySummary?.summary ? (
            safetySummary.summary
          ) : (
            "No safety information was found for this substance. Please consult your healthcare provider."
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">General Safety Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* FDA Warnings Section */}
        {renderFDAWarnings()}

        {/* AI-Generated Safety Summary */}
        {renderAISummary()}

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