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
    
    // For single medications, also fetch adverse events data
    const isSingleMed = !medications || medications.length === 1
    let adverseEventsData = null

    if (isSingleMed) {
      try {
        const fdaUrl = `https://api.fda.gov/drug/event.json?search=(patient.drug.openfda.generic_name:"${encodeURIComponent(medToQuery)}"+OR+patient.drug.openfda.brand_name:"${encodeURIComponent(medToQuery)}")&limit=10`
        console.log(`🔍 GET-INTERACTIONS: Fetching FDA data for single med ${medToQuery} from: ${fdaUrl}`)
        
        const fdaResponse = await fetch(fdaUrl)
        
        if (fdaResponse.ok) {
          const fdaData = await fdaResponse.json()
          
          if (fdaData.results && fdaData.results.length > 0) {
            const eventCount = fdaData.meta?.results?.total || fdaData.results.length
            let seriousCount = 0
            const reactions = new Map<string, number>()
            
            fdaData.results.forEach(result => {
              if (result.serious === '1') {
                seriousCount++
              }
              
              result.patient?.reaction?.forEach(reaction => {
                if (reaction.reactionmeddrapt) {
                  const count = reactions.get(reaction.reactionmeddrapt) || 0
                  reactions.set(reaction.reactionmeddrapt, count + 1)
                }
              })
            })
            
            const sortedReactions = Array.from(reactions.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([reaction]) => reaction)
            
            adverseEventsData = {
              eventCount,
              seriousCount,
              commonReactions: sortedReactions
            }
            
            console.log(`✅ GET-INTERACTIONS: Found ${eventCount} adverse events for ${medToQuery}`)
          }
        }
      } catch (error) {
        console.error(`❌ GET-INTERACTIONS: Error fetching FDA data: ${error.message}`)
        // Continue with the regular request even if FDA fetch fails
      }
    }
    
    const url = `https://supp.ai/api/agent/search?q=${encodeURIComponent(medToQuery)}`
    
    console.log(`🔍 GET-INTERACTIONS: Fetching data for ${medToQuery} from: ${url}`)
    
    const response = await fetch(url)
    const data: SuppAiResponse = await response.json()
    
    console.log(`✅ GET-INTERACTIONS: Response received for ${medToQuery}:`, 
      data.interactions ? `Found ${data.interactions.length} interactions` : 'No interactions found')
    
    // Add adverse events data to the response if available
    const responseData = {
      ...data,
      adverseEvents: adverseEventsData
    }
    
    return new Response(JSON.stringify(responseData), {
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
