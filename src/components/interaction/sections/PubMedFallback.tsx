
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, AlertCircle, BookOpen } from "lucide-react";
import { usePubMedFallback } from "@/hooks/use-pubmed-fallback";

interface PubMedFallbackProps {
  searchTerm: string;
  shouldFetch: boolean;
}

export function PubMedFallback({ searchTerm, shouldFetch }: PubMedFallbackProps) {
  const { summary, isLoading, error, sourceIds } = usePubMedFallback(searchTerm, shouldFetch);
  
  if (!shouldFetch) {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="my-6 p-4 rounded-lg border border-gray-200 bg-gray-50/60">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium">Searching scientific literature...</h3>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error retrieving scientific literature</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!summary) {
    return null;
  }
  
  return (
    <div className="my-6 p-4 rounded-lg border border-blue-100 bg-blue-50/60">
      <div className="mb-3 pb-2 border-b border-blue-200">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          No direct database results found — showing AI summary from scientific literature (PubMed)
        </h3>
      </div>
      
      <div className="prose prose-sm max-w-none">
        <div className="whitespace-pre-wrap text-gray-700">
          {summary}
        </div>
      </div>
      
      {sourceIds.length > 0 && (
        <div className="mt-4 pt-3 border-t border-blue-100">
          <p className="text-sm text-gray-600 mb-2">Source articles:</p>
          <div className="flex flex-wrap gap-2">
            {sourceIds.map((id) => (
              <a
                key={id}
                href={`https://pubmed.ncbi.nlm.nih.gov/${id}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs bg-white px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <span>{`PubMed: ${id}`}</span>
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-blue-100">
        <p className="text-xs text-gray-500 italic">
          This summary is based on published scientific literature and is for informational purposes only. Always consult a healthcare provider.
        </p>
      </div>
    </div>
  );
}
