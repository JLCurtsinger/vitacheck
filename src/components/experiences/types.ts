
export interface Experience {
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

export interface ExperienceFormData {
  medicationName: string;
  description: string;
  contributingFactors?: string;
  sentiment: "positive" | "neutral" | "negative";
  authorName?: string;
}
