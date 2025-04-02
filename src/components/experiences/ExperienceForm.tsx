
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface ExperienceFormData {
  medicationName: string;
  description: string;
  contributingFactors?: string;
  sentiment: "positive" | "neutral" | "negative";
  authorName?: string;
}

interface ExperienceFormProps {
  submitMutation: UseMutationResult<any, Error, ExperienceFormData>;
}

export function ExperienceForm({ submitMutation }: ExperienceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ExperienceFormData>({
    medicationName: "",
    description: "",
    contributingFactors: "",
    sentiment: "neutral",
    authorName: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden xs:inline">Share Experience</span>
          <span className="inline xs:hidden">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Your Experience</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="authorName">Your Name (Optional)</Label>
            <Input 
              id="authorName" 
              value={formData.authorName} 
              onChange={e => setFormData({
                ...formData,
                authorName: e.target.value
              })} 
              placeholder="Enter your name (optional)" 
              className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicationName">Medication(s) Name</Label>
            <Input 
              id="medicationName" 
              value={formData.medicationName} 
              onChange={e => setFormData({
                ...formData,
                medicationName: e.target.value
              })} 
              placeholder="Enter medication name(s)" 
              className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Your Experience</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} 
              placeholder="Share your experience with this medication..." 
              className="min-h-[100px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contributingFactors">Other Contributing Factors (Optional)</Label>
            <Textarea 
              id="contributingFactors" 
              value={formData.contributingFactors} 
              onChange={e => setFormData({
                ...formData,
                contributingFactors: e.target.value
              })} 
              placeholder="Mention anything else that may have affected your experience, such as other medications, lifestyle factors, dosage, timing, or medical conditions…" 
              className="min-h-[80px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
            />
          </div>

          <div className="space-y-2">
            <Label>Overall Experience</Label>
            <div className="flex gap-4">
              {["positive", "neutral", "negative"].map(sentiment => (
                <Button 
                  key={sentiment} 
                  type="button" 
                  variant={formData.sentiment === sentiment ? "default" : "outline"} 
                  onClick={() => setFormData({
                    ...formData,
                    sentiment: sentiment as ExperienceFormData["sentiment"]
                  })} 
                  className={`flex-1 capitalize ${formData.sentiment === sentiment ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "hover:bg-gray-50"}`}
                >
                  {sentiment}
                </Button>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Share Experience"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
