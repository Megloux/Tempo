// Helper utility functions for the TEMPO app

/**
 * Convert time string (e.g., "5:30 AM") to minutes since midnight
 * @param {string} timeString - Time in format "5:30 AM"
 * @returns {number} Minutes since midnight
 */
export const convertTimeToMinutes = (timeString) => {
  const [time, period] = timeString.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
};

/**
 * Check if a time is within a range
 * @param {string} time - Time to check
 * @param {string} startTime - Start of range
 * @param {string} endTime - End of range
 * @returns {boolean} Whether time is in range
 */
export const isTimeInRange = (time, startTime, endTime) => {
  const timeMinutes = convertTimeToMinutes(time);
  const startMinutes = convertTimeToMinutes(startTime);
  const endMinutes = convertTimeToMinutes(endTime);
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
};

/**
 * Efficiently clone a nested object without using JSON.parse/stringify
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};

/**
 * Validate instructor data to ensure consistency
 * @param {Object} instructor - Instructor data to validate
 * @returns {Object} Validated instructor data
 */
export const validateInstructorData = (instructor) => {
  // Create a new object to avoid mutating the original
  const validated = { ...instructor };
  
  // Ensure all required fields exist
  if (!validated.availability) validated.availability = [];
  if (!validated.classTypePreferences) validated.classTypePreferences = {};
  if (!validated.classTypes) validated.classTypes = [];
  if (!validated.blockSize) validated.blockSize = 2;
  if (!validated.minClasses) validated.minClasses = 2;
  if (!validated.maxClasses) validated.maxClasses = 10;
  
  // Validate that class type preferences only include classes the instructor can teach
  Object.entries(validated.classTypePreferences).forEach(([slot, type]) => {
    if (!validated.classTypes.includes(type)) {
      validated.classTypePreferences[slot] = validated.classTypes[0] || '';
    }
  });
  
  return validated;
};

/**
 * Detect scheduling conflicts for an instructor
 * @param {Object} schedule - Current schedule
 * @param {string} instructorId - Instructor ID to check
 * @param {string} day - Day to check
 * @param {string} time - Time to check
 * @param {Array} classTypes - All class types
 * @returns {boolean} Whether there's a conflict
 */
export const hasSchedulingConflict = (schedule, instructorId, day, time, classTypes) => {
  for (const type of classTypes) {
    if (schedule[day]?.[type]?.[time] === instructorId) {
      return true;
    }
  }
  return false;
};

/**
 * Format a date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

/**
 * Debounce a function to limit how often it's called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
