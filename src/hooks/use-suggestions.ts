
import { useState, useEffect } from "react";
import { 
  MedicationSuggestion, 
  getMedicationSuggestions, 
  debounce, 
  getRecentSearches 
} from "@/services/medication-suggestions";

export function useSuggestions(inputValue: string, showRecent: boolean = false) {
  const [suggestions, setSuggestions] = useState<MedicationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecents, setShowRecents] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load recent searches
  useEffect(() => {
    if (showRecent) {
      const recentItems = getRecentSearches();
      setRecentSearches(recentItems);
    }
  }, [showRecent]);
  
  // Fetch suggestions when input changes
  const fetchSuggestions = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      
      // Show recent searches if no query
      if (showRecent && recentSearches.length > 0) {
        setShowRecents(true);
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
      return;
    }
    
    setLoading(true);
    
    try {
      const results = await getMedicationSuggestions(query);
      setSuggestions(results);
      setShowDropdown(true);
      
      // Hide recents when we have actual suggestions
      if (results.length > 0) {
        setShowRecents(false);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Debounce API calls to prevent excessive requests
  const debouncedFetchSuggestions = debounce(fetchSuggestions, 300);
  
  // Handle input change effect
  useEffect(() => {
    if (inputValue?.trim().length < 2) {
      setSuggestions([]);
      if (!showRecent || recentSearches.length === 0) {
        setShowDropdown(false);
      }
      return;
    }
    
    debouncedFetchSuggestions(inputValue);
  }, [inputValue]);

  const handleFocus = () => {
    // Show recent searches on focus if applicable
    if (showRecent && recentSearches.length > 0 && (!inputValue || inputValue.trim().length < 2)) {
      setShowRecents(true);
      setShowDropdown(true);
    }
  };

  const closeDropdown = () => {
    setShowDropdown(false);
    setShowRecents(false);
  };

  // Add a new function to handle selection
  const handleSelection = () => {
    setShowDropdown(false);
    setShowRecents(false);
  };

  return {
    suggestions,
    loading,
    recentSearches,
    showRecents,
    showDropdown,
    setShowDropdown,
    handleFocus,
    closeDropdown,
    handleSelection
  };
}
