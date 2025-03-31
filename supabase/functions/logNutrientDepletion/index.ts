
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Set up Supabase client with service role for admin privileges
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

/**
 * Normalize a medication name for database storage
 */
function normalizeMedicationName(name: string): string {
  if (!name) return '';
  
  // Convert to lowercase and trim
  let normalized = name.toLowerCase().trim();
  
  // Remove content inside parentheses including the parentheses
  normalized = normalized.replace(/\s*\([^)]*\)/g, '');
  
  // Remove special characters (commas, periods, etc.)
  normalized = normalized.replace(/[,.;:#!?'"]/g, '');
  
  // Replace multiple spaces with a single space
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized.trim();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    )
  }

  try {
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse the request body
    const requestData = await req.json()
    let { medication_name, depleted_nutrient, source } = requestData
    
    // Validate required fields
    if (!medication_name || !depleted_nutrient || !source) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: medication_name, depleted_nutrient, and source are required' 
        }),
        { status: 400, headers: corsHeaders }
      )
    }
    
    // Normalize the medication name
    const normalizedMedication = normalizeMedicationName(medication_name);
    
    console.log(`Processing nutrient depletion: ${normalizedMedication} - ${depleted_nutrient} from ${source}`)
    
    // Check if entry already exists to avoid duplicates
    const { data: existingData, error: queryError } = await supabase
      .from('nutrient_depletions')
      .select('id')
      .ilike('medication_name', normalizedMedication)
      .eq('depleted_nutrient', depleted_nutrient)
      .limit(1)
    
    if (queryError) {
      console.error('Error checking for existing entry:', queryError)
      return new Response(
        JSON.stringify({ error: 'Error checking for existing entry', details: queryError }),
        { status: 500, headers: corsHeaders }
      )
    }
    
    // Only insert if this is a new entry
    if (!existingData || existingData.length === 0) {
      // Try to find or create a substance first
      const { data: substanceData } = await supabase
        .from('substances')
        .select('id')
        .ilike('name', normalizedMedication)
        .limit(1);
        
      let substanceId = null;
      
      if (!substanceData || substanceData.length === 0) {
        // Create a new substance
        const displayName = medication_name
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
          
        const { data: newSubstance } = await supabase
          .from('substances')
          .insert({
            name: normalizedMedication,
            display_name: displayName,
            type: 'medication',
            origin: 'User'
          })
          .select('id')
          .single();
          
        if (newSubstance) {
          substanceId = newSubstance.id;
        }
      } else {
        substanceId = substanceData[0].id;
      }
      
      const { data, error: insertError } = await supabase
        .from('nutrient_depletions')
        .insert({
          medication_name: normalizedMedication,
          depleted_nutrient: depleted_nutrient,
          source: source,
          substance_id: substanceId
        })
        .select()
      
      if (insertError) {
        console.error('Error inserting nutrient depletion:', insertError)
        return new Response(
          JSON.stringify({ error: 'Error inserting entry', details: insertError }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      console.log('Successfully inserted nutrient depletion data')
      return new Response(
        JSON.stringify({ success: true, data: data }),
        { status: 200, headers: corsHeaders }
      )
    }
    
    // Return success even if we didn't insert (it already exists)
    console.log('Nutrient depletion already exists, no insertion needed')
    return new Response(
      JSON.stringify({ success: true, alreadyExists: true }),
      { status: 200, headers: corsHeaders }
    )
    
  } catch (error) {
    console.error('Unhandled error in logNutrientDepletion function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
