import React, { useState, useEffect } from 'react';
import { useClassSchedule } from '../context/ClassScheduleContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { 
    schedule, 
    instructors, 
    CLASS_TYPES, 
    DAYS_OF_WEEK, 
    CLASS_TIMES,
    addClass, 
    removeClass,
    clearSchedule, 
    addPredefinedClasses, 
    generateSchedule,
    getTotalAssignedClasses,
    getTotalScheduledSlots,
    lockAssignment,
    unlockAssignment,
    isAssignmentLocked,
    manuallyAssignInstructor
  } = useClassSchedule();
  
  const [selectedClassType, setSelectedClassType] = useState('all');
  const [selectedInstructorForChart, setSelectedInstructorForChart] = useState('');
  const [newClass, setNewClass] = useState({
    day: 'Mon',
    type: 'Lagree',
    time: '5:30 AM'
  });
  
  // Initialize schedule with predefined classes if empty
  useEffect(() => {
    if (getTotalScheduledSlots() === 0) {
      addPredefinedClasses();
    }
  }, [addPredefinedClasses, getTotalScheduledSlots]);
  
  // Force re-render when schedule changes
  const [refreshKey, setRefreshKey] = useState(0);
  
  // This effect will trigger a re-render whenever the schedule changes
  useEffect(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, [schedule]);
  
  const handleClassInputChange = (e) => {
    const { name, value } = e.target;
    setNewClass({ ...newClass, [name]: value });
  };
  
  const addNewClass = () => {
    const { day, type, time } = newClass;
    addClass(day, type, time);
  };
  
  // State for manual assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  
  // Get instructor name by ID
  const getInstructorName = (id) => {
    if (id === 'TBD') return 'TBD';
    const instructor = instructors.find(i => i.id === id);
    return instructor ? instructor.name : id;
  };
  
  // Open assignment modal for a class
  const openAssignModal = (day, type, time, currentInstructorId) => {
    setSelectedClass({ day, type, time });
    setSelectedInstructorId(currentInstructorId === 'TBD' ? '' : currentInstructorId);
    setShowAssignModal(true);
  };
  
  // Close assignment modal
  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedClass(null);
    setSelectedInstructorId('');
  };
  
  // Function moved to avoid duplication
  
  // Handle manual instructor assignment
  const handleManualAssign = () => {
    if (selectedClass && (selectedInstructorId || selectedInstructorId === 'TBD')) {
      manuallyAssignInstructor(
        selectedClass.day, 
        selectedClass.type, 
        selectedClass.time, 
        selectedInstructorId || 'TBD'
      );
      closeAssignModal();
    }
  };
  
  // Handle class deletion
  const handleDeleteClass = () => {
    if (selectedClass) {
      removeClass(selectedClass.day, selectedClass.type, selectedClass.time);
      closeAssignModal();
    }
  };
  
  // Add 10:30 AM Lagree classes to all weekdays
  // 10:30 AM classes have been permanently added to the schedule
  
  // Get class type color for the main schedule view
  const getClassTypeColor = (type) => {
    switch(type) {
      case 'Lagree':
        return 'bg-green-100 text-green-800';
      case 'Strength':
        return 'bg-blue-100 text-blue-800';
      case 'Boxing':
        return 'bg-red-100 text-red-800';
      case 'Stretch':
        return 'bg-yellow-100 text-yellow-800';
      case 'PT':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get instructor-specific background color for the Lagree-only view
  const getInstructorBgColor = (instructorId) => {
    if (!instructorId || instructorId === 'TBD') return 'bg-gray-100 text-gray-800';
    
    switch(instructorId) {
      case 'DB': // Dayron - grey
        return 'bg-gray-200 text-gray-800';
      case 'MH': // Michelle - pale red
        return 'bg-red-100 text-red-800';
      case 'AK': // Allison - yellow
        return 'bg-yellow-100 text-yellow-800';
      case 'AD': // Aseel - purple
        return 'bg-purple-100 text-purple-800';
      case 'TS': // Taylor - light green
        return 'bg-green-100 text-green-800';
      case 'MB': // Megan - orange
        return 'bg-orange-100 text-orange-800';
      case 'EF': // Erin - teal
        return 'bg-teal-100 text-teal-800';
      case 'SS': // Sandhya - pink
        return 'bg-pink-100 text-pink-800';
      case 'JD': // Jess - blue
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get header background color for class type
  const getHeaderColor = (type) => {
    switch(type) {
      case 'Lagree':
        return 'bg-green-200';
      case 'Strength':
        return 'bg-blue-200';
      case 'Boxing':
        return 'bg-red-200';
      case 'Stretch':
        return 'bg-yellow-200';
      case 'PT':
        return 'bg-purple-200';
      default:
        return 'bg-gray-200';
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
    DAYS_OF_WEEK.forEach(day => {
      CLASS_TYPES.forEach(type => {
        CLASS_TIMES.forEach(time => {
          const instructorId = schedule[day]?.[type]?.[time];
          if (instructorId && instructorId !== 'TBD' && workload[instructorId]) {
            workload[instructorId].total += 1;
            workload[instructorId][type] += 1;
          }
        });
      });
    });
    
    return Object.values(workload).sort((a, b) => b.total - a.total);
  };
  
  const getClassTypeDistribution = () => {
    const distribution = {};
    
    // Initialize counters for each class type
    CLASS_TYPES.forEach(type => {
      distribution[type] = {
        name: type,
        count: 0,
        color: getChartColor(type)
      };
    });
    
    // Count classes by type
    DAYS_OF_WEEK.forEach(day => {
      CLASS_TYPES.forEach(type => {
        CLASS_TIMES.forEach(time => {
          if (schedule[day]?.[type]?.[time]) {
            distribution[type].count += 1;
          }
        });
      });
    });
    
    return Object.values(distribution);
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
    
    // Count classes by day and type
    DAYS_OF_WEEK.forEach(day => {
      CLASS_TYPES.forEach(type => {
        CLASS_TIMES.forEach(time => {
          const assignedInstructorId = schedule[day]?.[type]?.[time];
          if (assignedInstructorId === instructorId) {
            dayWorkload[day].total += 1;
            dayWorkload[day][type] += 1;
          }
        });
      });
    });
    
    // Convert to array format for charts
    return Object.entries(dayWorkload).map(([day, counts]) => ({
      day,
      ...counts
    }));
  };

  // Get eligible instructors for a class type
  const getEligibleInstructors = (classType) => {
    return [
      { id: 'TBD', name: 'To Be Determined' },
      ...instructors.filter(instructor => instructor.classTypes.includes(classType))
    ];
  };
  
  return (
    <div>
      {/* Dashboard Overview */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg shadow">
          <h3 className="font-semibold text-blue-800 mb-2">Total Classes</h3>
          <p className="text-3xl font-bold">{getTotalScheduledSlots()}</p>
          <p className="text-sm text-blue-600">Available slots this week</p>
        </div>
        
        <div className="bg-green-100 p-4 rounded-lg shadow">
          <h3 className="font-semibold text-green-800 mb-2">Instructors</h3>
          <p className="text-3xl font-bold">{instructors.length}</p>
          <p className="text-sm text-green-600">Active instructors</p>
        </div>
        
        <div className="bg-purple-100 p-4 rounded-lg shadow">
          <h3 className="font-semibold text-purple-800 mb-2">Classes Assigned</h3>
          <p className="text-3xl font-bold">{getTotalAssignedClasses()}</p>
          <p className="text-sm text-purple-600">Filled instructor slots</p>
        </div>
      </div>
      
      {/* Schedule Controls */}
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={() => generateSchedule()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Generate Schedule
        </button>
        <button 
          onClick={() => clearSchedule()}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Clear Schedule
        </button>
      </div>
      
      {/* Add New Class Form */}
      <div className="mb-8 bg-gray-100 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Add New Class</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-1">Day:</label>
            <select
              name="day"
              value={newClass.day}
              onChange={handleClassInputChange}
              className="w-full p-2 border rounded"
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Class Type:</label>
            <select
              name="type"
              value={newClass.type}
              onChange={handleClassInputChange}
              className="w-full p-2 border rounded"
            >
              {CLASS_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Time:</label>
            <select
              name="time"
              value={newClass.time}
              onChange={handleClassInputChange}
              className="w-full p-2 border rounded"
            >
              {CLASS_TIMES.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={addNewClass} 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
            >
              Add Class
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          This will add a new class to the schedule. You can later assign instructors by generating the schedule or manually.
        </p>
      </div>
      
      {/* Schedule Visualization */}
      <div className="mb-6 overflow-x-auto" key={`schedule-viz-${refreshKey}`}>
        <h2 className="text-xl font-semibold mb-4">Schedule Visualization</h2>
        <table className="min-w-full bg-white border rounded-lg shadow-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border sticky left-0 bg-white z-10">Time</th>
              {DAYS_OF_WEEK.map(day => (
                <th key={day} className="p-2 border">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLASS_TIMES.map(time => (
              <tr key={time} className="hover:bg-gray-50">
                <td className="p-2 border font-medium sticky left-0 bg-white z-10">{time}</td>
                {DAYS_OF_WEEK.map(day => (
                  <td key={`${day}-${time}`} className="p-2 border relative min-w-[120px]">
                    <div className="flex flex-col gap-1">
                      {CLASS_TYPES.map(type => {
                        const instructorId = schedule[day]?.[type]?.[time];
                        if (!instructorId) return null;
                        
                        return (
                          <div 
                            key={`${day}-${time}-${type}`}
                            className={`${getClassTypeColor(type)} p-1 rounded text-xs font-medium relative`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{type}</span>
                              <div className="flex items-center gap-1">
                                {instructorId !== 'TBD' && (
                                  <>
                                    <span className="font-bold">{instructorId}</span>
                                    {isAssignmentLocked(day, type, time) ? (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          unlockAssignment(day, type, time);
                                        }}
                                        className="text-xs bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-gray-600"
                                        title="Unlock this assignment"
                                      >
                                        🔒
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          lockAssignment(day, type, time);
                                        }}
                                        className="text-xs bg-gray-400 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-gray-600"
                                        title="Lock this assignment"
                                      >
                                        🔓
                                      </button>
                                    )}
                                  </>
                                )}
                                {instructorId === 'TBD' && (
                                  <span className="italic">TBD</span>
                                )}
                              </div>
                            </div>
                            <div 
                              className="absolute inset-0 cursor-pointer"
                              onClick={() => openAssignModal(day, type, time, instructorId)}
                              title="Click to assign instructor"
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Schedule Filter */}
      <div className="flex mb-4">
        <div className="mr-2">
          <select 
            className="border p-2 rounded"
            value={selectedClassType}
            onChange={(e) => setSelectedClassType(e.target.value)}
          >
            <option value="all">All Class Types</option>
            {CLASS_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Export Schedule
          </button>
        </div>
      </div>
      
      {/* Individual Class Type Schedules */}
      <div className="space-y-8" key={`class-schedules-${refreshKey}`}>
        {(selectedClassType === 'all' ? CLASS_TYPES : [selectedClassType]).map((type) => (
          <div key={type} className="border rounded-lg overflow-hidden shadow-sm">
            <div className={`p-3 ${getHeaderColor(type)}`}>
              {type} Classes
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-3 border">Time</th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th key={day} className="py-2 px-3 border">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CLASS_TIMES.map((time) => (
                    <tr key={time} className="hover:bg-gray-50">
                      <td className="py-2 px-3 border font-medium">{time}</td>
                      {DAYS_OF_WEEK.map((day) => (
                        <td key={day} className="py-2 px-3 border">
                          {schedule[day]?.[type]?.[time] ? (
                            <div 
                              className={`p-1 rounded text-center ${type === 'Lagree' ? getInstructorBgColor(schedule[day][type][time]) : getClassTypeColor(type)} cursor-pointer hover:opacity-80`}
                              onClick={() => openAssignModal(day, type, time, schedule[day][type][time])}
                              title="Click to reassign instructor"
                            >
                              {getInstructorName(schedule[day][type][time])}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      
      {/* Manual Assignment Modal */}
      {showAssignModal && selectedClass && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Assign Instructor for {selectedClass.type} Class
            </h3>
            <p className="mb-4 text-gray-600">
              {selectedClass.day} at {selectedClass.time}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Instructor:</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
              >
                <option value="">-- Select an Instructor --</option>
                {getEligibleInstructors(selectedClass.type).map(instructor => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name} ({instructor.id})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={handleDeleteClass}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Class
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={closeAssignModal}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAssign}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!selectedInstructorId}
                >
                  Assign Instructor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Schedule Analytics */}
      <div className="mt-12 mb-8" key={`analytics-${refreshKey}`}>
        <h2 className="text-2xl font-bold mb-6">Schedule Analytics</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Instructor Load Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Instructor Load Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getInstructorWorkload()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis label={{ value: 'Number of Classes', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#6366F1" name="Total Classes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Class Distribution by Type */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Class Distribution by Type</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getClassTypeDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getClassTypeDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Instructor Class Load by Type */}
          <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Instructor Class Load by Type</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getInstructorWorkload()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis label={{ value: 'Number of Classes', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Lagree" stackId="a" fill={getChartColor('Lagree')} name="Lagree Classes" />
                  <Bar dataKey="Strength" stackId="a" fill={getChartColor('Strength')} name="Strength Classes" />
                  <Bar dataKey="Boxing" stackId="a" fill={getChartColor('Boxing')} name="Boxing Classes" />
                  <Bar dataKey="Stretch" stackId="a" fill={getChartColor('Stretch')} name="Stretch Classes" />
                  <Bar dataKey="PT" stackId="a" fill={getChartColor('PT')} name="PT Classes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Classes by Day of Week - Instructor Selector */}
          <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Classes by Day of Week</h3>
              <select 
                className="border p-2 rounded"
                value={selectedInstructorForChart || ''}
                onChange={(e) => setSelectedInstructorForChart(e.target.value)}
              >
                <option value="">-- Select Instructor --</option>
                {instructors.map(instructor => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedInstructorForChart ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getClassesByDayOfWeek(selectedInstructorForChart)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis label={{ value: 'Number of Classes', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#6366F1" name="Total Classes" />
                    <Bar dataKey="Lagree" fill={getChartColor('Lagree')} name="Lagree Classes" />
                    <Bar dataKey="Strength" fill={getChartColor('Strength')} name="Strength Classes" />
                    <Bar dataKey="Boxing" fill={getChartColor('Boxing')} name="Boxing Classes" />
                    <Bar dataKey="Stretch" fill={getChartColor('Stretch')} name="Stretch Classes" />
                    <Bar dataKey="PT" fill={getChartColor('PT')} name="PT Classes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Select an instructor to view their classes by day of week</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
