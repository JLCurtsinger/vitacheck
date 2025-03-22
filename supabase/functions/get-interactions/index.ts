
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
    const { medication, medications } = await req.json()
    
    // Support both single medication and array of medications
    const medToQuery = medication || (medications && medications[0])
    
    if (!medToQuery) {
      return new Response(JSON.stringify({ error: "No medication provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
    
    const url = `https://supp.ai/api/agent/search?q=${encodeURIComponent(medToQuery)}`
    
    console.log(`🔍 GET-INTERACTIONS: Fetching data for ${medToQuery} from: ${url}`)
    
    const response = await fetch(url)
    const data: SuppAiResponse = await response.json()
    
    console.log(`✅ GET-INTERACTIONS: Response received for ${medToQuery}:`, 
      data.interactions ? `Found ${data.interactions.length} interactions` : 'No interactions found')
    
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error(`❌ GET-INTERACTIONS: Error:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
