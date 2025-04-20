
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { ExperienceForm } from "@/components/experiences/ExperienceForm";
import { ExperiencesList } from "@/components/experiences/ExperiencesList";
import { SearchAndFilter } from "@/components/experiences/SearchAndFilter";
import { ExperiencesHeader } from "@/components/experiences/ExperiencesHeader";
import { supabase } from "@/integrations/supabase/client";
import { Experience, ExperienceFormData } from "@/components/experiences/types";

export default function Experiences() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch experiences from Supabase
  const { data: experiences, isLoading } = useQuery({
    queryKey: ["experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load experiences");
        throw error;
      }

      return data as Experience[];
    }
  });

  // Submit experience mutation
  const submitMutation = useMutation({
    mutationFn: async (formData: ExperienceFormData) => {
      const { data, error } = await supabase.from("experiences").insert({
        medication_name: formData.medicationName,
        description: formData.description,
        contributing_factors: formData.contributingFactors || null,
        sentiment: formData.sentiment,
        author_name: formData.authorName || null,
        upvotes: 0,
        downvotes: 0
      });

      if (error) {
        toast.error("Failed to submit experience");
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Experience shared successfully!");
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
    },
    onError: (error) => {
      console.error("Error sharing experience:", error);
      toast.error("Failed to share experience. Please try again.");
    }
  });

  // Vote mutation with optimistic updates
  const voteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'upvote' | 'downvote' }) => {
      const column = type === 'upvote' ? 'upvotes' : 'downvotes';
      
      // Get the current record first
      const { data: currentRecord, error: fetchError } = await supabase
        .from("experiences")
        .select(`id, ${column}`)
        .eq('id', id)
        .single();
      
      if (fetchError) {
        toast.error(`Failed to fetch current vote count`);
        throw fetchError;
      }
      
      // Update with the incremented value
      const newCount = (currentRecord[column] || 0) + 1;
      
      const { data, error } = await supabase
        .from("experiences")
        .update({ [column]: newCount })
        .eq('id', id)
        .select();

      if (error) {
        toast.error(`Failed to ${type}`);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      const voteType = variables.type === 'upvote' ? 'Upvoted' : 'Downvoted';
      toast.success(`${voteType} experience`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
    },
    onError: (error) => {
      console.error("Error voting:", error);
      toast.error("Failed to record vote. Please try again.");
    }
  });

  // Store voted IDs in localStorage to prevent duplicate voting
  useEffect(() => {
    const storedVotes = localStorage.getItem('vitacheck-experience-votes');
    if (!storedVotes) {
      localStorage.setItem('vitacheck-experience-votes', JSON.stringify({}));
    }
  }, []);

  // Filter experiences based on search query
  const filteredExperiences = experiences?.filter(experience => {
    if (!searchQuery) return true;
    
    const lowercaseQuery = searchQuery.toLowerCase();
    return (
      experience.medication_name.toLowerCase().includes(lowercaseQuery) ||
      experience.description.toLowerCase().includes(lowercaseQuery) ||
      (experience.author_name && experience.author_name.toLowerCase().includes(lowercaseQuery)) ||
      (experience.contributing_factors && experience.contributing_factors.toLowerCase().includes(lowercaseQuery))
    );
  });

  return (
    <div className="min-h-screen flex flex-col">
      <ExperiencesHeader isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      
      <main className="flex-1 pt-24 pb-16 px-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Medication Experiences</h1>
            <p className="text-gray-600 mt-1">
              Real experiences shared by real people
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <ExperienceForm submitMutation={submitMutation} />
          </div>
        </div>
        
        <SearchAndFilter searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        
        <ExperiencesList 
          experiences={filteredExperiences} 
          isLoading={isLoading}
          voteMutation={voteMutation}
        />
      </main>
      
      <Footer />
    </div>
  );
}
