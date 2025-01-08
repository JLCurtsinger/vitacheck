import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with required URL and key
const supabase = createClient(
  'https://39015cd8-1141-4c60-a2d6-0967f8e916c9.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IjM5MDE1Y2Q4LTExNDEtNGM2MC1hMmQ2LTA5NjdmOGU5MTZjOSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA5NzQ5MjAwLCJleHAiOjIwMjUzMjUyMDB9.YQvf0_p0zHf1WVqPmwrYeK_E_6RKZhZFXF_YK_YNZB4'
);

export interface InteractionResult {
  medications: [string, string];
  severity: "safe" | "minor" | "severe";
  description: string;
  evidence?: string;
}

export async function checkInteractions(medications: string[]): Promise<InteractionResult[]> {
  try {
    const { data: { suppai_key }, error: keyError } = await supabase
      .from('secrets')
      .select('suppai_key')
      .single();

    if (keyError) throw new Error('Failed to retrieve API key');

    const response = await fetch('https://api.supp.ai/v1/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${suppai_key}`
      },
      body: JSON.stringify({ medications })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch interaction data');
    }

    const data = await response.json();
    return data.interactions.map((interaction: any) => ({
      medications: [interaction.drug1, interaction.drug2],
      severity: interaction.severity,
      description: interaction.description,
      evidence: interaction.evidence_url
    }));
  } catch (error) {
    console.error('Error checking interactions:', error);
    throw error;
  }
}