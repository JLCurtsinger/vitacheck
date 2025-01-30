import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { checkInteractions, InteractionResult } from "@/lib/api-utils";
import { useToast } from "@/hooks/use-toast";

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<InteractionResult[]>([]);

  const medications = location.state?.medications || [];

  useEffect(() => {
    if (!medications.length) {
      navigate("/check");
      return;
    }

    const fetchInteractions = async () => {
      try {
        const results = await checkInteractions(medications);
        setInteractions(results);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check interactions. Please try again later."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [medications, navigate, toast]);

  const getSeverityColor = (severity: "safe" | "minor" | "severe") => {
    switch (severity) {
      case "safe":
        return "text-green-500";
      case "minor":
        return "text-yellow-500";
      case "severe":
        return "text-red-500";
    }
  };

  const getSeverityIcon = (severity: "safe" | "minor" | "severe") => {
    const className = "h-6 w-6";
    switch (severity) {
      case "safe":
        return <CheckCircle className={className} />;
      case "minor":
        return <AlertTriangle className={className} />;
      case "severe":
        return <XCircle className={className} />;
    }
  };

  const getSeverityText = (severity: "safe" | "minor" | "severe") => {
    switch (severity) {
      case "safe":
        return "Safe to take together";
      case "minor":
        return "Minor interaction possible";
      case "severe":
        return "Severe interaction risk";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-xl bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          Analyzing interactions across multiple databases...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
        Interaction Results
      </h2>
      
      <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Medications Checked:</h3>
        <ul className="list-disc list-inside space-y-1">
          {medications.map((med: string, index: number) => (
            <li key={index} className="text-gray-700">{med}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-6">
        {interactions.map((interaction, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-[1.02]"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={getSeverityColor(interaction.severity)}>
                {getSeverityIcon(interaction.severity)}
              </span>
              <h4 className="font-semibold text-lg">
                {interaction.medications[0]} + {interaction.medications[1]}
              </h4>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Severity: <span className={getSeverityColor(interaction.severity)}>
                  {getSeverityText(interaction.severity)}
                </span>
              </p>
              <p className="text-sm font-medium text-gray-500 mb-2">
                Sources: {interaction.sources.join(", ")}
              </p>
              <p className="text-gray-600">{interaction.description}</p>
            </div>

            {interaction.evidence && (
              <a
                href={interaction.evidence}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Learn More <ExternalLink className="h-4 w-4" />
              </a>
            )}
            
            {interaction.severity !== "safe" && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  Recommendation: {interaction.severity === "severe" 
                    ? "Consult your healthcare provider before combining these medications."
                    : "Monitor for potential side effects and consult your healthcare provider if concerned."
                  }
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={() => navigate("/check")}
        className="mt-8 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
      >
        Check Different Medications
      </Button>
    </div>
  );
}