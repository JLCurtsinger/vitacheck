import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { SourceAttribution } from "./SourceAttribution";
import { InteractionResult } from "@/lib/api-utils";

interface InteractionDescriptionProps {
  interaction: InteractionResult;
  finalSeverity: "safe" | "minor" | "severe" | "unknown";
}

export function InteractionDescription({ interaction, finalSeverity }: InteractionDescriptionProps) {
  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-gray-500 mb-1">
        Severity:{" "}
        <span
          className={`text-${
            finalSeverity === "safe"
              ? "green"
              : finalSeverity === "minor"
              ? "yellow"
              : finalSeverity === "severe"
              ? "red"
              : "gray"
          }-500`}
        >
          {finalSeverity === "safe"
            ? "Safe to take together"
            : finalSeverity === "minor"
            ? "Minor interaction possible"
            : finalSeverity === "severe"
            ? "Severe interaction risk"
            : "Interaction status unknown"}
        </span>
      </p>
      <SourceAttribution sources={interaction.sources.map((s) => s.name)} />

      {finalSeverity === "severe" ? (
        <Alert variant="destructive" className="mt-2 mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>{interaction.description}</AlertDescription>
        </Alert>
      ) : (
        <p className="text-gray-600">{interaction.description}</p>
      )}
    </div>
  );
}