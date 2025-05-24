import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export interface FDALabelData {
  boxed_warning?: string;
  adverse_reactions?: string;
  contraindications?: string;
  warnings_and_cautions?: string;
  drug_interactions?: string;
  description?: string;
  source?: string;
  sourceUrl?: string;
}

interface SafetySummary {
  summary: string;
  confidence: number;
  pubmedIds?: string[];
}

interface FDALabelSectionProps {
  data: FDALabelData | null;
  medicationName: string;
}

export function FDALabelSection({ data, medicationName }: FDALabelSectionProps) {
  const [safetySummary, setSafetySummary] = useState<SafetySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add debug logging
  useEffect(() => {
    console.log("[DEBUG] FDALabelSection received data:", {
      data,
      hasDescription: Boolean(data?.description),
      medicationName
    });
  }, [data, medicationName]);

  useEffect(() => {
    const fetchSafetySummary = async () => {
      if (!data || Object.keys(data).length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/.netlify/functions/summarizeSafetyInfo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            medicationName,
            fdaData: data
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch safety summary');
        }

        const result = await response.json();
        setSafetySummary(result);
      } catch (error) {
        console.error('Error fetching safety summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSafetySummary();
  }, [data, medicationName]);

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
          
          {safetySummary.pubmedIds?.length > 0 && (
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
    if (!data) {
      console.warn("[WARN] No FDA data passed to FDALabelSection.");
      return null;
    }

    const hasWarnings = Boolean(
      data.description ||
      data.boxed_warning ||
      data.warnings_and_cautions ||
      data.contraindications ||
      data.adverse_reactions
    );

    if (!hasWarnings) {
      console.warn("[WARN] FDA data present, but no warning fields populated.", data);
      return null;
    }

    console.log("[DEBUG ✅] Rendering FDA warnings with:", data);

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {data.description && (
            <div className="text-sm text-gray-800 border-l-2 border-yellow-400 pl-3">
              <p><strong>⚠️ Description:</strong></p>
              <p>{data.description}</p>
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

        {/* Source Citation */}
        {(data.source || data.sourceUrl) && (
          <div className="mt-4 text-xs text-gray-500">
            Source: {data.sourceUrl ? (
              <a 
                href={data.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {data.source || 'FDA Drug Label'}
              </a>
            ) : (
              data.source || 'FDA Drug Label'
            )}
          </div>
        )}
      </div>
    );
  };

  // Check if we have any valid content to display
  const hasValidContent = Boolean(
    data?.description ||
    data?.boxed_warning ||
    data?.warnings_and_cautions ||
    data?.contraindications ||
    data?.adverse_reactions
  );

  // If no FDA data or no valid content is available, show the fallback message
  if (!data || !hasValidContent) {
    return (
      <Alert variant="default" className="bg-muted/50">
        <AlertDescription>
          {isLoading ? (
            "Loading safety information..."
          ) : safetySummary?.summary ? (
            safetySummary.summary
          ) : (
            "No detailed warnings were found. Monitor for potential side effects and consult your healthcare provider."
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          FDA Label Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderFDAWarnings()}
      </CardContent>
    </Card>
  );
} 