
import { ExperienceCard } from "./ExperienceCard";
import { UseMutationResult } from "@tanstack/react-query";

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

interface ExperiencesListProps {
  experiences: Experience[] | undefined;
  isLoading: boolean;
  voteMutation: UseMutationResult<any, Error, { id: string; type: 'upvote' | 'downvote' }>;
}

export function ExperiencesList({ experiences, isLoading, voteMutation }: ExperiencesListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading experiences...</p>
      </div>
    );
  }

  if (!experiences?.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
        <p className="text-gray-500 text-center">
          No experiences shared yet. Be the first to share your experience!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {experiences.map((experience) => (
        <ExperienceCard 
          key={experience.id} 
          experience={experience} 
          voteMutation={voteMutation}
        />
      ))}
    </div>
  );
}
