import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
export default function Hero() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [medications, setMedications] = useState<string[]>([""]);
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
      const {
        isValid,
        error
      } = validateMedication(med);
      if (!isValid) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: `${med}: ${error}`
        });
        return;
      }
    }
    navigate("/results", {
      state: {
        medications: validMedications
      }
    });
  };
  return <div className="relative isolate px-6 pt-14 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>
      
      <div className="absolute top-0 left-0 w-full p-4">
        <a onClick={scrollToTop} className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text cursor-pointer hover:opacity-80 transition-opacity duration-300">
          Vitacheck
        </a>
      </div>
      
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">See if medications and supplements mix safely in seconds!</h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">Easily verify potential interactions between medications and supplements. 
Get instant, clear results!</p>
          
          <form onSubmit={handleSubmit} className="mt-10 space-y-4 max-w-xl mx-auto">
            {medications.map((medication, index) => <div key={index} className="flex gap-2">
                <Input value={medication} onChange={e => updateMedication(index, e.target.value)} placeholder="Enter medication or supplement name" className="flex-1 h-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" />
                {medications.length > 1 && <Button type="button" variant="outline" size="icon" onClick={() => removeMedication(index)} className="hover:bg-red-50 hover:text-red-600 transition-colors">
                    <X className="h-4 w-4" />
                  </Button>}
              </div>)}
            
            <div className="flex gap-2 justify-center">
              <Button type="button" variant="outline" onClick={addMedication} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 transition-all hover:scale-105">
                <Plus className="h-4 w-4" />
                Add Another
              </Button>
            </div>

            <Button type="submit" className="w-full mt-6 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100" disabled={medications.every(med => med.trim() === "")}>
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