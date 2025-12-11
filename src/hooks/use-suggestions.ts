
import { useState, useEffect, useRef } from "react";
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
  const selectionMadeRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load recent searches
  useEffect(() => {
    if (showRecent) {
      const recentItems = getRecentSearches();
      setRecentSearches(recentItems);
    }
  }, [showRecent]);
  
  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the click is outside both dropdown and input, close dropdown
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch suggestions when input changes
  const fetchSuggestions = async (query: string) => {
    // Don't fetch if a selection was just made
    if (selectionMadeRef.current) {
      return;
    }
    
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
      console.log("useSuggestions: suggestions from service", { count: results?.length ?? 0, results });
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
    // Don't show dropdown on focus if a selection was just made
    if (selectionMadeRef.current) {
      return;
    }
    
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

  // Improved function to handle selection with longer delay
  const handleSelection = () => {
    setShowDropdown(false);
    setShowRecents(false);
    selectionMadeRef.current = true;
    
    // Use a longer delay (500ms) to ensure the selection is processed 
    // before allowing new suggestions
    setTimeout(() => {
      selectionMadeRef.current = false;
    }, 500);
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
    handleSelection,
    dropdownRef,
    inputRef
  };
}
