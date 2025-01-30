import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface SuppAiResponse {
  interactions?: Array<{
    drug1: string;
    drug2: string;
    evidence_count: number;
    label: string;
  }>;
}

serve(async (req) => {
  try {
    const { medication } = await req.json()
    const url = `https://supp.ai/api/agent/search?q=${encodeURIComponent(medication)}`
    
    const response = await fetch(url)
    const data: SuppAiResponse = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})