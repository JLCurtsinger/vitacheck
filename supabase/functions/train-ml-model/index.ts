
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as tf from "npm:@tensorflow/tfjs@4.10.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model configuration
const MODEL_VERSION = '1.0.0';
const MODEL_LEARNING_RATE = 0.01;

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the latest model and training data
    const { data: modelData, error: modelError } = await supabase
      .from('ml_models')
      .select('*')
      .eq('model_name', 'risk-prediction-model')
      .eq('model_version', MODEL_VERSION)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (modelError) {
      throw new Error(`Error fetching model: ${modelError.message}`);
    }

    // Fetch training data
    const { data: trainingData, error: dataError } = await supabase
      .from('ml_risk_predictions')
      .select('*')
      .eq('model_version', MODEL_VERSION)
      .order('created_at', { ascending: true });

    if (dataError) {
      throw new Error(`Error fetching training data: ${dataError.message}`);
    }

    console.log(`Found ${trainingData.length} training samples`);
    
    if (trainingData.length < 10) {
      return new Response(
        JSON.stringify({ message: 'Not enough training data, need at least 10 samples' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process training data
    const features: number[][] = [];
    const labels: number[][] = [];

    trainingData.forEach((sample) => {
      if (sample.features && Array.isArray(sample.features)) {
        features.push(sample.features);
        
        // Create one-hot encoded label
        // [Low, Moderate, High, Lethal, Score]
        const label = [0, 0, 0, 0, sample.score / 100]; // Scale score to 0-1
        
        // Set the appropriate class
        switch (sample.predicted_risk) {
          case 'Low':
            label[0] = 1;
            break;
          case 'Moderate':
            label[1] = 1;
            break;
          case 'High': 
            label[2] = 1;
            break;
          case 'Lethal':
            label[3] = 1;
            break;
        }
        
        labels.push(label);
      }
    });

    // Initialize model architecture
    const model = await tf.loadLayersModel(tf.io.fromMemory(modelData.model_data));
    
    // Prepare training data
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);
    
    // Train the model
    await model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      shuffle: true,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss}`);
        }
      }
    });
    
    // Save the updated model
    const saveResults = await model.save(tf.io.withSaveHandler(async (artifacts) => {
      return artifacts;
    }));
    
    // Update model in database
    const { error: updateError } = await supabase
      .from('ml_models')
      .update({
        model_data: saveResults,
        sample_count: trainingData.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', modelData.id);
    
    if (updateError) {
      throw new Error(`Error updating model: ${updateError.message}`);
    }
    
    // Cleanup tensors
    xs.dispose();
    ys.dispose();
    
    return new Response(
      JSON.stringify({ 
        message: 'Model trained successfully', 
        samples: trainingData.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in training model:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
