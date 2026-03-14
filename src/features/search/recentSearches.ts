import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = 'stremiox_recent_searches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Get recent searches from AsyncStorage
 */
export async function getRecentSearches(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to get recent searches:', error);
  }
  return [];
}

/**
 * Add a search term to recent searches
 * Moves existing term to top if already present
 * Limits to MAX_RECENT_SEARCHES items
 */
export async function addRecentSearch(term: string): Promise<void> {
  try {
    const recent = await getRecentSearches();
    
    // Remove if already exists (to move to top)
    const filtered = recent.filter((t) => t !== term);
    
    // Add to top
    filtered.unshift(term);
    
    // Limit to max
    const limited = filtered.slice(0, MAX_RECENT_SEARCHES);
    
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Failed to add recent search:', error);
  }
}

/**
 * Remove a specific search term from recent searches
 */
export async function removeRecentSearch(term: string): Promise<void> {
  try {
    const recent = await getRecentSearches();
    const filtered = recent.filter((t) => t !== term);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove recent search:', error);
  }
}

/**
 * Clear all recent searches
 */
export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error('Failed to clear recent searches:', error);
  }
} 
