
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Filter, Plus } from "lucide-react";
import { toast } from "sonner";

interface ExperienceFormData {
  medicationName: string;
  description: string;
  sentiment: "positive" | "neutral" | "negative";
}

export default function Experiences() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ExperienceFormData>({
    medicationName: "",
    description: "",
    sentiment: "neutral"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // For now, just simulate submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Experience shared successfully!");
      setFormData({
        medicationName: "",
        description: "",
        sentiment: "neutral"
      });
    } catch (error) {
      toast.error("Failed to share experience. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                VitaCheck
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/check">
                <Button variant="ghost">Interaction Checker</Button>
              </Link>
              <Link to="/experiences">
                <Button variant="ghost" className="text-blue-600">Experiences</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Medication Experiences
          </h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Share Experience
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Share Your Experience</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="medicationName">Medication Name</Label>
                  <Input
                    id="medicationName"
                    value={formData.medicationName}
                    onChange={(e) => setFormData({...formData, medicationName: e.target.value})}
                    placeholder="Enter medication name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Your Experience</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Share your experience with this medication..."
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Overall Experience</Label>
                  <div className="flex gap-4">
                    {["positive", "neutral", "negative"].map((sentiment) => (
                      <Button
                        key={sentiment}
                        type="button"
                        variant={formData.sentiment === sentiment ? "default" : "outline"}
                        onClick={() => setFormData({...formData, sentiment: sentiment as ExperienceFormData["sentiment"]})}
                        className="flex-1 capitalize"
                      >
                        {sentiment}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Share Experience"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search experiences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Placeholder for Reviews */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-gray-500 text-center py-8">
            No experiences shared yet. Be the first to share your experience!
          </p>
        </div>
      </main>
    </div>
  );
}
