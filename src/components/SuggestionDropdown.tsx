
import React, { forwardRef } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { MedicationSuggestion } from "@/services/medication-suggestions";

interface SuggestionDropdownProps {
  suggestions: MedicationSuggestion[];
  recentSearches: string[];
  showRecents: boolean;
  focusedIndex: number;
  onSelectSuggestion: (value: string) => void;
  visible: boolean;
}

export const SuggestionDropdown = forwardRef<HTMLDivElement, SuggestionDropdownProps>(({
  suggestions,
  recentSearches,
  showRecents,
  focusedIndex,
  onSelectSuggestion,
  visible
}, ref) => {
  console.log("SuggestionDropdown: received props", { 
    visible, 
    suggestionsCount: suggestions?.length ?? 0, 
    suggestions,
    showRecents,
    recentSearchesCount: recentSearches?.length ?? 0
  });
  
  if (!visible) return null;

  return (
    <div 
      ref={ref}
      className="absolute z-50 w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
    >
      {showRecents && recentSearches.length > 0 ? (
        <>
          <div className="p-2 text-xs text-gray-500 border-b">Recent searches</div>
          {recentSearches.map((item, index) => (
            <div
              key={`recent-${index}`}
              className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 ${focusedIndex === index ? 'bg-blue-50' : ''}`}
              onClick={() => onSelectSuggestion(item)}
            >
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <span>{item}</span>
            </div>
          ))}
        </>
      ) : suggestions.length > 0 ? (
        suggestions.map((suggestion, index) => (
          <div
            key={`suggestion-${index}-${suggestion.name}`}
            className={`p-2 cursor-pointer hover:bg-gray-100 ${focusedIndex === index ? 'bg-blue-50' : ''}`}
            onClick={() => onSelectSuggestion(suggestion.name)}
          >
            <div className="font-medium">{suggestion.name}</div>
            {suggestion.isBrand && suggestion.genericName && (
              <div className="flex items-center text-xs text-blue-600">
                <span>Contains: {suggestion.genericName}</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            )}
            <div className="text-xs text-gray-500">Source: {suggestion.source}</div>
          </div>
        ))
      ) : (
        <div className="p-3 text-center text-gray-500">No results found</div>
      )}
    </div>
  );
});

SuggestionDropdown.displayName = "SuggestionDropdown";
