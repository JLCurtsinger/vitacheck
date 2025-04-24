
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function FinalRatingModal({
  isOpen,
  onClose,
  confidenceScore
}: {
  isOpen: boolean;
  onClose: () => void;
  confidenceScore?: number;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Final Combined Rating Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">How is this calculated?</h3>
            <p className="text-sm text-gray-600">
              The Final Combined Rating represents a weighted consensus from all available data sources. 
              This approach helps provide the most accurate assessment of potential interaction risks.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Source Weighting</h3>
            <p className="text-sm text-gray-600">
              Each data source is weighted based on:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 pl-4 space-y-1">
              <li>Source reliability and data quality</li>
              <li>Confidence score (currently {confidenceScore || 0}%)</li>
              <li>Severity distribution in reported cases</li>
              <li>Statistical significance of the data</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Important Notes</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 pl-4 space-y-1">
              <li>AI Literature Analysis contributions may be excluded if confidence is below 60%</li>
              <li>Even minor interaction risks are included to avoid missing potential issues</li>
              <li>The system prioritizes clinical data and real-world adverse event reports</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
