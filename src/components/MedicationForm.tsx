import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

/**
 * MedicationForm Component
 * Handles user input for medications and supplements, including validation and submission.
 */
export default function MedicationForm() {
  const [medications, setMedications] = useState<string[]>([""]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Input validation patterns
  const INVALID_CHARS_REGEX = /[<>{}]/;
  const MIN_LENGTH = 2;

  /**
   * Validates a single medication input
   * @param value - The medication name to validate
   * @returns Object containing validation result and error message
   */
  const validateMedication = (value: string) => {
    const trimmed = value.trim();
    
    if (trimmed.length < MIN_LENGTH) {
      return {
        isValid: false,
        error: "Medication name must be at least 2 characters"
      };
    }
    
    if (INVALID_CHARS_REGEX.test(trimmed)) {
      return {
        isValid: false,
        error: "Invalid characters detected"
      };
    }
    
    return { isValid: true, error: null };
  };

  const addMedication = () => {
    setMedications([...medications, ""]);
  };

  const removeMedication = (index: number) => {
    const newMedications = medications.filter((_, i) => i !== index);
    setMedications(newMedications);
  };

  const updateMedication = (index: number, value: string) => {
    const newMedications = [...medications];
    newMedications[index] = value;
    setMedications(newMedications);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter and validate medications
    const validMedications = medications
      .map(med => med.trim())
      .filter(med => med !== "");
      
    if (validMedications.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter at least one medication or supplement"
      });
      return;
    }
    
    // Validate each medication
    for (const med of validMedications) {
      const { isValid, error } = validateMedication(med);
      if (!isValid) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: `${med}: ${error}`
        });
        return;
      }
    }
    
    navigate("/results", { state: { medications: validMedications } });
  };

  const clearAll = () => {
    setMedications([""]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-2xl mx-auto p-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </button>
        
        <div className="bg-white rounded-xl shadow-lg p-8 backdrop-blur-sm bg-opacity-90">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Enter Your Medications & Supplements
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {medications.map((medication, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={medication}
                  onChange={(e) => updateMedication(index, e.target.value)}
                  placeholder="Enter medication or supplement name"
                  className="flex-1 h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
                {medications.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeMedication(index)}
                    className="hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={addMedication}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 transition-all hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Add Another
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearAll}
                className="border-2 border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Clear All
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full mt-6 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              disabled={medications.every(med => med.trim() === "")}
            >
              Check Interactions
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}