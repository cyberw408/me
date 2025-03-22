/**
 * Utility functions for accessibility
 */

/**
 * Generate a unique ID for ARIA attributes
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 */
export const generateAriaId = (prefix: string = 'aria'): string => {
  return `${prefix}-${Math.floor(Math.random() * 10000)}-${Date.now()}`;
};

/**
 * Format a date for screen readers
 * Converts date objects or strings to an accessible format
 * @param date - Date object or date string
 * @returns Formatted date string accessible for screen readers
 */
export const formatDateForScreenReader = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return dateObj.toLocaleDateString(undefined, options);
};

/**
 * Format a duration in seconds to an accessible string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export const formatDurationForScreenReader = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    let result = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    if (remainingSeconds > 0) {
      result += ` and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    }
    return result;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  let result = `${hours} hour${hours !== 1 ? 's' : ''}`;
  if (remainingMinutes > 0) {
    result += ` and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }
  
  return result;
};

/**
 * Determine the appropriate ARIA role for a specific component type
 * @param componentType - Type of component
 * @returns Appropriate ARIA role
 */
export const getAriaRoleForComponent = (componentType: string): string => {
  const roles: Record<string, string> = {
    'dialog': 'dialog',
    'alert': 'alert',
    'banner': 'banner',
    'button': 'button',
    'checkbox': 'checkbox',
    'grid': 'grid',
    'heading': 'heading',
    'link': 'link',
    'list': 'list',
    'listitem': 'listitem',
    'menu': 'menu',
    'menuitem': 'menuitem',
    'navigation': 'navigation',
    'progressbar': 'progressbar',
    'radio': 'radio',
    'search': 'search',
    'status': 'status',
    'tab': 'tab',
    'tabpanel': 'tabpanel',
    'timer': 'timer',
    'tooltip': 'tooltip',
    'treeitem': 'treeitem',
    'switch': 'switch',
    'table': 'table',
    'textbox': 'textbox',
    'searchbox': 'searchbox'
  };
  
  return roles[componentType.toLowerCase()] || '';
};

/**
 * Create an accessible description for charts
 * @param chartType - Type of chart (pie, line, bar, etc.)
 * @param title - Chart title
 * @param description - Optional description about the chart's data
 * @returns Accessible chart description
 */
export const createChartScreenReaderText = (
  chartType: string,
  title: string,
  description?: string
): string => {
  let text = `${chartType} chart titled "${title}"`;
  
  if (description) {
    text += `. ${description}`;
  }
  
  return text;
};

/**
 * Generate ARIA attributes for sortable table headers
 * @param isSorted - Whether the column is currently sorted
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns Object with ARIA attributes
 */
export const getSortableColumnAriaProps = (
  isSorted: boolean,
  direction: 'asc' | 'desc'
): Record<string, string> => {
  if (!isSorted) {
    return {
      'aria-sort': 'none',
      'aria-label': 'Click to sort'
    };
  }
  
  const sortDirection = direction === 'asc' ? 'ascending' : 'descending';
  
  return {
    'aria-sort': sortDirection,
    'aria-label': `Sorted ${sortDirection}. Click to ${direction === 'asc' ? 'reverse' : 'remove'} sort`
  };
};

/**
 * Convert any value to a screen reader friendly string
 * @param value - Value to convert
 * @returns String appropriate for screen readers
 */
export const valueToScreenReaderText = (value: any): string => {
  if (value === null || value === undefined) {
    return 'Not available';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (value instanceof Date) {
    return formatDateForScreenReader(value);
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'Empty list';
    }
    return `List with ${value.length} items`;
  }
  
  if (typeof value === 'object') {
    return 'Complex data';
  }
  
  return String(value);
};