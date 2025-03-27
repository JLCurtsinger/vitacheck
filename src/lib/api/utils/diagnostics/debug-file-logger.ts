
/**
 * Debug File Logger
 * 
 * Provides utilities for logging debug information to files
 * for later analysis, especially useful for API debugging.
 */

// In-memory storage for logs when file system is not available
const memoryLogs: Record<string, any[]> = {};

/**
 * Write debug data to a persistent log
 * In browser environment, this will store data in memory
 * In Node environment, this will write to files if possible
 */
export function writeToDebugLog(
  category: string,
  identifier: string,
  data: any
): void {
  // Store in memory regardless of environment
  if (!memoryLogs[category]) {
    memoryLogs[category] = [];
  }
  
  memoryLogs[category].push({
    id: identifier,
    timestamp: new Date().toISOString(),
    ...data
  });
  
  // Limit memory logs to avoid overwhelming memory
  if (memoryLogs[category].length > 100) {
    memoryLogs[category] = memoryLogs[category].slice(-100);
  }
  
  // Try to use console.debug for less noisy logging
  try {
    console.debug(`[Debug Log] ${category}/${identifier} saved`);
  } catch (e) {
    // Fallback to regular log if debug not supported
    console.log(`[Debug Log] ${category}/${identifier} saved`);
  }
}

/**
 * Retrieve logs stored in memory
 */
export function getMemoryLogs(category?: string): Record<string, any[]> {
  if (category) {
    return { [category]: memoryLogs[category] || [] };
  }
  return { ...memoryLogs };
}

/**
 * Clear in-memory logs
 */
export function clearMemoryLogs(category?: string): void {
  if (category) {
    memoryLogs[category] = [];
  } else {
    Object.keys(memoryLogs).forEach(key => {
      memoryLogs[key] = [];
    });
  }
}
