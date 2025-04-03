
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Service for managing ML model operations
 */
export const modelService = {
  /**
   * Triggers the training of the ML model using the Supabase Edge Function
   */
  async trainModel(): Promise<boolean> {
    try {
      toast.info('Starting model training...');
      
      const { data, error } = await supabase.functions.invoke('train-ml-model');
      
      if (error) {
        console.error('Error training model:', error);
        toast.error('Model training failed');
        return false;
      }
      
      console.log('Training result:', data);
      toast.success(`Model trained successfully with ${data.samples} samples`);
      return true;
    } catch (error) {
      console.error('Error in trainModel:', error);
      toast.error('Model training failed');
      return false;
    }
  },
  
  /**
   * Gets the current count of samples in the risk predictions table
   */
  async getSampleCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('ml_risk_predictions')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Error getting sample count:', error);
      return 0;
    }
  },
  
  /**
   * Gets information about the current model
   */
  async getModelInfo(): Promise<{
    version: string;
    sampleCount: number;
    lastUpdated: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('ml_models')
        .select('model_version, sample_count, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      
      return {
        version: data[0].model_version,
        sampleCount: data[0].sample_count,
        lastUpdated: data[0].updated_at
      };
    } catch (error) {
      console.error('Error getting model info:', error);
      return null;
    }
  }
};
