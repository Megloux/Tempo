import React from 'react';

/**
 * InstructorSelector component for selecting and managing instructors
 */
const InstructorSelector = ({
  instructors,
  selectedInstructorId,
  onSelectInstructor,
  onEditInstructor,
  onDeleteInstructor,
  onSaveAvailability,
  onUndoLastChange,
  getAssignedClassesCount,
  isMobile
}) => {
  return (
    <div className="space-y-3">
      <select
        className="w-full p-2 border rounded"
        value={selectedInstructorId}
        onChange={(e) => onSelectInstructor(e.target.value)}
      >
        <option value="">Select an instructor</option>
        {instructors.map(instructor => (
          <option key={instructor.id} value={instructor.id}>
            {instructor.name} ({getAssignedClassesCount(instructor.id)} classes)
          </option>
        ))}
      </select>
      
      {selectedInstructorId && (
        <div className={`${isMobile ? 'flex justify-between gap-2' : 'mt-4 space-y-3'}`}>
          {isMobile ? (
            // Mobile layout - horizontal buttons
            <>
              <button
                onClick={() => onEditInstructor(instructors.find(i => i.id === selectedInstructorId))}
                className="flex-1 py-2 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
              
              <button
                onClick={onSaveAvailability}
                className="flex-1 py-2 px-3 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Save
              </button>
              
              <button
                onClick={onUndoLastChange}
                className="flex-1 py-2 px-3 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
              >
                Undo
              </button>
            </>
          ) : (
            // Desktop layout - vertical buttons
            <>
              <button
                onClick={() => onEditInstructor(instructors.find(i => i.id === selectedInstructorId))}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Edit Instructor
              </button>
              
              <button
                onClick={onSaveAvailability}
                className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Save Changes
              </button>
              
              <button
                onClick={onUndoLastChange}
                className="w-full py-2 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Undo Last Change
              </button>
              
              <button
                onClick={() => onDeleteInstructor(instructors.find(i => i.id === selectedInstructorId))}
                className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete Instructor
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default InstructorSelector;
