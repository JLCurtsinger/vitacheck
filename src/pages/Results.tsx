
import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInteractions } from '@/hooks/use-interactions';
import { ResultsHeader } from '@/components/results/ResultsHeader';
import { LoadingIndicator } from '@/components/results/LoadingIndicator';
import { InteractionsList } from '@/components/results/InteractionsList';
import Footer from '@/components/Footer';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const medications = location.state?.medications || [];
  const displayNames = location.state?.displayNames || medications; // Use display names if available, otherwise use formatted names
  
  // Generate a stable key for the component based on medications
  // Sort medications for consistency regardless of input order
  const searchKey = useMemo(() => {
    const sortedMeds = [...medications].sort().join('-');
    return `interactions-${sortedMeds}`;
  }, [medications]);
  
  // Load interactions data for all medication combinations
  const { loading, interactions, hasAnyInteraction, requestId } = useInteractions(medications);
  
  // Flag for single medication search
  const isSingleMedication = medications.length === 1;
  
  // Check if we have adverse events data for a single medication
  const hasSingleMedicationData = useMemo(() => {
    if (!isSingleMedication || interactions.length === 0) return false;
    
    return interactions.some(interaction => 
      interaction.sources && interaction.sources.some(source => 
        source.eventData && source.eventData.totalEvents > 0
      )
    );
  }, [isSingleMedication, interactions]);
  
  // If no medications were passed, redirect to the check page
  useEffect(() => {
    if (!medications.length) {
      navigate('/check');
    }
  }, [medications, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <ResultsHeader 
            medications={displayNames} // Use display names for UI
            hasInteractions={hasAnyInteraction || (isSingleMedication && hasSingleMedicationData)} 
          />
          
          {loading ? (
            <LoadingIndicator 
              medications={displayNames} // Use display names for UI
              requestId={requestId}
            />
          ) : (
            <InteractionsList 
              interactions={interactions}
              hasAnyInteraction={hasAnyInteraction || (isSingleMedication && hasSingleMedicationData)}
              medications={displayNames} // Pass display names to InteractionsList
              key={searchKey} // Use consistent key for re-renders
            />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
