import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Severity = "safe" | "minor" | "severe";

interface Interaction {
  medications: [string, string];
  severity: Severity;
  description: string;
}

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  const medications = location.state?.medications || [];

  useEffect(() => {
    if (!medications.length) {
      navigate("/check");
      return;
    }

    // Simulate API call
    setTimeout(() => {
      // Mock data - in real app, this would come from the API
      const mockInteractions: Interaction[] = [
        {
          medications: [medications[0], medications[1] || ""],
          severity: "safe",
          description: "No known interactions between these medications.",
        },
        {
          medications: [medications[1] || "", medications[2] || ""],
          severity: "minor",
          description: "Minor interaction possible. Monitor for side effects.",
        },
      ];

      setInteractions(mockInteractions);
      setLoading(false);
    }, 1500);
  }, [medications, navigate]);

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case "safe":
        return "text-success";
      case "minor":
        return "text-warning";
      case "severe":
        return "text-danger";
    }
  };

  const getSeverityIcon = (severity: Severity) => {
    const className = "h-6 w-6";
    switch (severity) {
      case "safe":
        return <CheckCircle className={className} />;
      case "minor":
        return <AlertCircle className={className} />;
      case "severe":
        return <XCircle className={className} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-xl">Analyzing interactions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Interaction Results</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Medications Checked:</h3>
        <ul className="list-disc list-inside space-y-1">
          {medications.map((med: string, index: number) => (
            <li key={index}>{med}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-6">
        {interactions.map((interaction, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={getSeverityColor(interaction.severity)}>
                {getSeverityIcon(interaction.severity)}
              </span>
              <h4 className="font-semibold">
                {interaction.medications[0]} + {interaction.medications[1]}
              </h4>
            </div>
            <p className="text-gray-600">{interaction.description}</p>
          </div>
        ))}
      </div>

      <Button
        onClick={() => navigate("/check")}
        className="mt-8"
      >
        Check Different Medications
      </Button>
    </div>
  );
}