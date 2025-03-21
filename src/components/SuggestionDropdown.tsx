
import React, { useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { MedicationSuggestion } from "@/services/medication-suggestions";

interface SuggestionDropdownProps {
  suggestions: MedicationSuggestion[];
  recentSearches: string[];
  showRecents: boolean;
  focusedIndex: number;
  onSelectSuggestion: (value: string) => void;
  visible: boolean;
}

export function SuggestionDropdown({
  suggestions,
  recentSearches,
  showRecents,
  focusedIndex,
  onSelectSuggestion,
  visible
}: SuggestionDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        // We don't close the dropdown here because we need the parent component
        // to be aware of the state change for the input focus handling
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!visible) return null;

  return (
    <div 
      ref={dropdownRef}
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
            <div className="text-xs text-gray-500">Source: {suggestion.source}</div>
          </div>
        ))
      ) : (
        <div className="p-3 text-center text-gray-500">No results found</div>
      )}
    </div>
  );
}
