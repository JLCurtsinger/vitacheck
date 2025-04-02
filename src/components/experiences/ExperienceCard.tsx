
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
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

interface ExperienceCardProps {
  experience: Experience;
  voteMutation: UseMutationResult<any, Error, { id: string; type: 'upvote' | 'downvote' }>;
}

export function ExperienceCard({ experience, voteMutation }: ExperienceCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 space-y-4 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{experience.medication_name}</h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">
              {new Date(experience.created_at).toLocaleDateString()}
            </p>
            {experience.author_name && (
              <>
                <span className="text-gray-300">•</span>
                <p className="text-sm text-gray-500">
                  Shared by {experience.author_name}
                </p>
              </>
            )}
          </div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-sm font-medium capitalize"
          style={{
            backgroundColor:
              experience.sentiment === 'positive'
                ? '#dcfce7'
                : experience.sentiment === 'negative'
                ? '#fee2e2'
                : '#f3f4f6',
            color:
              experience.sentiment === 'positive'
                ? '#166534'
                : experience.sentiment === 'negative'
                ? '#991b1b'
                : '#374151'
          }}
        >
          {experience.sentiment}
        </div>
      </div>
      
      <p className="text-gray-700">{experience.description}</p>
      
      {experience.contributing_factors && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <p className="font-medium mb-1">Contributing factors:</p>
          <p>{experience.contributing_factors}</p>
        </div>
      )}
      
      <div className="flex gap-4 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="border-2 border-gray-200 hover:border-blue-500 hover:bg-white/50"
          onClick={() => voteMutation.mutate({ id: experience.id, type: 'upvote' })}
          disabled={voteMutation.isPending}
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          {experience.upvotes}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-2 border-gray-200 hover:border-blue-500 hover:bg-white/50"
          onClick={() => voteMutation.mutate({ id: experience.id, type: 'downvote' })}
          disabled={voteMutation.isPending}
        >
          <ThumbsDown className="w-4 h-4 mr-2" />
          {experience.downvotes}
        </Button>
      </div>
    </div>
  );
}
