// Utility functions for instructor components

/**
 * Get color for instructor checkboxes based on class type
 * @param {string} type - Class type
 * @returns {string} CSS class names for styling
 */
export const getClassTypeColor = (type) => {
  switch(type) {
    case 'Lagree':
      return 'text-green-600 border-green-600';
    case 'Boxing':
      return 'text-red-600 border-red-600';
    case 'Strength':
      return 'text-blue-600 border-blue-600';
    case 'Stretch':
      return 'text-yellow-600 border-yellow-600';
    case 'PT':
      return 'text-purple-600 border-purple-600';
    default:
      return 'text-gray-600 border-gray-600';
  }
};

/**
 * Get background color for instructor bars in charts
 * @param {string} instructorId - Instructor ID
 * @returns {string} Hex color code
 */
export const getInstructorColor = (instructorId) => {
  const id = instructorId?.toLowerCase() || '';
  switch(id) {
    case 'db':
    case 'dayron':
      return '#4B5563'; // gray-600
    case 'mh':
    case 'michelle':
      return '#F87171'; // red-400
    case 'ts':
    case 'taylor':
      return '#34D399'; // green-400
    case 'ad':
    case 'aseel':
      return '#A78BFA'; // purple-400
    case 'ak':
    case 'allison':
      return '#FBBF24'; // yellow-400
    case 'mb':
    case 'megan':
      return '#FB923C'; // orange-400
    case 'ef':
    case 'erin':
      return '#2DD4BF'; // teal-400
    case 'ss':
    case 'sandhya':
      return '#F472B6'; // pink-400
    case 'jd':
    case 'jess':
      return '#60A5FA'; // blue-400
    default:
      return '#9CA3AF'; // gray-400
  }
};

/**
 * Get color for chart bars based on class type
 * @param {string} type - Class type
 * @returns {string} Hex color code
 */
export const getChartColor = (type) => {
  switch(type) {
    case 'Lagree':
      return '#10B981'; // green-500
    case 'Strength':
      return '#3B82F6'; // blue-500
    case 'Boxing':
      return '#EF4444'; // red-500
    case 'Stretch':
      return '#F59E0B'; // amber-500
    case 'PT':
      return '#8B5CF6'; // purple-500
    default:
      return '#6B7280'; // gray-500
  }
};

/**
 * Format time for mobile display
 * @param {string} time - Time string (e.g. "5:30 AM")
 * @param {boolean} isMobile - Whether to format for mobile
 * @returns {string} Formatted time
 */
export const formatTime = (time, isMobile) => {
  if (!time) return '';
  if (!isMobile) return time;
  
  // For mobile, abbreviate times
  return time.replace(':00', '');
};

/**
 * Format day for mobile display
 * @param {string} day - Day string (e.g. "Mon")
 * @param {boolean} isMobile - Whether to format for mobile
 * @returns {string} Formatted day
 */
export const formatDay = (day, isMobile) => {
  if (!day) return '';
  if (!isMobile) return day;
  
  // For mobile, just use first letter
  return day.substring(0, 1);
};

/**
 * Format class type for mobile display
 * @param {string} type - Class type
 * @param {boolean} isMobile - Whether to format for mobile
 * @returns {string} Formatted class type
 */
export const formatClassType = (type, isMobile) => {
  if (!type) return '';
  if (!isMobile) return type;
  
  // For mobile, abbreviate class types
  return type.substring(0, 3);
};
