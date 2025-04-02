
import { InteractionSource } from "@/lib/api/types";
import { FDASourceContent } from "./FDASourceContent";
import { RxNormSourceContent } from "./RxNormSourceContent";
import { SuppAISourceContent } from "./SuppAISourceContent";
import { AdverseEventsSourceContent } from "./AdverseEventsSourceContent";
import { AILiteratureSourceContent } from "./AILiteratureSourceContent";
import { GenericSourceContent } from "./GenericSourceContent";

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
  // Route to the appropriate source content component based on the source name
  switch (sourceName) {
    case "FDA":
      return <FDASourceContent data={data} sourceName={sourceName} clinicianView={clinicianView} />;
      
    case "RxNorm":
      return <RxNormSourceContent data={data} sourceName={sourceName} clinicianView={clinicianView} />;
      
    case "SUPP.AI":
      return <SuppAISourceContent data={data} sourceName={sourceName} clinicianView={clinicianView} />;
    
    case "OpenFDA Adverse Events":
      return <AdverseEventsSourceContent data={data} sourceName={sourceName} clinicianView={clinicianView} />;
      
    case "AI Literature Analysis":
      return <AILiteratureSourceContent data={data} sourceName={sourceName} medications={medications} clinicianView={clinicianView} />;
      
    default:
      return <GenericSourceContent data={data} sourceName={sourceName} clinicianView={clinicianView} />;
  }
}
