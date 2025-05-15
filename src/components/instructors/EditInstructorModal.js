import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../../styles/checkbox.css';

/**
 * EditInstructorModal component for editing instructor details
 * Simplified approach with direct availability grid
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
  // Time slots for the grid
  const timeSlots = [
    "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", 
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM",
    "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", 
    "7:00 PM", "7:30 PM", "8:00 PM"
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
  
  // State for availability grid - direct day/time mapping
  const [availabilityGrid, setAvailabilityGrid] = useState({});
  
  // Initialize form data and availability grid when modal opens
  useEffect(() => {
    if (instructor && isOpen) {
      console.log('Initializing modal with instructor:', instructor);
      
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
      
      // Initialize empty availability grid
      const newGrid = {};
      daysOfWeek.forEach(day => {
        newGrid[day] = {};
        timeSlots.forEach(time => {
          newGrid[day][time] = false;
        });
      });
      
      // Fill in available slots from instructor.availability array
      if (Array.isArray(instructor.availability)) {
        instructor.availability.forEach(slot => {
          const [day, time] = slot.split('-');
          if (newGrid[day] && timeSlots.includes(time)) {
            newGrid[day][time] = true;
          }
        });
      }
      
      console.log('Initial availability grid:', newGrid);
      setAvailabilityGrid(newGrid);
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
  
  // Handle availability grid checkbox changes
  const handleAvailabilityChange = (day, time, checked) => {
    console.log(`Availability change: ${day} ${time} = ${checked}`);
    
    // Force a re-render by using a new object reference
    setAvailabilityGrid(prev => {
      // Create a new object to ensure React detects the change
      const newGrid = JSON.parse(JSON.stringify(prev));
      
      // Ensure the day exists
      if (!newGrid[day]) newGrid[day] = {};
      
      // Set the value
      newGrid[day][time] = checked;
      
      console.log('Updated grid:', newGrid);
      return newGrid;
    });
    
    // Double-check the DOM element is correctly checked
    setTimeout(() => {
      const checkbox = document.getElementById(`availability-${day}-${time}`);
      if (checkbox && checkbox.checked !== checked) {
        checkbox.checked = checked;
      }
    }, 10);
  };
  
  // Convenience function to check if a slot is available
  const isSlotAvailable = (day, time) => {
    return availabilityGrid[day]?.[time] || false;
  };
  
  // When saving, process the availability data
  const handleSave = () => {
    try {
      console.log('Saving instructor with form data:', formData);
      console.log('Availability grid:', availabilityGrid);
      
      // Validate required fields
      if (!formData.name) {
        alert('Instructor name is required');
        return;
      }
      
      if (formData.classTypes.length === 0) {
        alert('At least one class type must be selected');
        return;
      }
      
      // Convert availability grid to array format
      const availabilityArray = [];
      Object.entries(availabilityGrid).forEach(([day, times]) => {
        Object.entries(times).forEach(([time, isAvailable]) => {
          if (isAvailable) {
            availabilityArray.push(`${day}-${time}`);
          }
        });
      });
      
      console.log('Converted availability array:', availabilityArray);
      
      // Create updated instructor object
      const updatedInstructor = {
        ...instructor,
        ...formData,
        availability: availabilityArray
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
                
                {/* Availability Section - Simplified Grid Approach */}
                <div className="mt-6 overflow-x-auto">
                  <h4 className="text-lg font-medium text-black mb-2">Availability</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Check the time slots when this instructor is available to teach:
                  </p>
                  
                  <table className="min-w-full border border-gray-200">
                    <thead>
                      <tr>
                        <th className="py-2 px-2 border-b text-xs font-medium text-gray-700">Time</th>
                        {daysOfWeek.map(day => (
                          <th key={day} className="py-2 px-2 border-b text-xs font-medium text-gray-700">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map(time => (
                        <tr key={time}>
                          <td className="py-1 px-2 border-b border-r text-xs font-medium text-gray-700">
                            {time}
                          </td>
                          {daysOfWeek.map(day => (
                            <td key={`${day}-${time}`} className="py-1 px-2 border-b border-r text-center">
                              <input
                                type="checkbox"
                                id={`availability-${day}-${time}`}
                                checked={isSlotAvailable(day, time)}
                                onChange={(e) => {
                                  // Force the DOM element to update visually
                                  document.getElementById(`availability-${day}-${time}`).checked = e.target.checked;
                                  // Then update state
                                  handleAvailabilityChange(day, time, e.target.checked);
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Notes */}
                <div className="mt-4">
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
