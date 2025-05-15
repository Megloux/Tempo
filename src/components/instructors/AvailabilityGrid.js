import React from 'react';
import { getClassTypeColor, formatTime, formatDay, formatClassType } from './InstructorUtils';

/**
 * AvailabilityGrid component for displaying and editing instructor availability
 */
const AvailabilityGrid = ({
  instructor,
  availabilityGrid,
  classTypeGrid,
  isMobile,
  daysOfWeek,
  classTimes,
  onAvailabilityChange,
  onClassTypeChange
}) => {
  if (!instructor) {
    return (
      <div className="text-center py-8">
        <p className="text-black font-medium">Select an instructor to manage their availability</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="py-2 px-2 md:px-4 border-b text-xs md:text-sm font-bold text-black">Time</th>
            {daysOfWeek.map(day => (
              <th key={day} className="py-2 px-2 md:px-4 border-b text-xs md:text-sm font-bold text-black">
                {formatDay(day, isMobile)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classTimes.map(time => (
            <tr key={time}>
              <td className="py-1 md:py-2 px-2 md:px-4 border-b border-r font-medium text-xs md:text-sm text-black">
                {formatTime(time, isMobile)}
              </td>
              {daysOfWeek.map(day => {
                const isAvailable = availabilityGrid[day]?.[time] || false;
                const classType = classTypeGrid[day]?.[time] || '';
                
                return (
                  <td key={`${day}-${time}`} className="py-1 md:py-2 px-1 md:px-4 border-b border-r">
                    <div className="flex flex-col items-center space-y-1 md:space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isAvailable}
                          onChange={(e) => onAvailabilityChange(day, time, e.target.checked)}
                          className={`h-4 w-4 md:h-5 md:w-5 rounded border-2 ${getClassTypeColor(classType)}`}
                        />
                      </label>
                      
                      {isAvailable && (
                        <select
                          value={classType}
                          onChange={(e) => onClassTypeChange(day, time, e.target.value)}
                          className="text-xs p-1 border rounded w-full max-w-[80px] text-black"
                        >
                          {instructor.classTypes.map(type => (
                            <option key={type} value={type}>
                              {formatClassType(type, isMobile)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AvailabilityGrid;
