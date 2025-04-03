
import * as tf from '@tensorflow/tfjs';
import { RiskAssessmentInput, RiskAssessmentOutput, RiskModelFeatures } from '@/lib/utils/risk-assessment/types';
import { calculateRiskScore } from '@/lib/utils/risk-assessment/calculator';
import { supabase } from '@/integrations/supabase/client';

// Model configuration
const MODEL_LEARNING_RATE = 0.01;
const MODEL_VERSION = '1.0.0';
const MIN_SAMPLES_FOR_TRAINING = 10;
const ML_WEIGHT_FACTOR = 0.5; // Start with 50% weight for ML predictions

// Model state
let model: tf.LayersModel | null = null;
let isModelLoading = false;
let modelSampleCount = 0;

/**
 * Initializes the TensorFlow.js model
 * This can be called early in the application lifecycle
 */
export async function initializeModel(): Promise<void> {
  try {
    // Check if we're already loading
    if (isModelLoading) return;
    isModelLoading = true;
    
    console.log('Initializing risk prediction model...');
    
    // Check if we have a saved model in Supabase
    try {
      const { data, error } = await supabase
        .from('ml_models')
        .select('*')
        .eq('model_name', 'risk-prediction-model')
        .eq('model_version', MODEL_VERSION)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error loading model from Supabase:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Load the model from serialized format
        const modelData = data[0];
        model = await tf.loadLayersModel(tf.io.fromMemory(modelData.model_data));
        modelSampleCount = modelData.sample_count || 0;
        console.log('Loaded existing risk prediction model from Supabase');
      } else {
        throw new Error('No model found in Supabase');
      }
    } catch (error) {
      console.log('No saved model found in Supabase, creating a new one');
      model = createModel();
      
      // Save the new model to Supabase
      await saveModelToSupabase(model, 0);
    }
  } catch (error) {
    console.error('Error initializing risk prediction model:', error);
    model = null;
  } finally {
    isModelLoading = false;
  }
}

/**
 * Saves model to Supabase
 */
async function saveModelToSupabase(model: tf.LayersModel, sampleCount: number): Promise<void> {
  try {
    // Serialize model to JSON format
    const saveResult = await model.save(tf.io.withSaveHandler(async (artifacts) => {
      // Return the artifacts with modelArtifactsInfo for proper SaveResult type
      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: 'JSON',
        },
        ...artifacts
      };
    }));
    
    // Save to Supabase
    const { error } = await supabase
      .from('ml_models')
      .upsert({
        model_name: 'risk-prediction-model',
        model_version: MODEL_VERSION,
        model_data: saveResult,
        sample_count: sampleCount
      }, {
        onConflict: 'model_name,model_version'
      });
    
    if (error) {
      console.error('Error saving model to Supabase:', error);
      throw error;
    }
    
    console.log('Model saved to Supabase successfully');
  } catch (error) {
    console.error('Failed to save model to Supabase:', error);
  }
}

/**
 * Creates a new neural network model for risk prediction
 */
function createModel(): tf.LayersModel {
  const inputShape = [10]; // Number of features in our input
  const model = tf.sequential();
  
  // Input layer
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu',
    inputShape
  }));
  
  // Hidden layer
  model.add(tf.layers.dense({
    units: 8,
    activation: 'relu'
  }));
  
  // Output layer - 4 classes (Low, Moderate, High, Lethal) and 1 score value
  model.add(tf.layers.dense({
    units: 5, 
    activation: 'sigmoid'
  }));
  
  // Compile the model
  model.compile({
    optimizer: tf.train.adam(MODEL_LEARNING_RATE),
    loss: 'meanSquaredError',
    metrics: ['accuracy']
  });
  
  return model;
}

/**
 * Fetches the current count of samples in the training dataset
 */
async function fetchModelSampleCount(): Promise<number> {
  try {
    // First check if we have this info in memory
    if (modelSampleCount > 0) {
      return modelSampleCount;
    }
    
    // Otherwise get it from Supabase
    const { data, error } = await supabase
      .from('ml_models')
      .select('sample_count')
      .eq('model_name', 'risk-prediction-model')
      .eq('model_version', MODEL_VERSION)
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching model sample count from Supabase:', error);
      return 0;
    }
    
    if (data && data.length > 0) {
      modelSampleCount = data[0].sample_count || 0;
      console.log(`Model sample count from Supabase: ${modelSampleCount}`);
      return modelSampleCount;
    }
    
    return 0;
  } catch (error) {
    console.error('Error fetching model sample count:', error);
    return 0;
  }
}

/**
 * Converts risk assessment input to model features
 */
function extractFeatures(input: RiskAssessmentInput): RiskModelFeatures {
  // Normalize severity to a value between 0-2
  const severityValue = 
    input.severity === 'severe' ? 2 : 
    input.severity === 'moderate' ? 1 : 0;
  
  // Extract and normalize other features
  const fdaSignal = input.fdaReports?.signal ? 1 : 0;
  const fdaCount = normalizeCount(input.fdaReports?.count);
  
  const openFdaSignal = input.openFDA?.signal ? 1 : 0;
  const openFdaCount = normalizeCount(input.openFDA?.count);
  const openFdaPercentage = normalizePercentage(input.openFDA?.percentage);
  
  const suppaiSignal = input.suppAI?.signal ? 1 : 0;
  const mechanismPlausible = input.mechanism?.plausible ? 1 : 0;
  const aiLiteraturePlausible = input.aiLiterature?.plausible ? 1 : 0;
  const peerReportsSignal = input.peerReports?.signal ? 1 : 0;
  
  return [
    severityValue,
    fdaSignal,
    fdaCount,
    openFdaSignal,
    openFdaCount,
    openFdaPercentage,
    suppaiSignal,
    mechanismPlausible,
    aiLiteraturePlausible,
    peerReportsSignal
  ];
}

/**
 * Helper function to normalize count values
 */
function normalizeCount(count?: number): number {
  if (!count) return 0;
  // Log scale normalization for events/reports counts
  return Math.min(Math.log10(count + 1) / 5, 1);
}

/**
 * Helper function to normalize percentage values 
 */
function normalizePercentage(percentage?: number): number {
  if (!percentage) return 0;
  return percentage / 100;
}

/**
 * Makes a prediction using the model
 */
async function makePrediction(features: RiskModelFeatures): Promise<{
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Lethal';
  score: number;
  confidence: number;
} | null> {
  if (!model) await initializeModel();
  if (!model) return null;
  
  try {
    // Convert features to tensor
    const inputTensor = tf.tensor2d([features]);
    
    // Make prediction
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const predictionData = await prediction.data();
    
    // First 4 values are class probabilities, last value is score
    const probabilities = predictionData.slice(0, 4);
    const maxIndex = tf.argMax(probabilities).dataSync()[0];
    
    // Map index to risk level
    const riskLevels: Array<'Low' | 'Moderate' | 'High' | 'Lethal'> = ['Low', 'Moderate', 'High', 'Lethal'];
    const riskLevel = riskLevels[maxIndex];
    
    // Raw score from model (0-1)
    const rawScore = predictionData[4];
    
    // Scale to 0-100
    const score = Math.round(rawScore * 100);
    
    // Confidence is the probability of the predicted class
    const confidence = probabilities[maxIndex];
    
    // Cleanup
    inputTensor.dispose();
    prediction.dispose();
    
    return {
      riskLevel,
      score,
      confidence
    };
  } catch (error) {
    console.error('Error making prediction:', error);
    return null;
  }
}

/**
 * Saves interaction data for training
 */
export async function saveInteractionData(
  features: RiskModelFeatures,
  predictedRisk: string,
  actualRisk: string | null,
  score: number,
  medications: string[]
): Promise<void> {
  try {
    // Save the data to ml_risk_predictions table
    const { error } = await supabase
      .from('ml_risk_predictions')
      .insert({
        features: features,
        predicted_risk: predictedRisk,
        actual_risk: actualRisk,
        score: score,
        medications: medications,
        model_version: MODEL_VERSION
      });
    
    if (error) throw error;
    
    // Increment sample count
    modelSampleCount++;
    
    // Update the model sample count in Supabase
    if (model) {
      await supabase
        .from('ml_models')
        .update({ sample_count: modelSampleCount })
        .eq('model_name', 'risk-prediction-model')
        .eq('model_version', MODEL_VERSION);
    }
    
    console.log('Saved interaction data for training');
    
    // If we've gathered enough new samples, trigger training via the Edge Function
    if (modelSampleCount >= MIN_SAMPLES_FOR_TRAINING && modelSampleCount % 5 === 0) {
      try {
        const { data, error } = await supabase.functions.invoke('train-ml-model');
        
        if (error) {
          console.error('Error invoking train-ml-model function:', error);
        } else {
          console.log('Train ML model function result:', data);
        }
      } catch (trainError) {
        console.error('Failed to invoke train-ml-model function:', trainError);
      }
    }
  } catch (error) {
    console.error('Error saving interaction data:', error);
  }
}

/**
 * Enhances a rule-based risk assessment with ML predictions
 */
export async function enhanceRiskAssessment(
  input: RiskAssessmentInput,
  baseOutput: RiskAssessmentOutput,
  medications: string[] = []
): Promise<RiskAssessmentOutput> {
  // Extract features from input
  const features = extractFeatures(input);
  
  // Make a prediction using the model if possible
  let mlPrediction = null;
  try {
    mlPrediction = await makePrediction(features);
  } catch (error) {
    console.error('Error enhancing risk assessment with ML:', error);
  }
  
  // If we have a valid ML prediction, blend it with the rule-based output
  if (mlPrediction) {
    // Save the interaction data for future training
    await saveInteractionData(
      features,
      mlPrediction.riskLevel,
      null, // No actual risk yet, this would be updated with user feedback
      mlPrediction.score,
      medications
    );
    
    // Calculate the weighted average based on model maturity
    const mlWeight = Math.min(modelSampleCount / 100, 0.8) * ML_WEIGHT_FACTOR;
    const ruleWeight = 1 - mlWeight;
    
    // Blend the scores
    const blendedScore = Math.round(
      (baseOutput.riskScore * ruleWeight) + (mlPrediction.score * mlWeight)
    );
    
    // Determine flag based on blended score
    let severityFlag: '🔴' | '🟡' | '🟢';
    if (blendedScore >= 70) severityFlag = '🔴';
    else if (blendedScore >= 30) severityFlag = '🟡';
    else severityFlag = '🟢';
    
    // Determine risk level based on blended score
    let riskLevel: 'Low' | 'Moderate' | 'High' | 'Lethal';
    if (blendedScore >= 85) riskLevel = 'Lethal';
    else if (blendedScore >= 65) riskLevel = 'High';
    else if (blendedScore >= 35) riskLevel = 'Moderate';
    else riskLevel = 'Low';
    
    // Return enhanced output
    return {
      ...baseOutput,
      riskScore: blendedScore,
      severityFlag,
      riskLevel,
      mlPrediction: {
        score: mlPrediction.score,
        riskLevel: mlPrediction.riskLevel,
        confidence: mlPrediction.confidence
      },
      modelConfidence: mlPrediction.confidence
    };
  }
  
  // If ML prediction failed, return the base output
  return baseOutput;
}
