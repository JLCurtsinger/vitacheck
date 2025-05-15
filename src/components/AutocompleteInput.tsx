
import React, { useState, KeyboardEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X, ArrowRight } from "lucide-react";
import { useSuggestions } from "@/hooks/use-suggestions";
import { SuggestionDropdown } from "./SuggestionDropdown";
import { useIsMobile } from "@/hooks/use-mobile";

interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSelectSuggestion: (value: string) => void;
  showRecent?: boolean;
  onQuickAdd?: () => void; // New prop for handling quick add functionality
}

export default function AutocompleteInput({
  value,
  onChange,
  onSelectSuggestion,
  placeholder,
  className,
  showRecent = false,
  onQuickAdd,
  ...props
}: AutocompleteInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const isMobile = useIsMobile();
  const [inputValue, setInputValue] = useState<string | undefined>(value?.toString());
  
  // Update local state when value prop changes
  useEffect(() => {
    setInputValue(value?.toString());
  }, [value]);
  
  // Use our custom hook for suggestions
  const {
    suggestions,
    loading,
    recentSearches,
    showRecents,
    showDropdown,
    handleFocus: onFocusHandler,
    closeDropdown,
    handleSelection,
    dropdownRef,
    inputRef
  } = useSuggestions(value as string, showRecent);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Call the parent onChange handler
    if (onChange) {
      onChange(e);
    }
  };
  
  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    // Call handleSelection to prevent dropdown from reopening
    handleSelection();
    setFocusedIndex(-1);
    
    // Return focus to input after selection
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Quick add functionality - add current value and trigger onQuickAdd callback
  const handleQuickAdd = () => {
    if (inputValue && inputValue.trim() !== "") {
      handleSelectSuggestion(inputValue);
      if (onQuickAdd) {
        onQuickAdd();
      }
    }
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const items = showRecents ? recentSearches : suggestions.map(s => s.name);
    
    // Tab key handling for desktop/tablet only
    if (e.key === "Tab" && !isMobile && inputValue && inputValue.trim() !== "") {
      // Only if there's text in the input and we're not on mobile
      if (onQuickAdd) {
        e.preventDefault(); // Prevent default tab behavior
        handleSelectSuggestion(inputValue);
        onQuickAdd();
        return;
      }
    }
    
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
      closeDropdown();
      setFocusedIndex(-1);
    }
  };
  
  // Clear input
  const handleClearInput = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      setInputValue('');
      
      // Create a synthetic event
      const event = {
        target: inputRef.current
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (onChange) {
        onChange(event);
      }
      
      closeDropdown();
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
          onFocus={onFocusHandler}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Enter medication or supplement name"}
          className={`pl-10 ${inputValue ? 'pr-20' : 'pr-10'} h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white rounded-md ${className || ""}`}
          {...props}
        />
        {/* Button controls - positioned absolutely within input */}
        <div className="absolute right-3 flex items-center space-x-1">
          {inputValue && inputValue.length > 0 && (
            <>
              {/* Clear button */}
              <button 
                type="button" 
                onClick={handleClearInput}
                className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear input"
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* Quick add button - desktop/tablet only */}
              {!isMobile && onQuickAdd && (
                <button 
                  type="button" 
                  onClick={handleQuickAdd}
                  className="h-5 w-5 text-blue-500 hover:text-blue-700 transition-colors ml-2"
                  aria-label="Quick add"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </>
          )}
          
          {loading && (
            <div className="h-5 w-5 text-blue-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
      </div>
      
      {/* Dropdown for suggestions */}
      <SuggestionDropdown
        suggestions={suggestions}
        recentSearches={recentSearches}
        showRecents={showRecents}
        focusedIndex={focusedIndex}
        onSelectSuggestion={handleSelectSuggestion}
        visible={showDropdown}
        ref={dropdownRef}
      />
    </div>
  );
}
