
-- Create table for storing ML risk prediction data
CREATE TABLE IF NOT EXISTS public.ml_risk_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  features JSONB NOT NULL,
  predicted_risk TEXT NOT NULL,
  actual_risk TEXT,
  score INTEGER NOT NULL,
  medications TEXT[] NOT NULL,
  model_version TEXT NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_ml_risk_predictions_created_at 
ON public.ml_risk_predictions (created_at);

-- Enable RLS
ALTER TABLE public.ml_risk_predictions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all inserts
CREATE POLICY "Allow all inserts" ON public.ml_risk_predictions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Create policy to allow reading all records for analysis
CREATE POLICY "Allow reading all records" ON public.ml_risk_predictions
  FOR SELECT TO anon, authenticated
  USING (true);
