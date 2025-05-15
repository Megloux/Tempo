import React from 'react';

/**
 * InstructorList component for displaying all instructors in a table
 */
const InstructorList = ({
  instructors,
  onSelectInstructor,
  onEditInstructor,
  onDeleteInstructor,
  getWorkloadPercentage,
  getAssignedClassesCount
}) => {
  // Ensure instructors is always an array
  const safeInstructors = Array.isArray(instructors) ? instructors : [];
  
  // If no instructors, show a message
  if (safeInstructors.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-md">
        <p className="text-black font-medium mb-4">No instructors found.</p>
        <p className="text-sm text-black">Register new instructors using the Registration form.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="py-3 px-4 border-b text-black font-bold">ID</th>
            <th className="py-3 px-4 border-b text-black font-bold">Name</th>
            <th className="py-3 px-4 border-b text-black font-bold">Email</th>
            <th className="py-3 px-4 border-b text-black font-bold">Class Types</th>
            <th className="py-3 px-4 border-b text-black font-bold text-center">Block Size</th>
            <th className="py-3 px-4 border-b text-black font-bold text-center">Min Classes</th>
            <th className="py-3 px-4 border-b text-black font-bold text-center">Max Classes</th>
            <th className="py-3 px-4 border-b text-black font-bold">Workload</th>
            <th className="py-3 px-4 border-b text-black font-bold text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {safeInstructors.map(instructor => (
            <tr 
              key={instructor.id} 
              className="hover:bg-gray-50"
            >
              <td className="py-3 px-4 border-b cursor-pointer text-black" onClick={() => onSelectInstructor(instructor.id)}>
                {instructor.id}
              </td>
              <td className="py-3 px-4 border-b cursor-pointer text-black" onClick={() => onSelectInstructor(instructor.id)}>
                {instructor.name}
              </td>
              <td className="py-3 px-4 border-b cursor-pointer text-black" onClick={() => onSelectInstructor(instructor.id)}>
                {instructor.email}
              </td>
              <td className="py-3 px-4 border-b cursor-pointer text-black" onClick={() => onSelectInstructor(instructor.id)}>
                {instructor.classTypes.join(', ')}
              </td>
              <td className="py-3 px-4 border-b text-center cursor-pointer text-black" onClick={() => onSelectInstructor(instructor.id)}>
                {instructor.blockSize}
              </td>
              <td className="py-3 px-4 border-b text-center cursor-pointer text-black" onClick={() => onSelectInstructor(instructor.id)}>
                {instructor.minClasses}
              </td>
              <td className="py-3 px-4 border-b text-center cursor-pointer text-black" onClick={() => onSelectInstructor(instructor.id)}>
                {instructor.maxClasses}
              </td>
              <td className="py-3 px-4 border-b cursor-pointer text-black" onClick={() => onSelectInstructor(instructor.id)}>
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
                  <span className="ml-2 text-sm text-black font-medium">
                    {getAssignedClassesCount(instructor.id)}/{instructor.maxClasses}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 border-b text-center">
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditInstructor(instructor);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteInstructor(instructor);
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
  );
};

export default InstructorList;
