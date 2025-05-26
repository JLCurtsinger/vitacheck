import { useState, useEffect } from 'react';
import { getUsageStats, UsageStats } from '../services/usage';
import { computeRisk } from '../lib/risk';
import config from '../config/risk.json';

interface WarningDetailProps {
  drugName: string;
  totalInteractions: number;
  totalSevereEvents: number;
}

export function WarningDetail({ drugName, totalInteractions, totalSevereEvents }: WarningDetailProps) {
  const [usage, setUsage] = useState<UsageStats>({ users: 0, claims: 0, avgSpend: 0 });
  const [adjustedRisk, setAdjustedRisk] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const stats = await getUsageStats(drugName);
      setUsage(stats);
      const risk = computeRisk(totalInteractions, totalSevereEvents, stats.users);
      setAdjustedRisk(risk);
    })();
  }, [drugName, totalInteractions, totalSevereEvents]);

  return (
    <div className="warning-detail">
      {/* ... existing warning text ... */}
      <p>Users in 2022: {usage.users.toLocaleString()}</p>
      {adjustedRisk !== null && (
        <p>
          Adjusted risk (α={config.alpha}): {(adjustedRisk * 100).toFixed(2)}%
        </p>
      )}
    </div>
  );
} 