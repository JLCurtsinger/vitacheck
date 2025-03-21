
import { useEffect } from 'react';
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
  
  // Generate a key for the component based on medications and timestamp
  const searchKey = `${medications.join('-')}-${Date.now()}`;
  
  // Load interactions data
  const { loading, interactions, hasAnyInteraction, requestId } = useInteractions(medications);
  
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
            hasInteractions={hasAnyInteraction} 
          />
          
          {loading ? (
            <LoadingIndicator 
              medications={displayNames} // Use display names for UI
              requestId={requestId}
            />
          ) : (
            <InteractionsList 
              interactions={interactions}
              hasAnyInteraction={hasAnyInteraction}
              medications={displayNames} // Pass display names to InteractionsList
              key={searchKey} // Force re-render on new search
            />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
