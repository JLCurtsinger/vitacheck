import { supabase } from '@/lib/supabase';

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