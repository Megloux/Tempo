import React, { useState, useEffect } from 'react';
import { useClassSchedule } from '../context/ClassScheduleContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const InstructorManagement = () => {
  const { 
    instructors, 
    updateInstructor, 
    deleteInstructor,
    CLASS_TYPES, 
    DAYS_OF_WEEK, 
    CLASS_TIMES, 
    setInstructorAvailability: updateInstructorAvailability,
    getInstructorClasses,
    schedule
  } = useClassSchedule();
  
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [instructorAvailability, setInstructorAvailability] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [instructorToDelete, setInstructorToDelete] = useState(null);
  
  // Helper function to check if a class is scheduled at a specific day, type, and time
  const isClassScheduled = (day, type, time) => {
    return schedule[day]?.[type]?.[time] !== undefined && schedule[day][type][time] !== null;
  };
  
  // Load instructor's availability when selected
  const handleInstructorSelect = (instructorId) => {
    setSelectedInstructor(instructorId);
    
    if (instructorId) {
      const instructor = instructors.find(i => i.id === instructorId);
      if (instructor) {
        // Initialize availability grid with all slots unavailable by default
        const availabilityGrid = {};
        // Initialize class type preferences grid
        const classTypeGrid = {};
        
        DAYS_OF_WEEK.forEach(day => {
          availabilityGrid[day] = {};
          classTypeGrid[day] = {};
          CLASS_TIMES.forEach(time => {
            // Default to unavailable
            availabilityGrid[day][time] = false;
            // Default to first class type the instructor can teach
            classTypeGrid[day][time] = instructor.classTypes[0] || '';
          });
        });
        
        // Mark slots as available based on instructor's availability
        if (instructor.availability && instructor.availability.length > 0) {
          // If we have explicit availability data, use it
          instructor.availability.forEach(slot => {
            const [day, time] = slot.split('-');
            if (availabilityGrid[day] && CLASS_TIMES.includes(time)) {
              availabilityGrid[day][time] = true;
              
              // Set class type preference if available
              if (instructor.classTypePreferences && instructor.classTypePreferences[slot]) {
                classTypeGrid[day][time] = instructor.classTypePreferences[slot];
              }
            }
          });
        } else if (instructor.unavailability && instructor.unavailability.slots) {
          // Fallback to using unavailability data if no explicit availability
          DAYS_OF_WEEK.forEach(day => {
            CLASS_TIMES.forEach(time => {
              const slot = `${day}-${time}`;
              const isUnavailable = instructor.unavailability.slots.includes(slot);
              availabilityGrid[day][time] = !isUnavailable;
              
              // Set class type preference if available
              if (!isUnavailable && instructor.classTypePreferences && instructor.classTypePreferences[slot]) {
                classTypeGrid[day][time] = instructor.classTypePreferences[slot];
              }
            });
          });
        }
        
        // Only highlight scheduled classes that match instructor's explicit availability
        // This ensures we respect the instructor's selected availability
        if (instructor.availability && instructor.availability.length > 0) {
          // Get the list of slots the instructor is available for
          const availableSlots = new Set(instructor.availability);
          
          DAYS_OF_WEEK.forEach(day => {
            CLASS_TIMES.forEach(time => {
              const slotKey = `${day}-${time}`;
              
              // Only check if this slot is in the instructor's availability
              if (availableSlots.has(slotKey)) {
                // Check if there's a class scheduled at this time that matches their capabilities
                let hasMatchingClass = false;
                let matchingClassType = '';
                
                // Check each class type
                for (const type of CLASS_TYPES) {
                  // If the instructor can teach this class type and it's scheduled
                  if (instructor.classTypes.includes(type) && isClassScheduled(day, type, time)) {
                    hasMatchingClass = true;
                    matchingClassType = type;
                    break;
                  }
                }
                
                // If there's a matching class, keep it available and set the class type
                if (hasMatchingClass) {
                  // We don't need to set availabilityGrid[day][time] = true here
                  // because it's already set to true from the instructor's availability
                  classTypeGrid[day][time] = matchingClassType;
                }
              }
            });
          });
        }
        
        setInstructorAvailability(availabilityGrid);
        setInstructorClassTypes(classTypeGrid);
      }
    }
  };
  
  // State for tracking class type assignments
  const [instructorClassTypes, setInstructorClassTypes] = useState({});
  
  // Initialize class type assignments when instructor is selected
  useEffect(() => {
    if (selectedInstructor) {
      const instructor = instructors.find(i => i.id === selectedInstructor);
      if (instructor) {
        // Initialize class type assignments
        const classTypeAssignments = {};
        DAYS_OF_WEEK.forEach(day => {
          classTypeAssignments[day] = {};
          CLASS_TIMES.forEach(time => {
            // Default to first class type the instructor can teach
            classTypeAssignments[day][time] = instructor.classTypes[0] || '';
          });
        });
        setInstructorClassTypes(classTypeAssignments);
      }
    }
  }, [selectedInstructor, instructors]);
  
  // Handle availability checkbox change
  const handleAvailabilityChange = (day, time, isAvailable) => {
    // Update local state only (don't update context until save)
    setInstructorAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: isAvailable
      }
    }));
  };
  
  // Handle class type change for a specific time slot
  const handleClassTypeChange = (day, time, classType) => {
    setInstructorClassTypes(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: classType
      }
    }));
  };
  
  // Get class type color for checkboxes
  const getClassTypeColor = (type) => {
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
  
  // Save all availability changes at once
  const saveAvailability = () => {
    if (!selectedInstructor) return;
    
    // Convert the availability grid to an array of available slots
    const availabilitySlots = [];
    // Track class type preferences for each available slot
    const classTypePreferences = {};
    
    // Process the availability grid
    Object.entries(instructorAvailability).forEach(([day, times]) => {
      Object.entries(times).forEach(([time, isAvailable]) => {
        if (isAvailable) {
          const slotKey = `${day}-${time}`;
          availabilitySlots.push(slotKey);
          
          // Store class type preference for this slot
          const classType = instructorClassTypes[day]?.[time] || '';
          if (classType) {
            classTypePreferences[slotKey] = classType;
          }
        }
      });
    });
    
    // Get the current instructor
    const instructor = instructors.find(i => i.id === selectedInstructor);
    if (!instructor) return;
    
    // Sync with actual class schedule to ensure only scheduled classes are included
    const syncedAvailabilitySlots = [];
    const syncedClassTypePreferences = {};
    
    // Check each available slot against the actual class schedule
    availabilitySlots.forEach(slotKey => {
      const [day, time] = slotKey.split('-');
      const classType = classTypePreferences[slotKey];
      
      // If there's a class of this type scheduled at this time, include it
      if (classType && isClassScheduled(day, classType, time)) {
        syncedAvailabilitySlots.push(slotKey);
        syncedClassTypePreferences[slotKey] = classType;
      } else {
        // If there's no class of this specific type, check if there's any class
        // of a type this instructor can teach
        for (const type of instructor.classTypes) {
          if (isClassScheduled(day, type, time)) {
            syncedAvailabilitySlots.push(slotKey);
            syncedClassTypePreferences[slotKey] = type;
            break;
          }
        }
      }
    });
    
    // Create updated instructor with new availability and class type preferences
    const updatedInstructor = {
      ...instructor,
      availability: availabilitySlots,
      classTypePreferences: classTypePreferences
    };
    
    // Update the instructor
    updateInstructor(selectedInstructor, updatedInstructor);
    
    // Preserve the class type selections in the UI
    // This ensures the UI state stays consistent with what was saved
    setInstructorClassTypes({...instructorClassTypes});
    
    // Show success message
    alert(`Availability for ${instructor.name} has been saved successfully.`);
  };
  
  // Get instructor's assigned classes
  const getAssignedClassesCount = (instructorId) => {
    return getInstructorClasses(instructorId).length;
  };
  
  // Calculate instructor workload percentage
  const getWorkloadPercentage = (instructorId) => {
    const instructor = instructors.find(i => i.id === instructorId);
    if (!instructor) return 0;
    
    const assignedClasses = getAssignedClassesCount(instructorId);
    const maxClasses = instructor.maxClasses;
    
    return Math.round((assignedClasses / maxClasses) * 100);
  };
  
  // Open edit instructor modal
  const openEditModal = (instructor) => {
    setEditingInstructor({
      ...instructor,
      classTypes: [...instructor.classTypes] // Create a copy to avoid reference issues
    });
    setShowEditModal(true);
  };
  
  // Close edit instructor modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingInstructor(null);
  };
  
  // Handle edit instructor form changes
  const handleEditInstructorChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name.startsWith('classTypes-')) {
      const classType = name.replace('classTypes-', '');
      
      setEditingInstructor(prev => {
        const updatedClassTypes = checked
          ? [...prev.classTypes, classType]
          : prev.classTypes.filter(type => type !== classType);
          
        return { ...prev, classTypes: updatedClassTypes };
      });
    } else if (type === 'number') {
      setEditingInstructor(prev => ({
        ...prev,
        [name]: parseInt(value, 10) || 0
      }));
    } else {
      setEditingInstructor(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Save edited instructor
  const saveInstructor = () => {
    if (editingInstructor) {
      updateInstructor(editingInstructor.id, editingInstructor);
      closeEditModal();
    }
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (instructor) => {
    setInstructorToDelete(instructor);
    setShowDeleteModal(true);
  };
  
  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setInstructorToDelete(null);
  };
  
  // Confirm and delete instructor
  const confirmDeleteInstructor = () => {
    if (instructorToDelete) {
      deleteInstructor(instructorToDelete.id);
      if (selectedInstructor === instructorToDelete.id) {
        setSelectedInstructor('');
        setInstructorAvailability({});
      }
      closeDeleteModal();
    }
  };
  
  // Analytics functions
  const getInstructorWorkload = () => {
    const workload = {};
    
    // Initialize workload counters for each instructor
    instructors.forEach(instructor => {
      workload[instructor.id] = {
        name: instructor.name,
        id: instructor.id,
        total: 0,
        Lagree: 0,
        Strength: 0,
        Boxing: 0,
        Stretch: 0,
        PT: 0
      };
    });
    
    // Count classes for each instructor
    instructors.forEach(instructor => {
      const classes = getInstructorClasses(instructor.id);
      if (classes && classes.length > 0) {
        classes.forEach(classInfo => {
          workload[instructor.id].total += 1;
          workload[instructor.id][classInfo.type] += 1;
        });
      }
    });
    
    return Object.values(workload).sort((a, b) => b.total - a.total);
  };
  
  // Get classes by day of week for each instructor
  const getClassesByDayOfWeek = (instructorId) => {
    const dayWorkload = {
      Mon: { total: 0, Lagree: 0, Strength: 0, Boxing: 0, Stretch: 0, PT: 0 },
      Tues: { total: 0, Lagree: 0, Strength: 0, Boxing: 0, Stretch: 0, PT: 0 },
      Wed: { total: 0, Lagree: 0, Strength: 0, Boxing: 0, Stretch: 0, PT: 0 },
      Thu: { total: 0, Lagree: 0, Strength: 0, Boxing: 0, Stretch: 0, PT: 0 },
      Fri: { total: 0, Lagree: 0, Strength: 0, Boxing: 0, Stretch: 0, PT: 0 },
      Sat: { total: 0, Lagree: 0, Strength: 0, Boxing: 0, Stretch: 0, PT: 0 },
      Sun: { total: 0, Lagree: 0, Strength: 0, Boxing: 0, Stretch: 0, PT: 0 }
    };
    
    // Get all classes for this instructor
    const classes = getInstructorClasses(instructorId);
    
    // Count classes by day and type
    if (classes && classes.length > 0) {
      classes.forEach(classInfo => {
        dayWorkload[classInfo.day].total += 1;
        dayWorkload[classInfo.day][classInfo.type] += 1;
      });
    }
    
    // Convert to array format for charts
    return Object.entries(dayWorkload).map(([day, counts]) => ({
      day,
      ...counts
    }));
  };
  
  // Get color for charts
  const getChartColor = (type) => {
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
  
  // Get color for instructor bars
  const getInstructorColor = (instructorId) => {
    switch(instructorId) {
      case 'dayron':
        return '#4B5563'; // gray-600
      case 'michelle':
        return '#F87171'; // red-400
      case 'taylor':
        return '#34D399'; // green-400
      case 'aseel':
        return '#A78BFA'; // purple-400
      case 'allison':
        return '#FBBF24'; // yellow-400
      case 'megan':
        return '#FB923C'; // orange-400
      case 'erin':
        return '#2DD4BF'; // teal-400
      case 'sandhya':
        return '#F472B6'; // pink-400
      case 'jess':
        return '#60A5FA'; // blue-400
      default:
        return '#9CA3AF'; // gray-400
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Instructor Management</h2>
      
      {/* Instructor List */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Instructor List</h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-3 px-4 border-b text-left">ID</th>
                <th className="py-3 px-4 border-b text-left">Name</th>
                <th className="py-3 px-4 border-b text-left">Email</th>
                <th className="py-3 px-4 border-b text-left">Class Types</th>
                <th className="py-3 px-4 border-b text-center">Block Size</th>
                <th className="py-3 px-4 border-b text-center">Min Classes</th>
                <th className="py-3 px-4 border-b text-center">Max Classes</th>
                <th className="py-3 px-4 border-b text-center">Current Load</th>
                <th className="py-3 px-4 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((instructor, index) => (
                <tr 
                  key={instructor.id} 
                  className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50`}
                >
                  <td className="py-3 px-4 border-b cursor-pointer" onClick={() => handleInstructorSelect(instructor.id)}>{instructor.id}</td>
                  <td className="py-3 px-4 border-b cursor-pointer" onClick={() => handleInstructorSelect(instructor.id)}>{instructor.name}</td>
                  <td className="py-3 px-4 border-b cursor-pointer" onClick={() => handleInstructorSelect(instructor.id)}>{instructor.email}</td>
                  <td className="py-3 px-4 border-b cursor-pointer" onClick={() => handleInstructorSelect(instructor.id)}>{instructor.classTypes.join(', ')}</td>
                  <td className="py-3 px-4 border-b text-center cursor-pointer" onClick={() => handleInstructorSelect(instructor.id)}>{instructor.blockSize}</td>
                  <td className="py-3 px-4 border-b text-center cursor-pointer" onClick={() => handleInstructorSelect(instructor.id)}>{instructor.minClasses}</td>
                  <td className="py-3 px-4 border-b text-center cursor-pointer" onClick={() => handleInstructorSelect(instructor.id)}>{instructor.maxClasses}</td>
                  <td className="py-3 px-4 border-b cursor-pointer" onClick={() => handleInstructorSelect(instructor.id)}>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            getWorkloadPercentage(instructor.id) > 90 ? 'bg-red-600' :
                            getWorkloadPercentage(instructor.id) > 70 ? 'bg-yellow-500' :
                            'bg-green-600'
                          }`}
                          style={{ width: `${getWorkloadPercentage(instructor.id)}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm">
                        {getAssignedClassesCount(instructor.id)}/{instructor.maxClasses}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(instructor);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(instructor);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Instructor Availability Editor */}
      {selectedInstructor && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Instructor Availability: {instructors.find(i => i.id === selectedInstructor)?.name}
          </h3>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border text-left">Day</th>
                    {CLASS_TIMES.map(time => (
                      <th key={time} className="p-2 border text-center text-xs">
                        {time}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS_OF_WEEK.map(day => (
                    <tr key={day} className="hover:bg-gray-50">
                      <td className="p-2 border font-medium">{day}</td>
                      {CLASS_TIMES.map(time => (
                        <td key={`${day}-${time}`} className="p-2 border text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <input 
                              type="checkbox" 
                              className={`form-checkbox h-5 w-5 ${instructorAvailability[day]?.[time] ? getClassTypeColor(instructorClassTypes[day]?.[time]) : 'text-gray-600'}`}
                              checked={instructorAvailability[day]?.[time] || false}
                              onChange={(e) => handleAvailabilityChange(day, time, e.target.checked)}
                            />
                            {instructorAvailability[day]?.[time] && (
                              <select
                                className={`text-xs w-full p-1 border rounded ${getClassTypeColor(instructorClassTypes[day]?.[time])}`}
                                value={instructorClassTypes[day]?.[time] || ''}
                                onChange={(e) => handleClassTypeChange(day, time, e.target.value)}
                              >
                                {instructors.find(i => i.id === selectedInstructor)?.classTypes.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <p>✓ = Available to teach</p>
                <p>Empty = Unavailable</p>
              </div>
              <button 
                onClick={saveAvailability}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save Availability
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Analytics Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Schedule Analytics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 shadow-sm bg-white">
            <h4 className="font-medium mb-3">Instructor Load Distribution</h4>
            <div className="h-64 bg-gray-100 flex items-center justify-center rounded">
              {/* Placeholder for chart */}
              <p className="text-gray-500">Instructor workload chart</p>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 shadow-sm bg-white">
            <h4 className="font-medium mb-3">Class Distribution by Type</h4>
            <div className="h-64 bg-gray-100 flex items-center justify-center rounded">
              {/* Placeholder for chart */}
              <p className="text-gray-500">Class type distribution chart</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Instructor Modal */}
      {showEditModal && editingInstructor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">
              Edit Instructor: {editingInstructor.name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID:</label>
                <input
                  type="text"
                  name="id"
                  value={editingInstructor.id}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={editingInstructor.name}
                  onChange={handleEditInstructorChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={editingInstructor.email}
                  onChange={handleEditInstructorChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone:</label>
                <input
                  type="tel"
                  name="phone"
                  value={editingInstructor.phone || ''}
                  onChange={handleEditInstructorChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Block Size:</label>
                <input
                  type="number"
                  name="blockSize"
                  value={editingInstructor.blockSize}
                  onChange={handleEditInstructorChange}
                  min="1"
                  max="8"
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Min Classes:</label>
                <input
                  type="number"
                  name="minClasses"
                  value={editingInstructor.minClasses}
                  onChange={handleEditInstructorChange}
                  min="0"
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Max Classes:</label>
                <input
                  type="number"
                  name="maxClasses"
                  value={editingInstructor.maxClasses}
                  onChange={handleEditInstructorChange}
                  min="1"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Class Types:</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {CLASS_TYPES.map(type => (
                  <div key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`edit-classTypes-${type}`}
                      name={`classTypes-${type}`}
                      checked={editingInstructor.classTypes.includes(type)}
                      onChange={handleEditInstructorChange}
                      className="h-5 w-5 text-blue-600"
                    />
                    <label htmlFor={`edit-classTypes-${type}`} className="ml-2 text-gray-700">{type}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={saveInstructor}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && instructorToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-red-600">
              Delete Instructor
            </h3>
            
            <p className="mb-6">
              Are you sure you want to delete instructor <strong>{instructorToDelete.name}</strong>? 
              This action cannot be undone, and any classes assigned to this instructor will be marked as unassigned (TBD).
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteInstructor}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Instructor
              </button>
            </div>
          </div>
        </div>
      )}
      

    </div>
  );
};

export default InstructorManagement;
