import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AutocompleteInput from "../AutocompleteInput";
import { saveToRecentSearches } from "@/services/medication-suggestions";
import { prepareMedicationNameForApi } from "@/utils/medication-formatter";

export default function HeroMedicationForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [medications, setMedications] = useState<string[]>([""]);
  const inputRefs = useRef<(HTMLElement | null)[]>([]);

  // Effect to update ref array when medications array changes length
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, medications.length);
  }, [medications.length]);

  const addMedication = () => {
    setMedications([...medications, ""]);
    
    // Focus the new input after render
    setTimeout(() => {
      const lastIndex = medications.length;
      if (inputRefs.current[lastIndex]) {
        const inputElement = inputRefs.current[lastIndex];
        if (inputElement && 'focus' in inputElement && typeof inputElement.focus === 'function') {
          inputElement.focus();
        }
      }
    }, 50);
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

  const validateMedication = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      return {
        isValid: false,
        error: "Medication name must be at least 2 characters"
      };
    }
    if (/[<>{}]/.test(trimmed)) {
      return {
        isValid: false,
        error: "Invalid characters detected"
      };
    }
    return {
      isValid: true,
      error: null
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMedications = medications.map(med => med.trim()).filter(med => med !== "");
    if (validMedications.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter at least one medication or supplement"
      });
      return;
    }
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
      
      // Save to recent searches for autocomplete history
      saveToRecentSearches(med);
    }
    
    // Format medication names for API calls but keep display names
    const formattedMedications = validMedications.map(med => prepareMedicationNameForApi(med));
    console.log('Original medications:', validMedications);
    console.log('Formatted medications for API:', formattedMedications);
    
    navigate("/results", {
      state: {
        medications: formattedMedications,
        displayNames: validMedications // Keep original names for display
      }
    });
  };

  // Handle selection from autocomplete dropdown
  const handleSelectSuggestion = (index: number, value: string) => {
    updateMedication(index, value);
  };
  
  // Handle quick add functionality
  const handleQuickAdd = (index: number) => {
    // First validate the current input
    const currentValue = medications[index].trim();
    if (currentValue === "") return;
    
    const { isValid } = validateMedication(currentValue);
    if (!isValid) return;
    
    // If it's already the last input, add a new one
    if (index === medications.length - 1) {
      addMedication();
    } else {
      // Otherwise focus the next input
      setTimeout(() => {
        if (inputRefs.current[index + 1]) {
          const inputElement = inputRefs.current[index + 1];
          if (inputElement && 'focus' in inputElement && typeof inputElement.focus === 'function') {
            inputElement.focus();
          }
        }
      }, 50);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-4 max-w-xl mx-auto">
      {medications.map((medication, index) => (
        <div 
          key={index} 
          className="flex gap-2 transition-opacity duration-300 opacity-100 animate-fadeIn"
        >
          <AutocompleteInput
            ref={el => {
              // Store reference to input element
              inputRefs.current[index] = el;
            }}
            value={medication}
            onChange={(e) => updateMedication(index, e.target.value)}
            onSelectSuggestion={(value) => handleSelectSuggestion(index, value)}
            onQuickAdd={() => handleQuickAdd(index)}
            placeholder="Enter medication or supplement name"
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
      
      <div className="flex gap-2 justify-center">
        <Button 
          type="button" 
          variant="outline" 
          onClick={addMedication} 
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Add Another
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
  );
}
