import * as tf from '@tensorflow/tfjs';
import { supabase } from '@/integrations/supabase/client';
import { RiskAssessmentInput, RiskAssessmentOutput } from '@/lib/utils/risk-assessment/types';
import { calculateRiskScore } from '@/lib/utils/risk-assessment/calculator';
import { SOURCE_WEIGHTS } from '@/lib/utils/risk-assessment/constants';

// Interface for model prediction results
export interface RiskPrediction {
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Lethal';
  score: number;
}

// Interface for training data
interface TrainingData {
  id: string;
  features: number[];
  predictedRisk: string;
  actualRisk: string;
  score: number;
  medications: string[];
  createdAt: string;
}

// Default model values
const DEFAULT_MODEL_VERSION = '1.0.0';
const MODEL_STORAGE_KEY = 'risk-prediction-model';

// Feature extraction from RiskAssessmentInput
function extractFeatures(input: RiskAssessmentInput): number[] {
  // Convert input data to numerical features
  const features: number[] = [
    // Severity encoding: severe=2, moderate=1, mild=0
    input.severity === 'severe' ? 2 : input.severity === 'moderate' ? 1 : 0,
    
    // FDA reports feature
    input.fdaReports?.signal ? 1 : 0,
    input.fdaReports?.count || 0,
    
    // OpenFDA features
    input.openFDA?.signal ? 1 : 0,
    input.openFDA?.count || 0,
    input.openFDA?.percentage || 0,
    
    // Other signal features
    input.suppAI?.signal ? 1 : 0,
    input.mechanism?.plausible ? 1 : 0,
    input.aiLiterature?.plausible ? 1 : 0,
    input.peerReports?.signal ? 1 : 0,
    
    // Source weights as features
    SOURCE_WEIGHTS.fdaReports,
    SOURCE_WEIGHTS.openFDA,
    SOURCE_WEIGHTS.suppAI,
    SOURCE_WEIGHTS.mechanism,
    SOURCE_WEIGHTS.aiLiterature,
    SOURCE_WEIGHTS.peerReports
  ];
  
  return features;
}

// Risk level mapping from score
function mapScoreToRiskLevel(score: number): 'Low' | 'Moderate' | 'High' | 'Lethal' {
  if (score >= 80) return 'Lethal';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Moderate';
  return 'Low';
}

// Risk level mapping to severity flag
export function mapRiskLevelToSeverityFlag(riskLevel: string): '🔴' | '🟡' | '🟢' {
  switch (riskLevel) {
    case 'Lethal':
    case 'High':
      return '🔴';
    case 'Moderate':
      return '🟡';
    default:
      return '🟢';
  }
}

// Create and save a model
async function createModel(): Promise<tf.LayersModel> {
  // Create a sequential model
  const model = tf.sequential();
  
  // Add layers to the model
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    inputShape: [16] // Number of features
  }));
  
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 1, // Output a single value (risk score)
    activation: 'sigmoid' // Between 0 and 1
  }));
  
  // Compile the model
  model.compile({
    optimizer: tf.train.adam(),
    loss: 'meanSquaredError',
    metrics: ['accuracy']
  });
  
  return model;
}

// Load model from IndexedDB or create a new one
async function loadOrCreateModel(): Promise<tf.LayersModel> {
  try {
    // Try to load the model from IndexedDB
    const model = await tf.loadLayersModel(`indexeddb://${MODEL_STORAGE_KEY}`);
    console.log('Loaded existing risk prediction model');
    return model;
  } catch (error) {
    // If no model exists, create a new one
    console.log('Creating new risk prediction model');
    const model = await createModel();
    
    // Save the model to IndexedDB
    await model.save(`indexeddb://${MODEL_STORAGE_KEY}`);
    return model;
  }
}

// Get or initialize the model (singleton pattern)
let modelPromise: Promise<tf.LayersModel> | null = null;
export function getModel(): Promise<tf.LayersModel> {
  if (!modelPromise) {
    modelPromise = loadOrCreateModel();
  }
  return modelPromise;
}

// Store training data in Supabase
export async function storeTrainingData(
  input: RiskAssessmentInput, 
  prediction: RiskPrediction,
  medications: string[]
): Promise<void> {
  try {
    const features = extractFeatures(input);
    
    // Store the training data
    const { error } = await supabase
      .from('ml_risk_predictions')
      .insert({
        features: features,
        predicted_risk: prediction.riskLevel,
        actual_risk: input.severity === 'severe' ? 'High' : 
                    input.severity === 'moderate' ? 'Moderate' : 'Low',
        score: prediction.score,
        medications: medications,
        model_version: DEFAULT_MODEL_VERSION
      });
      
    if (error) {
      console.error('Error storing training data:', error);
    }
  } catch (error) {
    console.error('Failed to store training data:', error);
  }
}

// Predict risk using the ML model
export async function predictRisk(input: RiskAssessmentInput): Promise<RiskPrediction> {
  try {
    // Extract features from the input
    const features = extractFeatures(input);
    
    // Get the model
    const model = await getModel();
    
    // Make a prediction
    const prediction = tf.tidy(() => {
      const inputTensor = tf.tensor2d([features]);
      const prediction = model.predict(inputTensor) as tf.Tensor;
      return prediction.dataSync()[0];
    });
    
    // Scale the prediction to a 0-100 score
    const score = Math.round(prediction * 100);
    
    // Map the score to a risk level
    const riskLevel = mapScoreToRiskLevel(score);
    
    return { riskLevel, score };
  } catch (error) {
    console.error('Error during risk prediction:', error);
    
    // Fall back to the rule-based system
    const fallbackResult = calculateRiskScore(input);
    return {
      riskLevel: mapScoreToRiskLevel(fallbackResult.riskScore),
      score: fallbackResult.riskScore
    };
  }
}

// Enhance the risk assessment output with ML predictions
export async function enhanceRiskAssessment(
  input: RiskAssessmentInput, 
  baseOutput: RiskAssessmentOutput,
  medications: string[]
): Promise<RiskAssessmentOutput> {
  try {
    // Get prediction from the ML model
    const prediction = await predictRisk(input);
    
    // Store the training data for future model improvement
    await storeTrainingData(input, prediction, medications);
    
    // Decide whether to use the ML prediction or the rule-based result
    // For now, we'll combine them with a weighted average to ensure smooth transition
    // as the model improves over time
    const MODEL_CONFIDENCE = 0.3; // Start with low confidence in the model
    const combinedScore = Math.round(
      prediction.score * MODEL_CONFIDENCE + 
      baseOutput.riskScore * (1 - MODEL_CONFIDENCE)
    );
    
    // Update the severity flag based on the combined score
    const severityFlag = mapRiskLevelToSeverityFlag(mapScoreToRiskLevel(combinedScore));
    
    // Add ML-related adjustment to explain the score
    const mlAdjustment = `ML model risk assessment (${prediction.riskLevel}, score: ${prediction.score})`;
    const adjustments = [...baseOutput.adjustments];
    if (!adjustments.includes(mlAdjustment)) {
      adjustments.push(mlAdjustment);
    }
    
    return {
      ...baseOutput,
      riskScore: combinedScore,
      severityFlag,
      adjustments,
      // Add ML-specific fields that won't affect the UI
      mlPrediction: prediction
    };
  } catch (error) {
    console.error('Error enhancing risk assessment with ML:', error);
    // Return the original output if enhancement fails
    return baseOutput;
  }
}

// Initialize the model in the background
export function initializeModel(): void {
  // Load the model in the background
  getModel().then(() => {
    console.log('Risk prediction model initialized');
  }).catch(error => {
    console.error('Failed to initialize risk prediction model:', error);
  });
}
