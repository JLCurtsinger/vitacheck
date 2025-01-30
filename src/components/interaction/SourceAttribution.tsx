interface SourceAttributionProps {
  sources: string[];
}

export function SourceAttribution({ sources }: SourceAttributionProps) {
  return (
    <p className="text-sm font-medium text-gray-500 mb-2">
      Sources: {sources.join(", ")}
    </p>
  );
}