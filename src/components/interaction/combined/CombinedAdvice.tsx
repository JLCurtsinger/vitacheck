
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";

interface CombinedAdviceProps {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  medications: string[];
}

export function CombinedAdvice({ severity, medications }: CombinedAdviceProps) {
  // Get appropriate styling and content based on severity
  const getAdviceContent = () => {
    switch (severity) {
      case "severe":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
          title: "Medical Advice Required",
          content: `Do not take ${medications.join(", ")} together without explicit approval from your healthcare provider. This combination has significant risks that should be carefully evaluated.`,
          class: "bg-red-50 border-red-200"
        };
      case "moderate":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
          title: "Caution Advised",
          content: `The combination of ${medications.join(", ")} may cause side effects or reduced effectiveness. Consult with a healthcare provider and monitor for any adverse reactions.`,
          class: "bg-yellow-50 border-yellow-300"
        };
      case "minor":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
          title: "Minor Concerns",
          content: `When taking ${medications.join(", ")} together, be aware of potential minor interactions. Monitor for any unexpected symptoms and report them to your healthcare provider.`,
          class: "bg-yellow-50/70 border-yellow-200"
        };
      case "safe":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          title: "No Known Interactions",
          content: `Based on available data, the combination of ${medications.join(", ")} appears to be safe. However, individual responses may vary.`,
          class: "bg-green-50 border-green-200"
        };
      default:
        return {
          icon: <HelpCircle className="h-5 w-5 text-gray-600" />,
          title: "Insufficient Data",
          content: `There is limited information about combining ${medications.join(", ")}. Consult with a healthcare provider before use.`,
          class: "bg-gray-50 border-gray-200"
        };
    }
  };
  
  const advice = getAdviceContent();

  return (
    <div className={cn("p-4 rounded-lg border", advice.class)}>
      <h3 className="flex items-center gap-2 font-semibold mb-2">
        {advice.icon}
        {advice.title}
      </h3>
      <p>{advice.content}</p>
      
      <div className="mt-3 text-xs">
        <p className="font-medium">Remember:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>This information is not a substitute for professional medical advice.</li>
          <li>Always inform your healthcare providers about all medications and supplements you are taking.</li>
        </ul>
      </div>
    </div>
  );
}
