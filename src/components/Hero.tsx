import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, Menu, LogOut } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AutocompleteInput from "./AutocompleteInput";
import { saveToRecentSearches } from "@/services/medication-suggestions";
import { prepareMedicationNameForApi } from "@/utils/medication-formatter";

export default function Hero() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [medications, setMedications] = useState<string[]>([""]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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

  return <div className="relative isolate px-6 pt-14 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="absolute top-0 left-0 w-full p-4">
        <div className="flex justify-between items-center">
          <Link to="/" onClick={scrollToTop} className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text hover:opacity-80 transition-opacity duration-300">
            Vitacheck
          </Link>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/experiences" onClick={scrollToTop}>
              <Button variant="ghost">Experiences</Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={logout} 
              className="text-gray-700 hover:text-gray-900 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && <div className="md:hidden absolute top-16 right-4 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
            <Link to="/experiences" onClick={() => {
          setIsMenuOpen(false);
          scrollToTop();
        }} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
              Experiences
            </Link>
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                logout();
              }} 
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>}
      </div>

      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>
      
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">See if medications and supplements mix safely in seconds!</h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">Easily verify potential interactions between medications and supplements. 
Get instant, clear results!</p>
          
          <form onSubmit={handleSubmit} className="mt-10 space-y-4 max-w-xl mx-auto">
            {medications.map((medication, index) => (
              <div key={index} className="flex gap-2">
                <AutocompleteInput
                  value={medication}
                  onChange={(e) => updateMedication(index, e.target.value)}
                  onSelectSuggestion={(value) => handleSelectSuggestion(index, value)}
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
        </div>
      </div>
      
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
      </div>
    </div>;
}
