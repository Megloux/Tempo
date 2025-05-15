import React, { useState, useEffect } from 'react';
import { useClassSchedule } from '../context/ClassScheduleContext';
import { useToast } from '../context/ToastContext';

const InstructorRegistration = () => {
  const { CLASS_TYPES, DAYS_OF_WEEK, CLASS_TIMES, addInstructor, schedule } = useClassSchedule();
  const toast = useToast();
  
  // Helper function to check if a class is scheduled at a specific day, type, and time
  const isClassScheduled = (day, type, time) => {
    return schedule[day]?.[type]?.[time] !== undefined && schedule[day][type][time] !== null;
  };
  
  // State for instructor self-registration
  const [instructorForm, setInstructorForm] = useState({
    name: '',
    email: '',
    phone: '',
    classTypes: [],
    preferredDays: [],
    preferredTimes: [],
    unavailableDays: [],
    unavailableTimes: [],
    notes: ''
  });
  
  // Initialize arrays to prevent undefined errors
  useEffect(() => {
    setInstructorForm(prev => ({
      ...prev,
      classTypes: prev.classTypes || [],
      preferredDays: prev.preferredDays || [],
      preferredTimes: prev.preferredTimes || [],
      unavailableDays: prev.unavailableDays || [],
      unavailableTimes: prev.unavailableTimes || []
    }));
  }, []);
  
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
  
  // Handle instructor self-registration form
  const handleInstructorFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // Extract the field name and item value from the checkbox name
      // Format is fieldName-itemValue (e.g., classTypes-Lagree)
      const parts = name.split('-');
      const field = parts[0];
      const item = parts.slice(1).join('-'); // Rejoin in case the item value itself contains hyphens
      
      setInstructorForm(prev => {
        // Initialize the array if it doesn't exist
        const currentArray = prev[field] || [];
        
        if (checked) {
          // Add the item if it's not already in the array
          return { ...prev, [field]: [...currentArray, item] };
        } else {
          // Remove the item from the array
          return { ...prev, [field]: currentArray.filter(i => i !== item) };
        }
      });
    } else {
      setInstructorForm(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Submit instructor self-registration form
  const submitInstructorForm = async () => {
    // Validate required fields
    if (!instructorForm.name || !instructorForm.email) {
      toast.error('Missing Information: Name and email are required!');
      return;
    }
    
    // Validate at least one class type is selected
    if (!instructorForm.classTypes || instructorForm.classTypes.length === 0) {
      toast.error('Missing Information: Please select at least one class type you can teach.');
      return;
    }
    
    // Generate a unique ID based on the instructor's name
    const id = instructorForm.name
      .split(' ')
      .map(n => n[0]?.toUpperCase() || '')
      .join('');
    
    // Convert instructor form data to the format expected by the system
    const newInstructor = {
      id,
      name: instructorForm.name,
      email: instructorForm.email,
      phone: instructorForm.phone,
      classTypes: instructorForm.classTypes,
      blockSize: 2, // Default block size
      minClasses: 2, // Default minimum classes
      maxClasses: 10, // Default maximum classes
      availability: [],
      classTypePreferences: {},
      unavailability: {slots: []}
    };
    
    // Process availability and unavailability data
    const availabilitySlots = [];
    const unavailabilitySlots = [];
    const classTypePreferences = {};
    
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
    
    // Process preferred days and times to create explicit availability slots
    if (instructorForm.preferredDays && instructorForm.preferredDays.length > 0) {
      // If they have preferred time ranges
      if (instructorForm.preferredTimes && instructorForm.preferredTimes.length > 0) {
        // For each preferred day
        instructorForm.preferredDays.forEach(day => {
          // For each preferred time range
          instructorForm.preferredTimes.forEach(timeRange => {
            // Get the specific time slots for this range
            const timeSlots = timeRangeMap[timeRange] || [];
            // Add each specific time slot as available
            timeSlots.forEach(time => {
              const slotKey = `${day}-${time}`;
              availabilitySlots.push(slotKey);
              
              // Set class type preference for this slot (default to first class type they can teach)
              if (instructorForm.classTypes.length > 0) {
                classTypePreferences[slotKey] = instructorForm.classTypes[0];
              }
            });
          });
        });
      } else {
        // If no preferred times specified, assume all times on preferred days are available
        instructorForm.preferredDays.forEach(day => {
          CLASS_TIMES.forEach(time => {
            const slotKey = `${day}-${time}`;
            availabilitySlots.push(slotKey);
            
            // Set class type preference for this slot (default to first class type they can teach)
            if (instructorForm.classTypes.length > 0) {
              classTypePreferences[slotKey] = instructorForm.classTypes[0];
            }
          });
        });
      }
    }
    
    // Process unavailable days (all time slots for these days)
    if (instructorForm.unavailableDays && instructorForm.unavailableDays.length > 0) {
      instructorForm.unavailableDays.forEach(day => {
        CLASS_TIMES.forEach(time => {
          const slotKey = `${day}-${time}`;
          unavailabilitySlots.push(slotKey);
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
    if (instructorForm.unavailableTimes && instructorForm.unavailableTimes.length > 0) {
      // For each unavailable time range
      instructorForm.unavailableTimes.forEach(timeRange => {
        // For all days (if not already marked as fully unavailable)
        DAYS_OF_WEEK.forEach(day => {
          if (!instructorForm.unavailableDays.includes(day)) {
            // Add each specific time slot in the range
            const timeSlots = timeRangeMap[timeRange] || [];
            timeSlots.forEach(time => {
              const slotKey = `${day}-${time}`;
              unavailabilitySlots.push(slotKey);
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
    
    // Set the availability and unavailability slots
    newInstructor.availability = availabilitySlots;
    newInstructor.classTypePreferences = classTypePreferences;
    newInstructor.unavailability.slots = unavailabilitySlots;
    
    // Add notes if provided
    if (instructorForm.notes) {
      newInstructor.notes = instructorForm.notes;
    }
    
    try {
      // Show loading toast
      toast.info('Registering Instructor: Please wait while we register the instructor...');
      
      // Add the new instructor - now properly awaiting the async function
      const instructorId = await addInstructor(newInstructor);
      
      if (!instructorId) {
        throw new Error('Failed to add instructor - no ID returned');
      }
      
      // Show success message
      toast.success(`Registration Successful: ${newInstructor.name} has been registered successfully!`);
      
      // Reset the form
      setInstructorForm({
        name: '',
        email: '',
        phone: '',
        classTypes: [],
        preferredDays: [],
        preferredTimes: [],
        unavailableDays: [],
        unavailableTimes: [],
        notes: ''
      });
    } catch (err) {
      console.error('Error registering instructor:', err);
      toast.error('Registration Failed: There was an error registering the instructor. Please try again.');
      
      // Still try to save to localStorage as a backup
      try {
        const currentInstructors = JSON.parse(localStorage.getItem('instructors') || '[]');
        const updatedInstructors = [...currentInstructors, newInstructor];
        localStorage.setItem('instructors', JSON.stringify(updatedInstructors));
        console.log('Saved to localStorage as backup:', newInstructor);
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
    }
  };
  
  // Reset form to initial state
  const resetForm = () => {
    setInstructorForm({
      name: '',
      email: '',
      phone: '',
      classTypes: [],
      preferredDays: [],
      preferredTimes: [],
      unavailableDays: [],
      unavailableTimes: [],
      notes: ''
    });
  };
  
  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-black">Instructor Registration Form</h2>
      <p className="mb-6 text-black">Please provide your information and teaching preferences to join our instructor team.</p>
      
      <div className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-4 text-black">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Full Name:</label>
              <input
                type="text"
                name="name"
                value={instructorForm.name}
                onChange={handleInstructorFormChange}
                className="w-full p-2 border rounded text-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Email:</label>
              <input
                type="email"
                name="email"
                value={instructorForm.email}
                onChange={handleInstructorFormChange}
                className="w-full p-2 border rounded text-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Phone:</label>
              <input
                type="tel"
                name="phone"
                value={instructorForm.phone}
                onChange={handleInstructorFormChange}
                className="w-full p-2 border rounded text-black"
              />
            </div>
          </div>
        </div>
        
        {/* Class Types Section */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-4 text-black">Class Types</h3>
          <p className="mb-2 text-black">Select all class types you can teach:</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CLASS_TYPES.map(type => (
              <div key={type} className="flex items-center">
                <input
                  type="checkbox"
                  id={`classTypes-${type}`}
                  name={`classTypes-${type}`}
                  checked={instructorForm.classTypes.includes(type)}
                  onChange={handleInstructorFormChange}
                  className="mr-2"
                />
                <label htmlFor={`classTypes-${type}`} className="text-black">{type}</label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Availability Section */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-4 text-black">Availability</h3>
          
          {/* Days Available */}
          <div className="mb-4">
            <p className="mb-2 text-black">Preferred days to teach:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`preferredDays-${day}`}
                    name={`preferredDays-${day}`}
                    checked={instructorForm.preferredDays.includes(day)}
                    onChange={handleInstructorFormChange}
                    className="mr-2"
                  />
                  <label htmlFor={`preferredDays-${day}`} className="text-black">{day}</label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Preferred Time Slots */}
          <div className="mb-4">
            <p className="mb-2 text-black">Preferred time slots:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {timeSlots.map(slot => (
                <div key={slot} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`preferredTimes-${slot}`}
                    name={`preferredTimes-${slot}`}
                    checked={instructorForm.preferredTimes.includes(slot)}
                    onChange={handleInstructorFormChange}
                    className="mr-2"
                  />
                  <label htmlFor={`preferredTimes-${slot}`} className="text-black">{slot}</label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Unavailable Days */}
          <div className="mb-4">
            <p className="mb-2 text-black">Days you CANNOT teach:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <div key={`unavailable-${day}`} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`unavailableDays-${day}`}
                    name={`unavailableDays-${day}`}
                    checked={instructorForm.unavailableDays.includes(day)}
                    onChange={handleInstructorFormChange}
                    className="mr-2"
                  />
                  <label htmlFor={`unavailableDays-${day}`} className="text-black">{day}</label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Unavailable Time Slots */}
          <div className="mb-4">
            <p className="mb-2 text-black">Time slots you CANNOT teach:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {timeSlots.map(slot => (
                <div key={`unavailable-${slot}`} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`unavailableTimes-${slot}`}
                    name={`unavailableTimes-${slot}`}
                    checked={instructorForm.unavailableTimes.includes(slot)}
                    onChange={handleInstructorFormChange}
                    className="mr-2"
                  />
                  <label htmlFor={`unavailableTimes-${slot}`} className="text-black">{slot}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Additional Notes */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-4 text-black">Additional Notes</h3>
          <textarea
            name="notes"
            value={instructorForm.notes}
            onChange={handleInstructorFormChange}
            className="w-full p-2 border rounded h-32 text-black"
            placeholder="Any additional information you'd like us to know..."
          ></textarea>
        </div>
        
        {/* Submit Button */}
        <div className="text-center">
          <button 
            onClick={submitInstructorForm}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Submit Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorRegistration;
