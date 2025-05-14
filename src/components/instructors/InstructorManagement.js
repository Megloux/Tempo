import React, { useState, useEffect, useCallback } from 'react';
import { useClassSchedule } from '../../context/ClassScheduleContext';
import { useToast } from '../../context/ToastContext';
import { debounce } from '../../utils/helpers';

// Import sub-components
import InstructorSelector from './InstructorSelector';
import InstructorStats from './InstructorStats';
import AvailabilityGrid from './AvailabilityGrid';
import InstructorList from './InstructorList';
import EditInstructorModal from './EditInstructorModal';
import DeleteInstructorModal from './DeleteInstructorModal';

/**
 * Main InstructorManagement component
 */
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
    schedule,
    undoLastChange,
    hasSchedulingConflict,
    validateInstructorData
  } = useClassSchedule();
  
  // Toast notifications
  const toast = useToast();
  
  // State for instructor management
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [instructorAvailability, setInstructorAvailability] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [instructorToDelete, setInstructorToDelete] = useState(null);
  
  // State for tracking class type assignments
  const [instructorClassTypes, setInstructorClassTypes] = useState({});
  
  // Mobile responsiveness state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = debounce(() => {
      setIsMobile(window.innerWidth < 768);
    }, 250);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Helper function to check if a class is scheduled at a specific day, type, and time
  const isClassScheduled = (day, type, time) => {
    return schedule[day]?.[type]?.[time] !== undefined && schedule[day][type][time] !== null;
  };
  
  // Load instructor's availability when selected
  const handleInstructorSelect = useCallback((instructorId) => {
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
        // Show ALL availability slots without filtering based on scheduled classes
        if (instructor.availability && instructor.availability.length > 0) {
          // If we have explicit availability data, use it
          instructor.availability.forEach(slot => {
            const [day, time] = slot.split('-');
            if (availabilityGrid[day] && CLASS_TIMES.includes(time)) {
              // Mark this slot as available
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
        
        setInstructorAvailability(availabilityGrid);
        setInstructorClassTypes(classTypeGrid);
        
        // Show success message
        toast.info(`Loaded availability for ${instructor.name}`);
      }
    }
  }, [instructors, DAYS_OF_WEEK, CLASS_TIMES, toast]);
  
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
  
  // Save all availability changes at once
  const saveAvailability = () => {
    if (!selectedInstructor) return;
    
    try {
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
      if (!instructor) {
        toast.error('Instructor not found');
        return;
      }
      
      // Create updated instructor with new availability and class type preferences
      const updatedInstructor = {
        ...instructor,
        availability: availabilitySlots,
        classTypePreferences: classTypePreferences
      };
      
      // Validate the data before saving
      const validatedInstructor = validateInstructorData(updatedInstructor);
      
      // Update the instructor
      const success = updateInstructor(selectedInstructor, validatedInstructor);
      
      if (success) {
        // Ensure class type selections are preserved in the UI
        setInstructorClassTypes({...instructorClassTypes});
        
        // Show success message with toast instead of alert
        toast.success(`Availability for ${instructor.name} has been saved successfully`);
      } else {
        toast.error('Failed to save instructor availability');
      }
    } catch (error) {
      console.error('Error saving instructor availability:', error);
      toast.error(`Error saving availability: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Get instructor's assigned classes count
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
      const success = updateInstructor(editingInstructor.id, editingInstructor);
      if (success) {
        toast.success(`Instructor ${editingInstructor.name} updated successfully`);
        closeEditModal();
      } else {
        toast.error('Failed to update instructor');
      }
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
      toast.success(`Instructor ${instructorToDelete.name} deleted successfully`);
      closeDeleteModal();
    }
  };
  
  // Handle undo last change
  const handleUndoLastChange = () => {
    const success = undoLastChange();
    if (success) {
      toast.info('Last change undone successfully');
      // Refresh the current instructor view if needed
      if (selectedInstructor) {
        handleInstructorSelect(selectedInstructor);
      }
    } else {
      toast.warning('No changes to undo');
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-white p-4 md:p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 md:mb-6 text-center text-blue-800">Instructor Management</h2>
      
      {/* Mobile view controls */}
      {isMobile && (
        <div className="mb-4 flex flex-col space-y-2">
          <InstructorSelector
            instructors={instructors}
            selectedInstructorId={selectedInstructor}
            onSelectInstructor={handleInstructorSelect}
            onEditInstructor={openEditModal}
            onDeleteInstructor={openDeleteModal}
            onSaveAvailability={saveAvailability}
            onUndoLastChange={handleUndoLastChange}
            getAssignedClassesCount={getAssignedClassesCount}
            isMobile={true}
          />
          
          {selectedInstructor && (
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full py-2 px-3 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              {showMobileFilters ? 'Hide Stats' : 'Show Stats'}
            </button>
          )}
          
          {/* Mobile stats view */}
          {selectedInstructor && showMobileFilters && (
            <InstructorStats
              instructor={instructors.find(i => i.id === selectedInstructor)}
              assignedClassesCount={getAssignedClassesCount(selectedInstructor)}
              workloadPercentage={getWorkloadPercentage(selectedInstructor)}
              isMobile={true}
            />
          )}
        </div>
      )}
      
      {/* Instructor list for non-mobile */}
      {!isMobile && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">All Instructors</h3>
          
          <InstructorList
            instructors={instructors}
            onSelectInstructor={handleInstructorSelect}
            onEditInstructor={openEditModal}
            onDeleteInstructor={openDeleteModal}
            getWorkloadPercentage={getWorkloadPercentage}
            getAssignedClassesCount={getAssignedClassesCount}
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        {/* Desktop Instructor Selection */}
        {!isMobile && (
          <div className="md:col-span-1 bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-4 text-blue-700">Instructors</h3>
            
            <InstructorSelector
              instructors={instructors}
              selectedInstructorId={selectedInstructor}
              onSelectInstructor={handleInstructorSelect}
              onEditInstructor={openEditModal}
              onDeleteInstructor={openDeleteModal}
              onSaveAvailability={saveAvailability}
              onUndoLastChange={handleUndoLastChange}
              getAssignedClassesCount={getAssignedClassesCount}
              isMobile={false}
            />
            
            {/* Instructor Stats */}
            {selectedInstructor && (
              <InstructorStats
                instructor={instructors.find(i => i.id === selectedInstructor)}
                assignedClassesCount={getAssignedClassesCount(selectedInstructor)}
                workloadPercentage={getWorkloadPercentage(selectedInstructor)}
                isMobile={false}
              />
            )}
          </div>
        )}
        
        {/* Availability Grid */}
        <div className="md:col-span-3 bg-gray-50 p-4 rounded-md">
          {selectedInstructor ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-700">
                  Availability for {instructors.find(i => i.id === selectedInstructor)?.name}
                </h3>
                
                {!isMobile && (
                  <button
                    onClick={saveAvailability}
                    className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Save Changes
                  </button>
                )}
              </div>
              
              <AvailabilityGrid
                instructor={instructors.find(i => i.id === selectedInstructor)}
                availabilityGrid={instructorAvailability}
                classTypeGrid={instructorClassTypes}
                isMobile={isMobile}
                daysOfWeek={DAYS_OF_WEEK}
                classTimes={CLASS_TIMES}
                onAvailabilityChange={handleAvailabilityChange}
                onClassTypeChange={handleClassTypeChange}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Select an instructor to manage their availability</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <EditInstructorModal
        isOpen={showEditModal}
        instructor={editingInstructor}
        classTypes={CLASS_TYPES}
        onChange={handleEditInstructorChange}
        onSave={saveInstructor}
        onClose={closeEditModal}
      />
      
      <DeleteInstructorModal
        isOpen={showDeleteModal}
        instructor={instructorToDelete}
        onConfirm={confirmDeleteInstructor}
        onCancel={closeDeleteModal}
      />
    </div>
  );
};

export default InstructorManagement;
