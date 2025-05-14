import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { deepClone, validateInstructorData, hasSchedulingConflict, debounce } from '../utils/helpers';

// Create context
const ClassScheduleContext = createContext();

// Class types and days of week constants
const CLASS_TYPES = ['Lagree', 'Strength', 'Boxing', 'Stretch', 'PT'];
const DAYS_OF_WEEK = ['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CLASS_TIMES = [
  '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', 
  '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM',
  '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'
];

// Initial instructor data
const INITIAL_INSTRUCTORS = [
  { id: 'DB', name: 'Dayron', email: 'dayron@example.com', phone: '555-123-4567', classTypes: ['Lagree', 'Strength', 'Boxing', 'PT'], blockSize: 4, minClasses: 15, maxClasses: 20, availability: {}, unavailability: {} },
  { id: 'MH', name: 'Michelle', email: 'michelle@example.com', phone: '555-234-5678', classTypes: ['Lagree', 'Strength'], blockSize: 4, minClasses: 15, maxClasses: 20, availability: {}, unavailability: {} },
  { id: 'AK', name: 'Allison', email: '', phone: '', classTypes: ['Stretch', 'Lagree'], blockSize: 2, minClasses: 2, maxClasses: 10, availability: {}, unavailability: {} },
  { id: 'AD', name: 'Aseel', email: '', phone: '', classTypes: ['Lagree'], blockSize: 1, minClasses: 1, maxClasses: 6, availability: {}, unavailability: {} },
  { id: 'TS', name: 'Taylor', email: '', phone: '', classTypes: ['Lagree'], blockSize: 2, minClasses: 4, maxClasses: 8, availability: {}, unavailability: {} },
  { id: 'MB', name: 'Megan', email: '', phone: '', classTypes: ['Lagree'], blockSize: 2, minClasses: 3, maxClasses: 8, availability: {}, unavailability: {} },
  { id: 'EF', name: 'Erin', email: '', phone: '', classTypes: ['Lagree'], blockSize: 2, minClasses: 4, maxClasses: 10, availability: {}, unavailability: {} },
  { id: 'SS', name: 'Sandhya', email: '', phone: '', classTypes: ['Lagree'], blockSize: 2, minClasses: 5, maxClasses: 15, availability: {}, unavailability: {} },
  { id: 'JD', name: 'Jess', email: '', phone: '', classTypes: ['Strength'], blockSize: 2, minClasses: 5, maxClasses: 15, availability: {}, unavailability: {} }
];

// Provider component
export const ClassScheduleProvider = ({ children }) => {
  // State for instructors
  const [instructors, setInstructors] = useState(INITIAL_INSTRUCTORS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for schedule
  const [schedule, setSchedule] = useState(initializeEmptySchedule());
  
  // State for locked assignments that shouldn't change during schedule generation
  const [lockedAssignments, setLockedAssignments] = useState({});

  // Fetch data from Supabase on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch all data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      // Clear any previous errors
      setError(null);
      
      // Fetch instructors
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('instructors')
        .select('*');
      
      if (instructorsError) throw instructorsError;
      
      // Fetch schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*')
        .single();
      
      // Fetch locked assignments
      const { data: locksData, error: locksError } = await supabase
        .from('locked_assignments')
        .select('*')
        .single();
      
      // Update state with fetched data or use defaults
      setInstructors(instructorsData?.length > 0 ? instructorsData : INITIAL_INSTRUCTORS);
      setSchedule(scheduleData || initializeEmptySchedule());
      setLockedAssignments(locksData?.assignments || {});
      
      // Ensure error state is cleared after successful data fetch
      setError(null);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Fall back to local storage if Supabase fetch fails
      const savedInstructors = localStorage.getItem('instructors');
      const savedSchedule = localStorage.getItem('schedule');
      const savedLocks = localStorage.getItem('lockedAssignments');
      
      if (savedInstructors) {
        try {
          setInstructors(JSON.parse(savedInstructors));
          // If we have local data, don't show an error
          setError(null);
        } catch (e) {
          console.error('Error parsing saved instructors:', e);
          setInstructors(INITIAL_INSTRUCTORS);
          setError('Failed to load instructor data. Using default data.');
        }
      }
      
      if (savedSchedule) {
        try {
          setSchedule(JSON.parse(savedSchedule));
        } catch (e) {
          console.error('Error parsing saved schedule:', e);
          setSchedule(initializeEmptySchedule());
        }
      }
      
      if (savedLocks) {
        try {
          setLockedAssignments(JSON.parse(savedLocks));
        } catch (e) {
          console.error('Error parsing saved locks:', e);
          setLockedAssignments({});
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Save to Supabase and localStorage whenever state changes (debounced)
  const debouncedSaveInstructors = debounce(async () => {
    try {
      // First save to localStorage as backup
      localStorage.setItem('instructors', JSON.stringify(instructors));
      
      // Validate all instructors before saving
      const validatedInstructors = instructors.map(instructor => validateInstructorData(instructor));
      
      // Save to Supabase
      const { error } = await supabase.from('instructors').upsert(
        validatedInstructors,
        { onConflict: 'id' }
      );
      
      if (error) {
        console.error('Supabase error saving instructors:', error);
        // Don't throw error, just log it and continue
        // We already saved to localStorage as backup
        console.warn('Using localStorage backup for instructors');
      }
      
      // Clear any previous errors if save was successful
      setError(null);
    } catch (error) {
      console.error('Error saving instructors:', error);
      // Don't set error state here, as it will cause the error UI to show
      // Instead, just log the error and continue using the localStorage backup
      console.warn('Using localStorage backup for instructors');
    }
  }, 1000); // 1 second debounce
  
  useEffect(() => {
    if (!loading) {
      debouncedSaveInstructors();
    }
  }, [instructors, loading]);
  
  useEffect(() => {
    if (!loading) {
      debouncedSaveSchedule();
    }
  }, [schedule, loading]);
  
  useEffect(() => {
    if (!loading) {
      // Save to localStorage as backup
      localStorage.setItem('lockedAssignments', JSON.stringify(lockedAssignments));
      
      // Save to Supabase
      const saveLocks = async () => {
        try {
          // Check if locks record exists
          const { data, error: fetchError } = await supabase
            .from('locked_assignments')
            .select('id')
            .single();
          
          if (fetchError && fetchError.code !== 'PGRST116') {
            // Error other than 'no rows returned'
            throw fetchError;
          }
          
          if (data) {
            // Update existing record
            const { error } = await supabase
              .from('locked_assignments')
              .update({ assignments: lockedAssignments })
              .eq('id', data.id);
            if (error) throw error;
          } else {
            // Insert new record
            const { error } = await supabase
              .from('locked_assignments')
              .insert({ assignments: lockedAssignments });
            if (error) throw error;
          }
        } catch (error) {
          console.error('Error saving locked assignments:', error);
        }
      };
      
      saveLocks();
    }
  }, [lockedAssignments, loading]);

  // Initialize empty schedule
  function initializeEmptySchedule() {
    const emptySchedule = {};
    DAYS_OF_WEEK.forEach(day => {
      emptySchedule[day] = {};
      CLASS_TYPES.forEach(type => {
        emptySchedule[day][type] = {};
        CLASS_TIMES.forEach(time => {
          emptySchedule[day][type][time] = null;
        });
      });
    });
    return emptySchedule;
  }
  
  // Debounced save schedule function
  const debouncedSaveSchedule = debounce(async () => {
    try {
      // Save to localStorage as backup
      localStorage.setItem('schedule', JSON.stringify(schedule));
      
      // Check if schedule record exists
      const { data, error: fetchError } = await supabase
        .from('schedule')
        .select('id')
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (data) {
        // Update existing record
        const { error } = await supabase
          .from('schedule')
          .update({ data: schedule })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('schedule')
          .insert({ data: schedule });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      setError('Failed to save schedule data. Changes may not persist if you refresh the page.');
    }
  }, 1000); // 1 second debounce

  // Add predefined classes to the schedule
  function addPredefinedClasses() {
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    
    // Sunday Classes
    ['9:00 AM', '10:00 AM', '11:00 AM'].forEach(time => {
      newSchedule['Sun']['Lagree'][time] = 'TBD';
    });
    ['12:00 PM', '1:00 PM'].forEach(time => {
      newSchedule['Sun']['Stretch'][time] = 'TBD';
    });
    
    // Monday and Wednesday Classes (same schedule)
    ['Mon', 'Wed'].forEach(day => {
      ['5:30 AM', '6:30 AM', '7:30 AM', '8:30 AM', '9:30 AM', '10:30 AM', '12:00 PM', '1:00 PM', '5:30 PM', '6:30 PM'].forEach(time => {
        newSchedule[day]['Lagree'][time] = 'TBD';
      });
      ['7:30 AM', '12:00 PM'].forEach(time => {
        newSchedule[day]['Strength'][time] = 'TBD';
      });
      newSchedule[day]['Boxing']['6:30 AM'] = 'TBD';
    });
    
    // Tuesday and Thursday Classes (same schedule)
    ['Tues', 'Thu'].forEach(day => {
      ['5:30 AM', '6:30 AM', '7:30 AM', '8:30 AM', '9:30 AM', '10:30 AM', '12:00 PM', '1:00 PM', '4:30 PM', '5:30 PM', '6:30 PM'].forEach(time => {
        newSchedule[day]['Lagree'][time] = 'TBD';
      });
      ['6:30 AM', '12:00 PM', '5:30 PM', '6:30 PM'].forEach(time => {
        newSchedule[day]['Strength'][time] = 'TBD';
      });
    });
    
    // Friday Classes
    ['5:30 AM', '6:30 AM', '7:30 AM', '8:30 AM', '9:30 AM', '10:30 AM', '12:00 PM', '1:00 PM'].forEach(time => {
      newSchedule['Fri']['Lagree'][time] = 'TBD';
    });
    ['7:30 AM', '12:00 PM'].forEach(time => {
      newSchedule['Fri']['Strength'][time] = 'TBD';
    });
    newSchedule['Fri']['Boxing']['6:30 AM'] = 'TBD';
    newSchedule['Fri']['Stretch']['1:00 PM'] = 'TBD';
    
    // Saturday Classes
    ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM'].forEach(time => {
      newSchedule['Sat']['Lagree'][time] = 'TBD';
    });
    ['9:00 AM', '10:00 AM', '11:00 AM'].forEach(time => {
      newSchedule['Sat']['Strength'][time] = 'TBD';
    });
    newSchedule['Sat']['Boxing']['8:00 AM'] = 'TBD';
    
    setSchedule(newSchedule);
  }

  // Add class to the schedule
  function addClass(day, type, time, instructorId = 'TBD') {
    setSchedule(prevSchedule => {
      // Use efficient cloning instead of JSON.parse/stringify
      const newSchedule = deepClone(prevSchedule);
      if (!newSchedule[day]) {
        newSchedule[day] = {};
      }
      if (!newSchedule[day][type]) {
        newSchedule[day][type] = {};
      }
      
      // Check for instructor conflicts before assigning
      if (instructorId !== 'TBD') {
        const hasConflict = hasSchedulingConflict(prevSchedule, instructorId, day, time, CLASS_TYPES);
        if (hasConflict) {
          // If there's a conflict, don't update and return the previous schedule
          console.warn(`Scheduling conflict detected for ${instructorId} on ${day} at ${time}`);
          return prevSchedule;
        }
      }
      
      newSchedule[day][type][time] = instructorId;
      return newSchedule;
    });
  }
  
  // Manually assign an instructor to a class
  function manuallyAssignInstructor(day, type, time, instructorId) {
    // Check if the instructor exists
    const instructor = instructors.find(i => i.id === instructorId);
    if (!instructor && instructorId !== 'TBD') return false;
    
    // Check if the instructor can teach this class type
    if (instructorId !== 'TBD' && !instructor.classTypes.includes(type)) {
      return false;
    }
    
    // Check for scheduling conflicts
    if (instructorId !== 'TBD') {
      const hasConflict = hasSchedulingConflict(schedule, instructorId, day, time, CLASS_TYPES);
      if (hasConflict) {
        console.warn(`Scheduling conflict detected for ${instructorId} on ${day} at ${time}`);
        return false;
      }
      
      // Check if instructor is available at this time
      if (instructor.availability && instructor.availability.length > 0) {
        const isAvailable = instructor.availability.includes(`${day}-${time}`);
        if (!isAvailable) {
          console.warn(`Instructor ${instructorId} is not available on ${day} at ${time}`);
          return false;
        }
      }
    }
    
    // Update the schedule
    setSchedule(prevSchedule => {
      const newSchedule = deepClone(prevSchedule);
      if (!newSchedule[day]) newSchedule[day] = {};
      if (!newSchedule[day][type]) newSchedule[day][type] = {};
      newSchedule[day][type][time] = instructorId;
      return newSchedule;
    });
    
    // If we're assigning a specific instructor (not TBD), lock this assignment
    if (instructorId !== 'TBD') {
      lockAssignment(day, type, time);
    }
    
    return true;
  }

  // Remove class from the schedule
  function removeClass(day, type, time) {
    setSchedule(prevSchedule => {
      const newSchedule = deepClone(prevSchedule);
      if (newSchedule[day] && newSchedule[day][type]) {
        newSchedule[day][type][time] = null;
      }
      return newSchedule;
    });
    
    // Also remove any locks for this class
    unlockAssignment(day, type, time);
  }

  // Clear the schedule
  function clearSchedule() {
    setSchedule(initializeEmptySchedule());
  }

  // Lock an instructor assignment so it won't change during schedule generation
  function lockAssignment(day, type, time) {
    const instructorId = schedule[day]?.[type]?.[time];
    if (!instructorId || instructorId === 'TBD') return; // Don't lock empty or TBD assignments
    
    setLockedAssignments(prev => {
      const newLocks = {...prev};
      if (!newLocks[day]) newLocks[day] = {};
      if (!newLocks[day][type]) newLocks[day][type] = {};
      newLocks[day][type][time] = instructorId;
      return newLocks;
    });
  }
  
  // Unlock an instructor assignment
  function unlockAssignment(day, type, time) {
    setLockedAssignments(prev => {
      const newLocks = {...prev};
      if (newLocks[day]?.[type]?.[time]) {
        delete newLocks[day][type][time];
        
        // Clean up empty objects
        if (Object.keys(newLocks[day][type]).length === 0) {
          delete newLocks[day][type];
        }
        if (Object.keys(newLocks[day]).length === 0) {
          delete newLocks[day];
        }
      }
      return newLocks;
    });
  }
  
  // Check if an assignment is locked
  function isAssignmentLocked(day, type, time) {
    return Boolean(lockedAssignments[day]?.[type]?.[time]);
  }
  
  // Generate schedule automatically
  function generateSchedule() {
    // Create a deep copy of the current schedule
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    
    // Ensure all class type preferences are respected before generating
    // This is critical for fixing the Boxing classes issue
    instructors.forEach(instructor => {
      if (instructor.classTypePreferences) {
        Object.entries(instructor.classTypePreferences).forEach(([slotKey, classType]) => {
          const [day, time] = slotKey.split('-');
          
          // Skip if the instructor can't teach this class type
          if (!instructor.classTypes.includes(classType)) return;
          
          // Force assign this class type to this instructor
          if (!newSchedule[day]) newSchedule[day] = {};
          if (!newSchedule[day][classType]) newSchedule[day][classType] = {};
          newSchedule[day][classType][time] = instructor.id;
          
          // Lock this assignment to ensure it doesn't change
          lockAssignment(day, classType, time);
        });
      }
    });
    
    // Track instructor assignments
    const instructorAssignments = {};
    instructors.forEach(instructor => {
      instructorAssignments[instructor.id] = 0;
    });
    
    // Track instructor time slots to prevent double-booking
    const instructorTimeSlots = {};
    instructors.forEach(instructor => {
      instructorTimeSlots[instructor.id] = {};
      DAYS_OF_WEEK.forEach(day => {
        instructorTimeSlots[instructor.id][day] = {};
      });
    });
    
    // First pass: preserve locked assignments and existing assignments that aren't TBD
    DAYS_OF_WEEK.forEach(day => {
      CLASS_TYPES.forEach(type => {
        CLASS_TIMES.forEach(time => {
          // Check if this assignment is locked
          const lockedInstructorId = lockedAssignments[day]?.[type]?.[time];
          if (lockedInstructorId) {
            // Ensure the locked instructor is still in the system
            const instructorExists = instructors.some(i => i.id === lockedInstructorId);
            if (instructorExists) {
              // Force this assignment to use the locked instructor
              newSchedule[day][type][time] = lockedInstructorId;
              // Mark this time slot as taken for this instructor
              instructorTimeSlots[lockedInstructorId][day][time] = true;
              instructorAssignments[lockedInstructorId]++;
            }
          } else {
            // For non-locked assignments, preserve existing assignments that aren't TBD
            const instructorId = newSchedule[day]?.[type]?.[time];
            if (instructorId && instructorId !== 'TBD') {
              // Mark this time slot as taken for this instructor
              if (instructorTimeSlots[instructorId]) {
                instructorTimeSlots[instructorId][day][time] = true;
                instructorAssignments[instructorId]++;
              }
            }
          }
        });
      });
    });
    
    // Second pass: assign instructors to TBD slots
    // We'll do multiple passes to handle priority classes first
    
    // Sort class types by priority (you can adjust this order as needed)
    const classPriority = {
      'Lagree': 1,
      'Strength': 2,
      'Boxing': 3,
      'Stretch': 4,
      'PT': 5
    };
    
    // Create a list of all TBD slots
    const tbdSlots = [];
    DAYS_OF_WEEK.forEach(day => {
      CLASS_TYPES.forEach(type => {
        CLASS_TIMES.forEach(time => {
          if (newSchedule[day]?.[type]?.[time] === 'TBD') {
            tbdSlots.push({ day, type, time, priority: classPriority[type] || 99 });
          }
        });
      });
    });
    
    // Sort slots by priority
    tbdSlots.sort((a, b) => a.priority - b.priority);
    
    // Assign instructors to TBD slots in priority order
    tbdSlots.forEach(slot => {
      const { day, type, time } = slot;
      
      // Find instructors who can teach this class type
      const eligibleInstructors = instructors.filter(instructor => {
        // Check if instructor can teach this class type
        if (!instructor.classTypes.includes(type)) return false;
        
        // Check if instructor is available at this time
        if (isInstructorUnavailable(instructor, day, time)) return false;
        
        // Check if instructor is already booked at this time
        if (instructorTimeSlots[instructor.id][day][time]) return false;
        
        // Check if instructor has reached their maximum classes
        if (instructorAssignments[instructor.id] >= instructor.maxClasses) return false;
        
        return true;
      });
      
      // First, check if any instructors have an explicit preference for this class type at this time
      const instructorsWithPreference = eligibleInstructors.filter(instructor => 
        instructor.classTypePreferences && 
        instructor.classTypePreferences[`${day}-${time}`] === type
      );
      
      // If we have instructors with explicit preferences for this slot, only consider them
      const instructorsToConsider = instructorsWithPreference.length > 0 ? 
        instructorsWithPreference : eligibleInstructors;
      
      if (instructorsToConsider.length > 0) {
        // Find the best instructor based on various factors
        instructorsToConsider.sort((a, b) => {
          // Get block information for both instructors
          const aBlockInfo = getInstructorBlockInfo(a.id, day, time, type, newSchedule);
          const bBlockInfo = getInstructorBlockInfo(b.id, day, time, type, newSchedule);
          
          // Factor 0: Strong preference for instructors who specialize in this class type
          // This helps instructors like Dayron keep their Boxing and Strength assignments
          const aSpecializes = a.classTypes.length > 1 && a.classTypes.includes(type) && a.classTypes[0] !== 'Lagree';
          const bSpecializes = b.classTypes.length > 1 && b.classTypes.includes(type) && b.classTypes[0] !== 'Lagree';
          if (aSpecializes && !bSpecializes) return -1;
          if (!aSpecializes && bSpecializes) return 1;
          
          // Factor 1: For Lagree classes, prioritize instructors who are already teaching Lagree in adjacent slots
          // and haven't reached their block size
          if (type === 'Lagree') {
            // If instructor A has adjacent Lagree classes and hasn't reached block size
            const aIsInLagreeBlock = aBlockInfo.hasAdjacentClass && aBlockInfo.currentBlockSize < a.blockSize;
            // If instructor B has adjacent Lagree classes and hasn't reached block size
            const bIsInLagreeBlock = bBlockInfo.hasAdjacentClass && bBlockInfo.currentBlockSize < b.blockSize;
            
            if (aIsInLagreeBlock && !bIsInLagreeBlock) return -1;
            if (!aIsInLagreeBlock && bIsInLagreeBlock) return 1;
            
            // If both are in Lagree blocks, prefer the one with the smaller current block
            if (aIsInLagreeBlock && bIsInLagreeBlock) {
              return aBlockInfo.currentBlockSize - bBlockInfo.currentBlockSize;
            }
          }
          
          // Factor 2: Check if instructor has explicit class type preference for this slot
          const aHasPreference = a.classTypePreferences && a.classTypePreferences[`${day}-${time}`] === type;
          const bHasPreference = b.classTypePreferences && b.classTypePreferences[`${day}-${time}`] === type;
          if (aHasPreference && !bHasPreference) return -1;
          if (!aHasPreference && bHasPreference) return 1;
          
          // Factor 3: For non-Lagree classes, or if no instructor is in a Lagree block,
          // consider ratio of current assignments to minimum required
          const aRatio = instructorAssignments[a.id] / a.minClasses;
          const bRatio = instructorAssignments[b.id] / b.minClasses;
          if (Math.abs(aRatio - bRatio) > 0.1) return aRatio - bRatio;
          
          // Factor 4: General adjacency (for any class type)
          if (aBlockInfo.hasAdjacentClass && !bBlockInfo.hasAdjacentClass) return -1;
          if (!aBlockInfo.hasAdjacentClass && bBlockInfo.hasAdjacentClass) return 1;
          
          // Default: Sort by ID for consistency
          return a.id.localeCompare(b.id);
        });
        
        // Assign class to the best instructor
        const selectedInstructor = instructorsToConsider[0];
        newSchedule[day][type][time] = selectedInstructor.id;
        instructorTimeSlots[selectedInstructor.id][day][time] = true;
        instructorAssignments[selectedInstructor.id]++;
      }
    });
    
    setSchedule(newSchedule);
  }
  
  // Helper function to check if an instructor has adjacent classes and calculate block size
  function getInstructorBlockInfo(instructorId, day, time, classType, scheduleData) {
    // Get the index of the current time
    const timeIndex = CLASS_TIMES.indexOf(time);
    if (timeIndex === -1) return { hasAdjacentClass: false, currentBlockSize: 0 };
    
    // Track the current block size
    let currentBlockSize = 0;
    let hasAdjacentClass = false;
    
    // Check if this would continue an existing Lagree block
    // First, look backward to find the start of any existing block
    let blockStartIndex = timeIndex;
    for (let i = timeIndex - 1; i >= 0; i--) {
      const checkTime = CLASS_TIMES[i];
      // Only consider the same class type for block size calculation
      if (scheduleData[day]?.[classType]?.[checkTime] === instructorId) {
        blockStartIndex = i;
        hasAdjacentClass = true;
      } else {
        // Stop if we hit a different class type or no class
        break;
      }
    }
    
    // Then count forward from the block start to calculate current block size
    for (let i = blockStartIndex; i < CLASS_TIMES.length; i++) {
      const checkTime = CLASS_TIMES[i];
      if (scheduleData[day]?.[classType]?.[checkTime] === instructorId) {
        currentBlockSize++;
      } else if (i >= timeIndex) {
        // Stop counting once we pass our current slot and hit a non-matching slot
        break;
      }
    }
    
    // Also check if there are any adjacent classes of any type (for general adjacency)
    if (!hasAdjacentClass) {
      // Check the time slot before
      if (timeIndex > 0) {
        const prevTime = CLASS_TIMES[timeIndex - 1];
        for (const type of CLASS_TYPES) {
          if (scheduleData[day]?.[type]?.[prevTime] === instructorId) {
            hasAdjacentClass = true;
            break;
          }
        }
      }
      
      // Check the time slot after
      if (!hasAdjacentClass && timeIndex < CLASS_TIMES.length - 1) {
        const nextTime = CLASS_TIMES[timeIndex + 1];
        for (const type of CLASS_TYPES) {
          if (scheduleData[day]?.[type]?.[nextTime] === instructorId) {
            hasAdjacentClass = true;
            break;
          }
        }
      }
    }
    
    return { hasAdjacentClass, currentBlockSize };
  }

  // Check if instructor is unavailable for a specific day and time
  function isInstructorUnavailable(instructor, day, time) {
    // First check if we have explicit availability data
    if (Array.isArray(instructor.availability) && instructor.availability.length > 0) {
      // If we have explicit availability data, instructor is unavailable if this slot is not in their availability
      return !instructor.availability.includes(`${day}-${time}`);
    }
    
    // Fall back to the old unavailability checks if no explicit availability data exists
    if (!instructor.unavailability) return false;
    
    // Check day unavailability
    if (instructor.unavailability.days && instructor.unavailability.days.includes(day)) {
      return true;
    }
    
    // Check specific time slot unavailability
    if (instructor.unavailability.slots && instructor.unavailability.slots.includes(`${day}-${time}`)) {
      return true;
    }
    
    // Check time range unavailability
    if (instructor.unavailability.timeRanges) {
      for (const range of instructor.unavailability.timeRanges) {
        if (range.days.includes(day) && isTimeInRange(time, range.startTime, range.endTime)) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Helper to check if a time is within a range
  function isTimeInRange(time, startTime, endTime) {
    // Convert times to comparable format (minutes since midnight)
    const timeMinutes = convertTimeToMinutes(time);
    const startMinutes = convertTimeToMinutes(startTime);
    const endMinutes = convertTimeToMinutes(endTime);
    
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }

  // Convert time string (e.g., "5:30 AM") to minutes since midnight
  function convertTimeToMinutes(timeString) {
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  }

  // Add a new instructor
  function addInstructor(instructor) {
    // Validate instructor data before adding
    const validatedInstructor = validateInstructorData(instructor);
    setInstructors(prev => [...prev, validatedInstructor]);
    return validatedInstructor.id; // Return the ID for reference
  }

  // Update an existing instructor
  function updateInstructor(id, updatedData) {
    try {
      // Validate the updated data
      const validatedUpdates = validateInstructorData({ ...updatedData, id });
      
      // Save current state for history/undo
      const currentInstructors = [...instructors];
      saveToHistory('instructors', currentInstructors);
      
      setInstructors(prev => {
        const instructorIndex = prev.findIndex(instructor => instructor.id === id);
        
        // If instructor not found, return unchanged
        if (instructorIndex === -1) return prev;
        
        // Create a new array with the updated instructor
        const newInstructors = [...prev];
        newInstructors[instructorIndex] = {
          ...prev[instructorIndex],
          ...validatedUpdates
        };
        
        return newInstructors;
      });
      
      // Clear any existing errors if they match our known error message
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Error updating instructor:', err);
      return false;
    }
  }
  
  // Delete an instructor
  function deleteInstructor(id) {
    // First, remove the instructor from the instructors list
    setInstructors(prev => prev.filter(instructor => instructor.id !== id));
    
    // Then, update any classes assigned to this instructor to 'TBD'
    setSchedule(prev => {
      const newSchedule = JSON.parse(JSON.stringify(prev));
      
      // Check all schedule slots for this instructor
      DAYS_OF_WEEK.forEach(day => {
        CLASS_TYPES.forEach(type => {
          CLASS_TIMES.forEach(time => {
            if (newSchedule[day]?.[type]?.[time] === id) {
              newSchedule[day][type][time] = 'TBD';
            }
          });
        });
      });
      
      return newSchedule;
    });
  }

  // Set instructor availability
  function setInstructorAvailability(instructorId, day, time, isAvailable) {
    setInstructors(prev => 
      prev.map(instructor => {
        if (instructor.id === instructorId) {
          const updatedInstructor = { ...instructor };
          
          // Initialize unavailability object if it doesn't exist
          if (!updatedInstructor.unavailability) {
            updatedInstructor.unavailability = { slots: [] };
          }
          if (!updatedInstructor.unavailability.slots) {
            updatedInstructor.unavailability.slots = [];
          }
          
          const slotKey = `${day}-${time}`;
          
          if (isAvailable) {
            // Remove from unavailable slots if now available
            updatedInstructor.unavailability.slots = updatedInstructor.unavailability.slots.filter(
              slot => slot !== slotKey
            );
          } else {
            // Add to unavailable slots if not already there
            if (!updatedInstructor.unavailability.slots.includes(slotKey)) {
              updatedInstructor.unavailability.slots.push(slotKey);
            }
          }
          
          return updatedInstructor;
        }
        return instructor;
      })
    );
  }

  // Get total assigned classes count
  function getTotalAssignedClasses() {
    let count = 0;
    DAYS_OF_WEEK.forEach(day => {
      CLASS_TYPES.forEach(type => {
        CLASS_TIMES.forEach(time => {
          if (schedule[day]?.[type]?.[time] && schedule[day][type][time] !== 'TBD') {
            count++;
          }
        });
      });
    });
    return count;
  }

  // Get total scheduled slots count (including TBD)
  function getTotalScheduledSlots() {
    let count = 0;
    DAYS_OF_WEEK.forEach(day => {
      CLASS_TYPES.forEach(type => {
        CLASS_TIMES.forEach(time => {
          if (schedule[day]?.[type]?.[time]) {
            count++;
          }
        });
      });
    });
    return count;
  }

  // Get classes assigned to a specific instructor
  function getInstructorClasses(instructorId) {
    const classes = [];
    DAYS_OF_WEEK.forEach(day => {
      CLASS_TYPES.forEach(type => {
        CLASS_TIMES.forEach(time => {
          if (schedule[day]?.[type]?.[time] === instructorId) {
            classes.push({ day, type, time });
          }
        });
      });
    });
    return classes;
  }

  // Undo last change (implement a simple history feature)
  const [history, setHistory] = useState([]);
  
  function saveToHistory() {
    // Save current state to history
    setHistory(prev => [
      ...prev.slice(-9), // Keep only the last 10 states (including this one)
      {
        instructors: deepClone(instructors),
        schedule: deepClone(schedule),
        lockedAssignments: deepClone(lockedAssignments)
      }
    ]);
  }
  
  function undoLastChange() {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setInstructors(previousState.instructors);
      setSchedule(previousState.schedule);
      setLockedAssignments(previousState.lockedAssignments);
      setHistory(prev => prev.slice(0, -1));
      return true;
    }
    return false;
  }
  
  // Save current state to history whenever instructors or schedule changes
  useEffect(() => {
    if (!loading) {
      saveToHistory();
    }
  }, [instructors, schedule, lockedAssignments]);

  return (
    <ClassScheduleContext.Provider
      value={{
        instructors,
        schedule,
        loading,
        error,
        CLASS_TYPES,
        DAYS_OF_WEEK,
        CLASS_TIMES,
        addInstructor,
        updateInstructor,
        deleteInstructor,
        setInstructorAvailability,
        addClass,
        removeClass,
        clearSchedule,
        manuallyAssignInstructor,
        generateSchedule,
        addPredefinedClasses,
        lockAssignment,
        unlockAssignment,
        isAssignmentLocked,
        getInstructorClasses,
        getTotalAssignedClasses,
        getTotalScheduledSlots,
        undoLastChange, // Add undo functionality
        hasSchedulingConflict, // Expose conflict detection
        validateInstructorData // Expose validation function
      }}
    >
      {children}
    </ClassScheduleContext.Provider>
  );
};

// Custom hook to use the context
export const useClassSchedule = () => {
  const context = useContext(ClassScheduleContext);
  if (!context) {
    throw new Error('useClassSchedule must be used within a ClassScheduleProvider');
  }
  return context;
};
