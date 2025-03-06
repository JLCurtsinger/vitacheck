
import { Badge } from "@/components/ui/badge";

interface SourceAttributionProps {
  sources: string[];
}

export function SourceAttribution({ sources }: SourceAttributionProps) {
  if (!sources.length) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <span className="text-sm font-medium text-gray-500">Sources:</span>
      {sources.map((source, index) => (
        <Badge key={index} variant="outline" className="bg-blue-50">
          {source}
        </Badge>
      ))}
    </div>
  );
}
