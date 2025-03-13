
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ResultsHeaderProps {
  medications: string[];
}

export function ResultsHeader({ medications }: ResultsHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <>
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
      
      <Button
        onClick={() => navigate("/check")}
        className="mt-12 mb-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
      >
        Check Different Medications
      </Button>
    </>
  );
}
