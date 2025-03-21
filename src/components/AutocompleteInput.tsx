
import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Clock, X } from "lucide-react";
import { MedicationSuggestion, getMedicationSuggestions, debounce, getRecentSearches } from "@/services/medication-suggestions";

interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSelectSuggestion: (value: string) => void;
  showRecent?: boolean;
}

export default function AutocompleteInput({
  value,
  onChange,
  onSelectSuggestion,
  placeholder,
  className,
  showRecent = false,
  ...props
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<MedicationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecents, setShowRecents] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Fetch suggestions when input changes
  const fetchSuggestions = async (inputValue: string) => {
    if (!inputValue || inputValue.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const results = await getMedicationSuggestions(inputValue);
      setSuggestions(results);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Debounce API calls to prevent excessive requests
  const debouncedFetchSuggestions = debounce(fetchSuggestions, 300);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Call the parent onChange handler
    if (onChange) {
      onChange(e);
    }
    
    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    
    debouncedFetchSuggestions(inputValue);
  };
  
  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    setShowDropdown(false);
    setFocusedIndex(-1);
    
    // Return focus to input after selection
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const items = showRecents ? recentSearches : suggestions.map(s => s.name);
    
    if (!showDropdown || items.length === 0) return;
    
    // Arrow down
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
    }
    // Arrow up
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
    }
    // Enter
    else if (e.key === "Enter" && focusedIndex >= 0 && focusedIndex < items.length) {
      e.preventDefault();
      handleSelectSuggestion(items[focusedIndex]);
    }
    // Escape
    else if (e.key === "Escape") {
      e.preventDefault();
      setShowDropdown(false);
      setFocusedIndex(-1);
    }
  };
  
  // Handle input focus
  const handleFocus = () => {
    if (showRecent) {
      setRecentSearches(getRecentSearches());
      if (getRecentSearches().length > 0) {
        setShowRecents(true);
        setShowDropdown(true);
      }
    }
  };
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setFocusedIndex(-1);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Clear input
  const handleClearInput = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      
      // Create a synthetic event
      const event = {
        target: inputRef.current
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (onChange) {
        onChange(event);
      }
      
      setShowDropdown(false);
      setSuggestions([]);
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Enter medication or supplement name"}
          className={`pl-10 pr-10 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white rounded-md ${className || ""}`}
          {...props}
        />
        {value && value.toString().length > 0 && (
          <button 
            type="button" 
            onClick={handleClearInput}
            className="absolute right-3 h-5 w-5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {loading && (
          <div className="absolute right-3 h-5 w-5 text-blue-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>
      
      {/* Dropdown for suggestions */}
      {showDropdown && (
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
                  onClick={() => handleSelectSuggestion(item)}
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
                onClick={() => handleSelectSuggestion(suggestion.name)}
              >
                <div className="font-medium">{suggestion.name}</div>
                <div className="text-xs text-gray-500">Source: {suggestion.source}</div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
