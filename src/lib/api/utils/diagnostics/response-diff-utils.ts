
/**
 * Response Diff Utilities
 * 
 * Tools for comparing API responses to detect changes
 * between versions or identify issues.
 */

interface DiffResult {
  added: string[];
  removed: string[];
  changed: Array<{path: string, oldValue: any, newValue: any}>;
  structuralChanges: string[];
}

/**
 * Compare two API responses and identify differences
 */
export function diffResponses(
  oldResponse: any, 
  newResponse: any
): DiffResult {
  const result: DiffResult = {
    added: [],
    removed: [],
    changed: [],
    structuralChanges: []
  };
  
  compareObjects(oldResponse, newResponse, '', result);
  
  return result;
}

/**
 * Helper function to recursively compare objects
 */
function compareObjects(
  oldObj: any, 
  newObj: any, 
  path: string, 
  result: DiffResult
): void {
  // Handle null/undefined cases
  if (!oldObj && !newObj) return;
  
  if (!oldObj) {
    result.added.push(path || 'root');
    return;
  }
  
  if (!newObj) {
    result.removed.push(path || 'root');
    return;
  }
  
  // Different types
  if (typeof oldObj !== typeof newObj) {
    result.structuralChanges.push(
      `${path || 'root'} changed type from ${typeof oldObj} to ${typeof newObj}`
    );
    return;
  }
  
  // Array comparison
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    if (oldObj.length !== newObj.length) {
      result.structuralChanges.push(
        `${path || 'root'} array length changed from ${oldObj.length} to ${newObj.length}`
      );
    }
    
    // Compare array elements (limited to avoid excessive processing)
    const maxCompare = Math.min(oldObj.length, newObj.length, 10);
    for (let i = 0; i < maxCompare; i++) {
      compareObjects(oldObj[i], newObj[i], `${path}[${i}]`, result);
    }
    return;
  }
  
  // Object comparison
  if (typeof oldObj === 'object' && typeof newObj === 'object') {
    // Find removed and changed properties
    for (const key of Object.keys(oldObj)) {
      const newPath = path ? `${path}.${key}` : key;
      
      if (!(key in newObj)) {
        result.removed.push(newPath);
      } else {
        compareObjects(oldObj[key], newObj[key], newPath, result);
      }
    }
    
    // Find added properties
    for (const key of Object.keys(newObj)) {
      const newPath = path ? `${path}.${key}` : key;
      
      if (!(key in oldObj)) {
        result.added.push(newPath);
      }
    }
    return;
  }
  
  // Value comparison for primitives
  if (oldObj !== newObj) {
    result.changed.push({
      path: path || 'root',
      oldValue: oldObj,
      newValue: newObj
    });
  }
}

/**
 * Format diff result into a readable summary
 */
export function formatDiffSummary(diff: DiffResult): string {
  const parts: string[] = ['API Response Differences:'];
  
  if (diff.structuralChanges.length > 0) {
    parts.push('Structural Changes:');
    diff.structuralChanges.forEach(change => {
      parts.push(`  - ${change}`);
    });
  }
  
  if (diff.added.length > 0) {
    parts.push('Added Fields:');
    diff.added.forEach(field => {
      parts.push(`  + ${field}`);
    });
  }
  
  if (diff.removed.length > 0) {
    parts.push('Removed Fields:');
    diff.removed.forEach(field => {
      parts.push(`  - ${field}`);
    });
  }
  
  if (diff.changed.length > 0) {
    parts.push('Changed Values:');
    diff.changed.forEach(({path, oldValue, newValue}) => {
      const oldStr = typeof oldValue === 'object' ? 'complex object' : String(oldValue);
      const newStr = typeof newValue === 'object' ? 'complex object' : String(newValue);
      parts.push(`  ~ ${path}: ${oldStr} → ${newStr}`);
    });
  }
  
  return parts.join('\n');
}
