
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import Footer from "@/components/Footer";
import { ExperiencesHeader } from "@/components/experiences/ExperiencesHeader";
import { ExperienceForm } from "@/components/experiences/ExperienceForm";
import { SearchAndFilter } from "@/components/experiences/SearchAndFilter";
import { ExperiencesList } from "@/components/experiences/ExperiencesList";

interface Experience {
  id: string;
  medication_name: string;
  description: string;
  contributing_factors?: string;
  sentiment: "positive" | "neutral" | "negative";
  upvotes: number;
  downvotes: number;
  created_at: string;
  author_name?: string;
}

interface ExperienceFormData {
  medicationName: string;
  description: string;
  contributingFactors?: string;
  sentiment: "positive" | "neutral" | "negative";
  authorName?: string;
}

export default function Experiences() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: experiences, isLoading } = useQuery({
    queryKey: ['experiences', searchQuery],
    queryFn: async () => {
      let query = supabase.from('experiences').select('*').order('created_at', {
        ascending: false
      });
      if (searchQuery) {
        query = query.ilike('medication_name', `%${searchQuery}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Experience[];
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ExperienceFormData) => {
      const { data: result, error } = await supabase
        .from('experiences')
        .insert([{
          medication_name: data.medicationName,
          description: data.description,
          contributing_factors: data.contributingFactors || null,
          sentiment: data.sentiment,
          author_name: data.authorName || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast.success("Experience shared successfully!");
    },
    onError: error => {
      console.error('Error submitting experience:', error);
      toast.error("Failed to share experience. Please try again.");
    }
  });

  const voteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'upvote' | 'downvote' }) => {
      const field = type === 'upvote' ? 'upvotes' : 'downvotes';
      
      const { data: current, error: getError } = await supabase
        .from('experiences')
        .select(field)
        .eq('id', id)
        .single();
      
      if (getError) throw getError;
      
      const { data, error: updateError } = await supabase
        .from('experiences')
        .update({ [field]: (current?.[field] || 0) + 1 })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast.success(`Vote registered successfully!`);
    },
    onError: (error) => {
      console.error('Error registering vote:', error);
      toast.error("Failed to register vote. Please try again.");
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
      <ExperiencesHeader isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 flex-grow">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            User Experiences
          </h2>
          <ExperienceForm submitMutation={submitMutation} />
        </div>

        <SearchAndFilter searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <ExperiencesList experiences={experiences} isLoading={isLoading} voteMutation={voteMutation} />
      </main>

      <Footer />
    </div>
  );
}
