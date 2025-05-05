
import { InteractionSource } from "@/lib/api/types";
import { FDASourceContent } from "./FDASourceContent";
import { RxNormSourceContent } from "./RxNormSourceContent";
import { SuppAISourceContent } from "./SuppAISourceContent";
import { AdverseEventsSourceContent } from "./AdverseEventsSourceContent";
import { AILiteratureSourceContent } from "./AILiteratureSourceContent";
import { DefaultSourceContent } from "./DefaultSourceContent";

interface SourceContentRouterProps {
  sourceName: string;
  data: InteractionSource[];
  medications: string[];
  clinicianView?: boolean;
}

export function SourceContentRouter({ 
  sourceName, 
  data, 
  medications,
  clinicianView = false
}: SourceContentRouterProps) {
  // Enhance data with source availability flags when routing to AILiteratureSourceContent
  if (sourceName === "AI Literature Analysis") {
    // For the AI Literature Analysis, we want to pass information about other available sources
    // to improve the user experience when AI analysis is not available
    data.forEach(item => {
      if (item.rawData && !item.rawData.otherSourcesInfo) {
        // Add information about other sources to help with fallback display
        item.rawData.otherSourcesInfo = {
          hasRxnormData: sourceName === "RxNorm" && data.length > 0,
          hasFdaData: sourceName === "FDA" && data.length > 0,
          hasSuppaiData: sourceName === "SUPP.AI" && data.length > 0
        };
      }
    });
  }

  // Route to the appropriate source content component based on the source name
  switch (sourceName) {
    case "FDA":
      return <FDASourceContent data={data} medications={medications} sourceName={sourceName} clinicianView={clinicianView} />;
      
    case "RxNorm":
      return <RxNormSourceContent data={data} medications={medications} clinicianView={clinicianView} />;
      
    case "SUPP.AI":
      return <SuppAISourceContent data={data} medications={medications} clinicianView={clinicianView} />;
    
    case "OpenFDA Adverse Events":
      return <AdverseEventsSourceContent data={data} sourceName={sourceName} clinicianView={clinicianView} />;
      
    case "AI Literature Analysis":
      return <AILiteratureSourceContent data={data} medications={medications} clinicianView={clinicianView} />;
      
    default:
      return <DefaultSourceContent data={data} sourceName={sourceName} clinicianView={clinicianView} />;
  }
}
