
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Filter, Plus, ThumbsUp, ThumbsDown } from "lucide-react";
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

        {/* Experiences List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading experiences...</p>
            </div>
          ) : !experiences?.length ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-gray-500 text-center py-8">
                No experiences shared yet. Be the first to share your experience!
              </p>
            </div>
          ) : (
            experiences.map((experience) => (
              <div key={experience.id} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
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
                    className="text-gray-600"
                    onClick={() => voteMutation.mutate({ id: experience.id, type: 'upvote' })}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    {experience.upvotes}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-600"
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
