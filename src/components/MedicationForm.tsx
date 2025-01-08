import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MedicationForm() {
  const [medications, setMedications] = useState<string[]>([""]);
  const navigate = useNavigate();

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
    const validMedications = medications.filter(med => med.trim() !== "");
    if (validMedications.length > 0) {
      navigate("/results", { state: { medications: validMedications } });
    }
  };

  const clearAll = () => {
    setMedications([""]);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Enter Your Medications & Supplements</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {medications.map((medication, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={medication}
              onChange={(e) => updateMedication(index, e.target.value)}
              placeholder="Enter medication or supplement name"
              className="flex-1"
            />
            {medications.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeMedication(index)}
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
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Another
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearAll}
          >
            Clear All
          </Button>
        </div>

        <Button
          type="submit"
          className="w-full mt-6"
          disabled={medications.every(med => med.trim() === "")}
        >
          Check Interactions
        </Button>
      </form>
    </div>
  );
}