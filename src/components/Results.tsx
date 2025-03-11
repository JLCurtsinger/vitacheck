
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { checkInteractions, InteractionResult as InteractionResultType } from "@/lib/api-utils";
import { useToast } from "@/hooks/use-toast";
import { InteractionResult } from "./interaction/InteractionResult";
import { ErrorMessage } from "./interaction/ErrorMessage";

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<InteractionResultType[]>([]);
  const [hasAnyInteraction, setHasAnyInteraction] = useState(false);

  const medications = location.state?.medications || [];

  useEffect(() => {
    if (!medications.length) {
      navigate("/check");
      return;
    }

    const fetchInteractions = async () => {
      try {
        console.log('Fetching interactions for medications:', medications);
        const results = await checkInteractions(medications);
        
        // Sort interactions by severity (severe -> minor -> unknown -> safe)
        const sortedResults = [...results].sort((a, b) => {
          const severityOrder = {
            "severe": 0,
            "minor": 1, 
            "unknown": 2,
            "safe": 3
          };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });
        
        setInteractions(sortedResults);
        
        // Check if any interaction was found
        setHasAnyInteraction(results.some(result => 
          result.severity === "minor" || result.severity === "severe"
        ));
        
        console.log('Interaction results:', {
          count: results.length,
          hasInteractions: results.some(r => r.severity === "minor" || r.severity === "severe")
        });
      } catch (error) {
        console.error('Error checking interactions:', error);
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
    <div className="max-w-3xl mx-auto p-6 animate-fade-in">
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

      {interactions.length === 0 ? (
        <ErrorMessage
          title="No Medications to Compare"
          description="Please select at least two medications to check for interactions."
        />
      ) : !hasAnyInteraction ? (
        <ErrorMessage
          title="No Interactions Found"
          description="No information found for this combination. Consult a healthcare provider for more details."
        />
      ) : (
        <div className="space-y-6">
          {/* Display all interactions now, not just minor/severe ones */}
          {interactions.map((interaction, index) => (
            <InteractionResult key={index} interaction={interaction} />
          ))}
        </div>
      )}

      <Button
        onClick={() => navigate("/check")}
        className="mt-8 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
      >
        Check Different Medications
      </Button>
    </div>
  );
}
