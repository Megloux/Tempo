import React from 'react';

/**
 * InstructorStats component for displaying instructor workload and statistics
 */
const InstructorStats = ({
  instructor,
  assignedClassesCount,
  workloadPercentage,
  isMobile
}) => {
  if (!instructor) return null;

  return (
    <div className={`${isMobile ? 'mt-2 p-3' : 'mt-6'} bg-gray-50 rounded-md`}>
      <h4 className="text-md font-semibold mb-2 text-blue-700">Instructor Stats</h4>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm">Assigned Classes:</span>
          <span className="font-semibold">{assignedClassesCount}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm">Workload:</span>
          <span className="font-semibold">{workloadPercentage}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              workloadPercentage > 90 ? 'bg-red-600' :
              workloadPercentage > 70 ? 'bg-yellow-500' :
              'bg-blue-600'
            }`}
            style={{ width: `${workloadPercentage}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm">Max Classes:</span>
          <span className="font-semibold">{instructor.maxClasses}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm">Class Types:</span>
          <span className="font-semibold text-xs">
            {instructor.classTypes.join(', ')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InstructorStats;
