
import { useState, useEffect } from "react";
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
  const [hasVoted, setHasVoted] = useState<'upvote' | 'downvote' | null>(null);
  const [localUpvotes, setLocalUpvotes] = useState(experience.upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(experience.downvotes);

  // Check if the user has already voted on this experience
  useEffect(() => {
    const storedVotes = JSON.parse(localStorage.getItem('vitacheck-experience-votes') || '{}');
    if (storedVotes[experience.id]) {
      setHasVoted(storedVotes[experience.id]);
    }

    // Update local counts when experience changes
    setLocalUpvotes(experience.upvotes);
    setLocalDownvotes(experience.downvotes);
  }, [experience.id, experience.upvotes, experience.downvotes]);

  const handleVote = (type: 'upvote' | 'downvote') => {
    // Prevent duplicate voting
    if (hasVoted) {
      return;
    }
    
    // Optimistically update the UI
    if (type === 'upvote') {
      setLocalUpvotes(prev => prev + 1);
    } else {
      setLocalDownvotes(prev => prev + 1);
    }

    // Store the vote in localStorage
    const storedVotes = JSON.parse(localStorage.getItem('vitacheck-experience-votes') || '{}');
    storedVotes[experience.id] = type;
    localStorage.setItem('vitacheck-experience-votes', JSON.stringify(storedVotes));
    
    // Set local state to show the vote has been cast
    setHasVoted(type);
    
    // Submit the vote to the server
    voteMutation.mutate({ id: experience.id, type }, {
      onError: () => {
        // Revert optimistic update if the mutation fails
        if (type === 'upvote') {
          setLocalUpvotes(prev => prev - 1);
        } else {
          setLocalDownvotes(prev => prev - 1);
        }
        
        // Clear the vote from localStorage
        const revertedVotes = JSON.parse(localStorage.getItem('vitacheck-experience-votes') || '{}');
        delete revertedVotes[experience.id];
        localStorage.setItem('vitacheck-experience-votes', JSON.stringify(revertedVotes));
        
        // Reset the vote state
        setHasVoted(null);
      }
    });
  };

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
          className={`border-2 ${hasVoted === 'upvote' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} hover:border-blue-500 hover:bg-white/50`}
          onClick={() => handleVote('upvote')}
          disabled={voteMutation.isPending || hasVoted !== null}
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          {localUpvotes}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`border-2 ${hasVoted === 'downvote' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} hover:border-blue-500 hover:bg-white/50`}
          onClick={() => handleVote('downvote')}
          disabled={voteMutation.isPending || hasVoted !== null}
        >
          <ThumbsDown className="w-4 h-4 mr-2" />
          {localDownvotes}
        </Button>
      </div>
    </div>
  );
}
