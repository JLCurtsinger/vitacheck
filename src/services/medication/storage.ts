
/**
 * Save query to local storage history
 */
export function saveToRecentSearches(query: string): void {
  try {
    if (!query || query.trim().length < 2) return;
    
    const recentSearches = getRecentSearches();
    
    // Add to front of array and deduplicate
    const updatedSearches = [
      query,
      ...recentSearches.filter(item => item.toLowerCase() !== query.toLowerCase())
    ].slice(0, 10); // Keep only the most recent 10
    
    localStorage.setItem('vitacheck_recent_searches', JSON.stringify(updatedSearches));
  } catch (error) {
    console.error('Error saving to recent searches:', error);
  }
}

/**
 * Get recent searches from local storage
 */
export function getRecentSearches(): string[] {
  try {
    const storedSearches = localStorage.getItem('vitacheck_recent_searches');
    return storedSearches ? JSON.parse(storedSearches) : [];
  } catch (error) {
    console.error('Error retrieving recent searches:', error);
    return [];
  }
}
