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

  // If no data is available, show the fallback message
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

        {/* AI-Generated Safety Summary */}
        {!isLoading && safetySummary?.summary && (
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
                  Sources: {safetySummary.pubmedIds.map(id => 
                    `https://pubmed.ncbi.nlm.nih.gov/${id}`
                  ).join(', ')}
                </p>
              )}
            </div>
          </div>
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