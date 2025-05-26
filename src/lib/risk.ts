import config from '../config/risk.json';

export function computeRisk(
  totalInteractions: number,
  severeEvents: number,
  users: number
): number {
  const rawRate = severeEvents / totalInteractions;
  const exposureRate = users > 0 ? severeEvents / users : rawRate;
  // blend according to alpha
  return config.alpha * exposureRate + (1 - config.alpha) * rawRate;
} 