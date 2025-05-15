import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

/**
 * EditInstructorModal component for editing instructor details
 */
const EditInstructorModal = ({
  isOpen,
  instructor,
  classTypes,
  daysOfWeek,
  onChange,
  onSave,
  onClose
}) => {
  // Time slots selection
  // Time slots for selection
  const timeSlots = [
    "Early Morning (5:30-7:00 AM)",
    "Morning (7:00-9:00 AM)",
    "Mid-Morning (9:00-12:00)",
    "Lunch (12:00-2:00 PM)",
    "Afternoon (2:00-4:00 PM)",
    "Evening (4:00-6:00 PM)",
    "Late Evening (6:00-8:00 PM)"
  ];
  
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    blockSize: 2,
    minClasses: 1,
    maxClasses: 10,
    notes: '',
    classTypes: []
  });
  
  // State for tracking preferred days, times and unavailable days, times
  const [preferredDays, setPreferredDays] = useState([]);
  const [preferredTimes, setPreferredTimes] = useState([]);
  const [unavailableDays, setUnavailableDays] = useState([]);
  const [unavailableTimes, setUnavailableTimes] = useState([]);
  
  // Define timeRangeMap outside useEffect so it's available throughout the component
  const timeRangeMap = {
    "Early Morning (5:30-7:00 AM)": ['5:30 AM', '6:00 AM', '6:30 AM'],
    "Morning (7:00-9:00 AM)": ['7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM'],
    "Mid-Morning (9:00-12:00)": ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
    "Lunch (12:00-2:00 PM)": ['12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM'],
    "Afternoon (2:00-4:00 PM)": ['2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'],
    "Evening (4:00-6:00 PM)": ['4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'],
    "Late Evening (6:00-8:00 PM)": ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM']
  };

  // Initialize from instructor's data when modal opens
  useEffect(() => {
    if (instructor && isOpen) {
      // Initialize form data
      setFormData({
        name: instructor.name || '',
        email: instructor.email || '',
        phone: instructor.phone || '',
        blockSize: instructor.blockSize || 2,
        minClasses: instructor.minClasses || 1,
        maxClasses: instructor.maxClasses || 10,
        notes: instructor.notes || '',
        classTypes: [...(instructor.classTypes || [])]
      });
      
      // Clear all checkbox selections - start with empty arrays
      setPreferredDays([]);
      setPreferredTimes([]);
      setUnavailableDays([]);
      setUnavailableTimes([]);
      
      // NEW CODE STARTS HERE - Process availability and preferences
      if (Array.isArray(instructor.availability) && instructor.availability.length > 0) {
        // Extract days from availability slots
        const daySet = new Set();
        const timeToRangeMap = {};
        
        // Create reverse mapping from time to range
        Object.entries(timeRangeMap).forEach(([range, times]) => {
          times.forEach(time => {
            timeToRangeMap[time] = range;
          });
        });
        
        // Count time slots per day and time range
        const dayCount = {};
        const rangeCount = {};
        
        daysOfWeek.forEach(day => {
          dayCount[day] = 0;
          // Count total possible slots for this day
          let totalPossibleSlots = 0;
          instructor.classTypes.forEach(classType => {
            // Since VALID_CLASS_SLOTS might not be directly accessible, we'll use a more general approach
            // Just count the day as having slots available
            totalPossibleSlots += 1;
          });
          dayCount[`${day}_total`] = totalPossibleSlots;
        });
        
        Object.keys(timeRangeMap).forEach(range => {
          rangeCount[range] = 0;
          rangeCount[`${range}_total`] = 0;
        });
        
        // Count available slots
        instructor.availability.forEach(slot => {
          const [day, time] = slot.split('-');
          dayCount[day] = (dayCount[day] || 0) + 1;
          
          const range = timeToRangeMap[time];
          if (range) {
            rangeCount[range] = (rangeCount[range] || 0) + 1;
          }
        });
        
        // If all or most time slots for a day are available, mark the day as preferred
        daysOfWeek.forEach(day => {
          if (dayCount[day] && dayCount[`${day}_total`] && 
              dayCount[day] / dayCount[`${day}_total`] >= 0.5) {
            daySet.add(day);
          }
        });
        
        // If all or most time slots for a range are available, mark the range as preferred
        const preferredTimeRanges = [];
        Object.keys(timeRangeMap).forEach(range => {
          const times = timeRangeMap[range];
          let availableCount = 0;
          let totalCount = 0;
          
          daysOfWeek.forEach(day => {
            times.forEach(time => {
              const slotKey = `${day}-${time}`;
              // Simplify the validity check since we don't have direct access to VALID_CLASS_SLOTS
              // Just assume all slots are potentially valid for the instructor
              const isValid = true;
              
              if (isValid) {
                totalCount++;
                if (instructor.availability.includes(slotKey)) {
                  availableCount++;
                }
              }
            });
          });
          
          if (availableCount / Math.max(totalCount, 1) >= 0.5) {
            preferredTimeRanges.push(range);
          }
        });
        
        setPreferredDays(Array.from(daySet));
        setPreferredTimes(preferredTimeRanges);
      }
      
      // Process unavailability if available
      if (instructor.unavailability && instructor.unavailability.slots) {
        const unavailableDaySet = new Set();
        const unavailableTimeRanges = new Set();
        
        // Map unavailable slots to days and time ranges
        instructor.unavailability.slots.forEach(slot => {
          const [day, time] = slot.split('-');
          
          // Check if all time slots for this day are unavailable
          let allUnavailable = true;
          timeSlots.forEach(t => {
            const slotKey = `${day}-${t}`;
            if (Array.isArray(instructor.availability) && 
                instructor.availability.includes(slotKey)) {
              allUnavailable = false;
            }
          });
          
          if (allUnavailable) {
            unavailableDaySet.add(day);
          }
          
          // Find the time range
          Object.entries(timeRangeMap).forEach(([range, times]) => {
            if (times.includes(time)) {
              unavailableTimeRanges.add(range);
            }
          });
        });
        
        setUnavailableDays(Array.from(unavailableDaySet));
        setUnavailableTimes(Array.from(unavailableTimeRanges));
      }
    }
  }, [instructor, isOpen, daysOfWeek, timeSlots]);
  
  // Handle form field changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name.includes('-')) {
      // Handle checkbox arrays (class types)
      const [fieldName, itemValue] = name.split('-');
      
      if (fieldName === 'classTypes') {
        setFormData(prev => {
          const updatedClassTypes = checked 
            ? [...prev.classTypes, itemValue]
            : prev.classTypes.filter(type => type !== itemValue);
          
          return {
            ...prev,
            classTypes: updatedClassTypes
          };
        });
      }
    } else if (type === 'number') {
      // Handle numeric inputs
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      // Handle text inputs
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle checkbox changes for availability
  const handleAvailabilityChange = (e) => {
    const { name, checked } = e.target;
    // Split by the first dash only, to handle time slots with dashes in them
    const typeEndIndex = name.indexOf('-');
    const type = name.substring(0, typeEndIndex);
    const value = name.substring(typeEndIndex + 1);
    
    console.log(`Checkbox change: ${type} / ${value} = ${checked}`);
    
    if (type === 'preferredDays') {
      setPreferredDays(prev => {
        const updated = checked ? [...prev, value] : prev.filter(day => day !== value);
        console.log('Updated preferredDays:', updated);
        return updated;
      });
    } else if (type === 'preferredTimes') {
      setPreferredTimes(prev => {
        const updated = checked ? [...prev, value] : prev.filter(time => time !== value);
        console.log('Updated preferredTimes:', updated);
        return updated;
      });
    } else if (type === 'unavailableDays') {
      setUnavailableDays(prev => {
        const updated = checked ? [...prev, value] : prev.filter(day => day !== value);
        console.log('Updated unavailableDays:', updated);
        return updated;
      });
    } else if (type === 'unavailableTimes') {
      setUnavailableTimes(prev => {
        const updated = checked ? [...prev, value] : prev.filter(time => time !== value);
        console.log('Updated unavailableTimes:', updated);
        return updated;
      });
    }
  };
  
  // When saving, process the availability data
  const handleSave = () => {
    try {
      console.log('Saving instructor with preferences:', { 
        preferredDays, 
        preferredTimes, 
        unavailableDays, 
        unavailableTimes 
      });
      
      // Validate required fields
      if (!formData.name) {
        alert('Instructor name is required');
        return;
      }
      
      if (formData.classTypes.length === 0) {
        alert('At least one class type must be selected');
        return;
      }
    
    // Create a map of time ranges to specific time slots
    const timeRangeMap = {
      "Early Morning (5:30-7:00 AM)": ['5:30 AM', '6:00 AM', '6:30 AM'],
      "Morning (7:00-9:00 AM)": ['7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM'],
      "Mid-Morning (9:00-12:00)": ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
      "Lunch (12:00-2:00 PM)": ['12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM'],
      "Afternoon (2:00-4:00 PM)": ['2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'],
      "Evening (4:00-6:00 PM)": ['4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'],
      "Late Evening (6:00-8:00 PM)": ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM']
    };
    
    // Process availability and unavailability data
    const availabilitySlots = [];
    const unavailabilitySlots = [];
    const classTypePreferences = {};
    
    // Process all time slots without filtering
    
    // Process preferred days and times to create explicit availability slots
    if (preferredDays.length > 0) {
      // If they have preferred time ranges
      if (preferredTimes.length > 0) {
        // For each preferred day
        preferredDays.forEach(day => {
          // For each preferred time range
          preferredTimes.forEach(timeRange => {
            // Get the specific time slots for this range
            const timeSlots = timeRangeMap[timeRange] || [];
            // Add each specific time slot as available
            timeSlots.forEach(time => {
              const slotKey = `${day}-${time}`;
              if (!availabilitySlots.includes(slotKey)) {
                availabilitySlots.push(slotKey);
              }
              
              // Set class type preference for this slot (default to first class type they can teach)
              if (formData.classTypes && formData.classTypes.length > 0) {
                classTypePreferences[slotKey] = formData.classTypes[0];
              }
            });
          });
        });
      }
    }
    
    // Process unavailable days (all time slots for these days)
    if (unavailableDays.length > 0) {
      unavailableDays.forEach(day => {
        Object.values(timeRangeMap).flat().forEach(time => {
          const slotKey = `${day}-${time}`;
          if (!unavailabilitySlots.includes(slotKey)) {
            unavailabilitySlots.push(slotKey);
          }
          
          // Remove from availability if it was added
          const slotIndex = availabilitySlots.indexOf(slotKey);
          if (slotIndex !== -1) {
            availabilitySlots.splice(slotIndex, 1);
            // Also remove from class type preferences
            if (classTypePreferences[slotKey]) {
              delete classTypePreferences[slotKey];
            }
          }
        });
      });
    }
    
    // Process unavailable time ranges
    if (unavailableTimes.length > 0) {
      // For each unavailable time range
      unavailableTimes.forEach(timeRange => {
        // For all days (if not already marked as fully unavailable)
        daysOfWeek.forEach(day => {
          if (!unavailableDays.includes(day)) {
            // Add each specific time slot in the range
            const timeSlots = timeRangeMap[timeRange] || [];
            timeSlots.forEach(time => {
              const slotKey = `${day}-${time}`;
              if (!unavailabilitySlots.includes(slotKey)) {
                unavailabilitySlots.push(slotKey);
              }
              
              // Remove from availability if it was added
              const slotIndex = availabilitySlots.indexOf(slotKey);
              if (slotIndex !== -1) {
                availabilitySlots.splice(slotIndex, 1);
                // Also remove from class type preferences
                if (classTypePreferences[slotKey]) {
                  delete classTypePreferences[slotKey];
                }
              }
            });
          }
        });
      });
    }
    
    // Use the form data from state instead of DOM queries
    // Validate already done above
    
    console.log('Form data:', formData);
    
    // Update the instructor object with the new availability data and form data
    const updatedInstructor = {
      ...instructor,
      ...formData,
      availability: availabilitySlots,
      classTypePreferences: classTypePreferences,
      unavailability: { 
        ...instructor.unavailability, 
        slots: unavailabilitySlots 
      }
    };
    
    console.log('Saving updated instructor:', updatedInstructor);
    
    // Create a backup in localStorage before saving
    try {
      const backupKey = `instructor_backup_${instructor.id}`;
      localStorage.setItem(backupKey, JSON.stringify(updatedInstructor));
    } catch (e) {
      console.error('Failed to create backup:', e);
    }
    
    // Call the original onSave with the updated instructor
    onSave(updatedInstructor);
    
    // Show success message
    alert(`${updatedInstructor.name}'s information has been updated successfully`);
  } catch (error) {
    console.error('Error saving instructor:', error);
    alert('Failed to save changes. Please try again.');
  }
  };
  if (!isOpen || !instructor) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Edit Instructor
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Block Size
                    </label>
                    <input
                      type="number"
                      name="blockSize"
                      value={formData.blockSize || 2}
                      onChange={handleFormChange}
                      min="1"
                      max="10"
                      className="w-full p-2 border rounded text-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Min Classes
                    </label>
                    <input
                      type="number"
                      name="minClasses"
                      value={formData.minClasses || 1}
                      onChange={handleFormChange}
                      min="0"
                      max="50"
                      className="w-full p-2 border rounded text-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Max Classes
                    </label>
                    <input
                      type="number"
                      name="maxClasses"
                      value={formData.maxClasses || 10}
                      onChange={handleFormChange}
                      min="1"
                      max="50"
                      className="w-full p-2 border rounded text-black"
                    />
                  </div>
                </div>
                
                {/* Class Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Types
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {classTypes.map(type => (
                      <div key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`classTypes-${type}`}
                          name={`classTypes-${type}`}
                          checked={formData.classTypes && formData.classTypes.includes(type)}
                          onChange={handleFormChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`classTypes-${type}`} className="ml-2 block text-sm text-gray-900">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Availability Section */}
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-black mb-2">Availability</h4>
                  
                  {/* Preferred Days */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-black mb-2">
                      Preferred days to teach:
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={`preferred-${day}`} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`preferredDays-${day}`}
                            name={`preferredDays-${day}`}
                            checked={preferredDays.includes(day)}
                            onChange={handleAvailabilityChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          />
                          <label htmlFor={`preferredDays-${day}`} className="ml-2 block text-sm text-black">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Preferred Time Slots */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-black mb-2">
                      Preferred time slots:
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {timeSlots.map(timeSlot => (
                        <div key={`preferred-${timeSlot}`} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`preferredTimes-${timeSlot}`}
                            name={`preferredTimes-${timeSlot}`}
                            checked={preferredTimes.includes(timeSlot)}
                            onChange={handleAvailabilityChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          />
                          <label htmlFor={`preferredTimes-${timeSlot}`} className="ml-2 block text-sm text-black">
                            {timeSlot}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Days you CANNOT teach */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-black mb-2">
                      Days you CANNOT teach:
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={`unavailable-${day}`} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`unavailableDays-${day}`}
                            name={`unavailableDays-${day}`}
                            checked={unavailableDays.includes(day)}
                            onChange={handleAvailabilityChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          />
                          <label htmlFor={`unavailableDays-${day}`} className="ml-2 block text-sm text-black">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Time slots you CANNOT teach */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-black mb-2">
                      Time slots you CANNOT teach:
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {timeSlots.map(timeSlot => (
                        <div key={`unavailable-${timeSlot}`} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`unavailableTimes-${timeSlot}`}
                            name={`unavailableTimes-${timeSlot}`}
                            checked={unavailableTimes.includes(timeSlot)}
                            onChange={handleAvailabilityChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          />
                          <label htmlFor={`unavailableTimes-${timeSlot}`} className="ml-2 block text-sm text-black">
                            {timeSlot}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded text-black"
                  />
                </div>
                
                <div className="mt-6">
                  
                  {/* Save and Cancel buttons inside the white area */}
                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInstructorModal;
