
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Filter, Plus, ThumbsUp, ThumbsDown, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Experience {
  id: string;
  medication_name: string;
  description: string;
  sentiment: "positive" | "neutral" | "negative";
  upvotes: number;
  downvotes: number;
  created_at: string;
}

interface ExperienceFormData {
  medicationName: string;
  description: string;
  sentiment: "positive" | "neutral" | "negative";
}

export default function Experiences() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState<ExperienceFormData>({
    medicationName: "",
    description: "",
    sentiment: "neutral"
  });
  
  const queryClient = useQueryClient();

  // Fetch experiences
  const { data: experiences, isLoading } = useQuery({
    queryKey: ['experiences', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('experiences')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (searchQuery) {
        query = query.ilike('medication_name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Experience[];
    }
  });

  // Submit new experience
  const submitMutation = useMutation({
    mutationFn: async (data: ExperienceFormData) => {
      const { data: result, error } = await supabase
        .from('experiences')
        .insert([{
          medication_name: data.medicationName,
          description: data.description,
          sentiment: data.sentiment
        }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast.success("Experience shared successfully!");
      setFormData({
        medicationName: "",
        description: "",
        sentiment: "neutral"
      });
    },
    onError: (error) => {
      console.error('Error submitting experience:', error);
      toast.error("Failed to share experience. Please try again.");
    }
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

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'upvote' | 'downvote' }) => {
      const field = type === 'upvote' ? 'upvotes' : 'downvotes';
      const { data, error } = await supabase
        .from('experiences')
        .update({ [field]: supabase.rpc('increment') })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    },
    onError: () => {
      toast.error("Failed to register vote. Please try again.");
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation Bar */}
      <div className="absolute top-0 left-0 w-full p-4 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              VitaCheck
            </h1>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/check">
              <Button variant="ghost">Interaction Checker</Button>
            </Link>
            <Link to="/experiences">
              <Button variant="ghost" className="bg-white/10 text-blue-600">Experiences</Button>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 right-4 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
            <Link 
              to="/check"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Interaction Checker
            </Link>
            <Link 
              to="/experiences"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-blue-600 bg-blue-50"
            >
              Experiences
            </Link>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Medication Experiences
          </h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
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
                    className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
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
                    className="min-h-[100px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
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
                        className={`flex-1 capitalize ${
                          formData.sentiment === sentiment 
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
                            : "hover:bg-gray-50"
                        }`}
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
              className="pl-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <Button variant="outline" className="border-2 border-gray-200 hover:border-blue-500 hover:bg-white/50">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Experiences List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading experiences...</p>
            </div>
          ) : !experiences?.length ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
              <p className="text-gray-500 text-center">
                No experiences shared yet. Be the first to share your experience!
              </p>
            </div>
          ) : (
            experiences.map((experience) => (
              <div key={experience.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 space-y-4 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{experience.medication_name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(experience.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm font-medium capitalize" 
                    style={{
                      backgroundColor: experience.sentiment === 'positive' ? '#dcfce7' : 
                                    experience.sentiment === 'negative' ? '#fee2e2' : '#f3f4f6',
                      color: experience.sentiment === 'positive' ? '#166534' : 
                            experience.sentiment === 'negative' ? '#991b1b' : '#374151'
                    }}>
                    {experience.sentiment}
                  </div>
                </div>
                
                <p className="text-gray-700">{experience.description}</p>
                
                <div className="flex gap-4 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 border-gray-200 hover:border-blue-500 hover:bg-white/50"
                    onClick={() => voteMutation.mutate({ id: experience.id, type: 'upvote' })}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    {experience.upvotes}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 border-gray-200 hover:border-blue-500 hover:bg-white/50"
                    onClick={() => voteMutation.mutate({ id: experience.id, type: 'downvote' })}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    {experience.downvotes}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
