import React, { useState, useContext, useEffect, useRef } from 'react';
import { useClassSchedule, ClassScheduleContext } from '../context/ClassScheduleContext';
import InstructorManagement from './instructors/InstructorManagement';
import ExportToExcel from './ExportToExcel';
import SupabaseDebug from './SupabaseDebug';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

// Instructor colors for individual class schedule views
const INSTRUCTOR_COLORS = {
  'DB': { bg: 'bg-red-600/10', text: 'text-red-600' },         // Dayron - Red
  'MH': { bg: 'bg-blue-600/10', text: 'text-blue-600' },        // Michelle - Blue
  'AK': { bg: 'bg-green-600/10', text: 'text-green-600' },       // Allison - Green
  'AD': { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },      // Aseel - Yellow
  'TS': { bg: 'bg-fuchsia-600/10', text: 'text-fuchsia-600' },     // Taylor - Magenta
  'MB': { bg: 'bg-teal-500/10', text: 'text-teal-500' },        // Megan - Teal
  'JD': { bg: 'bg-sky-500/10', text: 'text-sky-500' },         // Jess - Sky Blue
  'EF': { bg: 'bg-purple-600/10', text: 'text-purple-600' },      // Erin - Purple
  'SS': { bg: 'bg-pink-500/10', text: 'text-pink-500' },        // Sandhya - Pink
  'TBD': { bg: 'bg-gray-500/10', text: 'text-gray-500' },       // TBD - Grey
  'AWD3': { bg: 'bg-white/10', text: 'text-white' }          // Alternate - White
};

const Dashboard = () => {
  const { 
    schedule, 
    instructors, 
    addClass, 
    removeClass,
    clearSchedule, 
    addPredefinedClasses, 
    generateSchedule,
    manuallyAssignInstructor,
    DAYS_OF_WEEK, 
    CLASS_TYPES,
    CLASS_TIMES,
    VALID_CLASS_SLOTS,
    isValidClassSlot,
    convertTimeToMinutes,
    getTotalAssignedClasses,
    getTotalScheduledSlots,
    lockAssignment,
    unlockAssignment,
    isAssignmentLocked
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
  
  const exportToExcel = () => {
    // Create instructor color mapping for consistent colors
    const instructorColors = {};
    const colorPalette = [
      { bg: 'FFD4E5F7', font: '000000' }, // Light blue
      { bg: 'FFD4F7E5', font: '000000' }, // Light green
      { bg: 'FFF7E5D4', font: '000000' }, // Light orange
      { bg: 'FFE5D4F7', font: '000000' }, // Light purple
      { bg: 'FFF7D4E5', font: '000000' }, // Light pink
      { bg: 'FFE5F7D4', font: '000000' }, // Light lime
      { bg: 'FFDAE8FC', font: '000000' }, // Lighter blue
      { bg: 'FFFCDAE8', font: '000000' }  // Lighter pink
    ];
    
    let colorIndex = 0;
    instructors.forEach(instructor => {
      instructorColors[instructor.id] = colorPalette[colorIndex % colorPalette.length];
      colorIndex++;
    });
    
    // Create a workbook with separate sheets for All Classes, Lagree, and Strength
    const wb = XLSX.utils.book_new();
    
    // Function to create a sheet for a specific class type or all classes
    const createSheet = (classTypeFilter = null) => {
      const sheetName = classTypeFilter || 'All Classes';
      const exportData = [];
      
      // Header row with days
      const headerRow = ['Time', ...DAYS_OF_WEEK];
      exportData.push(headerRow);
      
      // Get all scheduled time slots
      const scheduledTimeSlots = getScheduledTimeSlots();
      
      // For each time slot
      scheduledTimeSlots.forEach(time => {
        // We'll create multiple rows if needed for this time slot
        // First, determine the maximum number of classes at this time for any day
        let maxClassesPerDay = 0;
        
        DAYS_OF_WEEK.forEach(day => {
          // Count classes at this time slot for this day
          const classCount = CLASS_TYPES.filter(type => {
            // If we're filtering by class type, only count that type
            if (classTypeFilter && type !== classTypeFilter) return false;
            
            const instructorId = schedule[day]?.[type]?.[time];
            return instructorId !== undefined && instructorId !== null;
          }).length;
          
          maxClassesPerDay = Math.max(maxClassesPerDay, classCount);
        });
        
        // Now create rows for this time slot (one class per row)
        for (let rowIndex = 0; rowIndex < maxClassesPerDay; rowIndex++) {
          const row = rowIndex === 0 ? [time] : [''];
          
          // For each day of the week
          DAYS_OF_WEEK.forEach(day => {
            // Get classes for this day and time
            const classesAtTime = CLASS_TYPES.filter(type => {
              // If we're filtering by class type, only include that type
              if (classTypeFilter && type !== classTypeFilter) return false;
              
              const instructorId = schedule[day]?.[type]?.[time];
              return instructorId !== undefined && instructorId !== null;
            }).map(type => {
              const instructorId = schedule[day]?.[type]?.[time];
              
              // Get instructor name
              const instructor = instructors.find(i => i.id === instructorId) || {};
              const instructorName = instructorId === 'TBD' ? 'TBD' : instructor.name || instructorId;
              
              return { type, instructorId, instructorName };
            });
            
            // Add the class at this row index, or empty cell if none
            if (rowIndex < classesAtTime.length) {
              const classInfo = classesAtTime[rowIndex];
              row.push(`${classInfo.type} - ${classInfo.instructorName}`);
            } else {
              row.push('');
            }
          });
          
          exportData.push(row);
        }
      });
      
      // Create a worksheet
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      
      // Set column widths for better readability
      const colWidths = [
        {wch: 10}, // Time column
        {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20} // Day columns
      ];
      ws['!cols'] = colWidths;
      
      // Add cell styling for instructor colors
      if (ws['!ref']) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        
        // Start from row 1 (skip header)
        for (let R = 1; R <= range.e.r; ++R) {
          // Start from column 1 (skip time column)
          for (let C = 1; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
            const cellValue = ws[cellAddress]?.v;
            
            if (cellValue) {
              // Extract instructor ID from cell value
              const parts = cellValue.split(' - ');
              if (parts.length === 2) {
                const instructorName = parts[1];
                const instructor = instructors.find(i => 
                  i.name === instructorName || i.id === instructorName
                );
                
                if (instructor && instructorColors[instructor.id]) {
                  // Apply color styling based on instructor
                  const color = instructorColors[instructor.id];
                  if (!ws[cellAddress].s) ws[cellAddress].s = {};
                  ws[cellAddress].s.fill = { fgColor: { rgb: color.bg } };
                  ws[cellAddress].s.font = { color: { rgb: color.font } };
                }
              }
            }
          }
        }
      }
      
      return { name: sheetName, worksheet: ws };
    };
    
    // Create sheets for all classes and specific class types
    const allClassesSheet = createSheet();
    const lagreeSheet = createSheet('Lagree');
    const strengthSheet = createSheet('Strength');
    
    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, allClassesSheet.worksheet, allClassesSheet.name);
    XLSX.utils.book_append_sheet(wb, lagreeSheet.worksheet, lagreeSheet.name);
    XLSX.utils.book_append_sheet(wb, strengthSheet.worksheet, strengthSheet.name);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, 'Tempo_Fitness_Schedule.xlsx');
  };
  
  // Get all unique time slots that have valid classes across all days and types
  const getScheduledTimeSlots = () => {
    // Use VALID_CLASS_SLOTS as the source of truth for which time slots should exist
    const allTimeSlots = new Set();
    
    // Loop through all days and class types to find valid time slots
    DAYS_OF_WEEK.forEach(day => {
      CLASS_TYPES.forEach(type => {
        // Get the valid time slots for this day and type from our source of truth
        if (VALID_CLASS_SLOTS[day]?.[type]) {
          // Add all valid times for this day and type
          VALID_CLASS_SLOTS[day][type].forEach(time => {
            allTimeSlots.add(time);
          });
        }
      });
    });
    
    // Convert to array and sort by time
    return Array.from(allTimeSlots).sort((a, b) => {
      // Convert times to minutes for proper sorting
      return convertTimeToMinutes(a) - convertTimeToMinutes(b);
    });
  };
  
  // Get the filtered list of time slots that have scheduled classes
  const scheduledTimeSlots = getScheduledTimeSlots();
  
  const handleClassInputChange = (e) => {
    const { name, value } = e.target;
    setNewClass({ ...newClass, [name]: value });
  };
  
  const addNewClass = () => {
    const { day, type, time } = newClass;
    console.log(`Adding new class: ${day} ${time} ${type} with force override`);
    addClass(day, type, time, 'TBD', true); // Always use force override for manual class additions
  };
  
  // State for manual assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [forceOverride, setForceOverride] = useState(false);
  
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
    setForceOverride(false); // Reset force override state
  };
  
  // Function moved to avoid duplication
  
  // Handle manual instructor assignment
  const handleManualAssign = () => {
    if (selectedClass && (selectedInstructorId || selectedInstructorId === 'TBD')) {
      // Always use force override for manual assignments
      console.log(`Manual assignment - always using force override`);
      console.log(`Assigning ${selectedInstructorId} to ${selectedClass.day} ${selectedClass.time} ${selectedClass.type}`);
      
      manuallyAssignInstructor(
        selectedClass.day, 
        selectedClass.type, 
        selectedClass.time, 
        selectedInstructorId || 'TBD',
        true // Always force override for manual assignments
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
    <div className="text-white">
      {/* Dashboard Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2 tracking-tight">FITNESS SCHEDULER</h1>
        <p className="text-white/60 text-lg">Manage your studio's class schedule with precision</p>
      </div>
      
      {/* Dashboard Overview */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-glass p-6 relative overflow-hidden group transition-all duration-300 hover:translate-y-[-5px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-turquoise/10 rounded-full -mr-10 -mt-10 z-0"></div>
          <div className="relative z-10">
            <h3 className="font-semibold text-white/80 mb-1 text-sm uppercase tracking-wider">Total Classes</h3>
            <p className="text-5xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">{getTotalScheduledSlots()}</p>
            <p className="text-sm text-white/60">Available slots this week</p>
          </div>
        </div>
        
        <div className="card-glass p-6 relative overflow-hidden group transition-all duration-300 hover:translate-y-[-5px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue/10 rounded-full -mr-10 -mt-10 z-0"></div>
          <div className="relative z-10">
            <h3 className="font-semibold text-white/80 mb-1 text-sm uppercase tracking-wider">Instructors</h3>
            <p className="text-5xl font-bold mb-2 bg-gradient-secondary bg-clip-text text-transparent">{instructors.length}</p>
            <p className="text-sm text-white/60">Active instructors</p>
          </div>
        </div>
        
        <div className="card-glass p-6 relative overflow-hidden group transition-all duration-300 hover:translate-y-[-5px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-green/10 rounded-full -mr-10 -mt-10 z-0"></div>
          <div className="relative z-10">
            <h3 className="font-semibold text-white/80 mb-1 text-sm uppercase tracking-wider">Classes Assigned</h3>
            <p className="text-5xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">{getTotalAssignedClasses()}</p>
            <p className="text-sm text-white/60">Filled instructor slots</p>
          </div>
        </div>
      </div>
      
      {/* Schedule Controls */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={() => generateSchedule()}
          className="btn-primary flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Generate Schedule
        </button>
        <button 
          onClick={() => clearSchedule()}
          className="btn-outline flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Clear Schedule
        </button>
      </div>
      
      {/* Add New Class Form */}
      <div className="mb-10 card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Add New Class</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Day</label>
            <select
              name="day"
              value={newClass.day}
              onChange={handleClassInputChange}
              className="select-field w-full"
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Class Type</label>
            <select
              name="type"
              value={newClass.type}
              onChange={handleClassInputChange}
              className="select-field w-full"
            >
              {CLASS_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Time</label>
            <select
              name="time"
              value={newClass.time}
              onChange={handleClassInputChange}
              className="select-field w-full"
            >
              {CLASS_TIMES.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={addNewClass} 
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Class
            </button>
          </div>
        </div>
        <p className="text-sm text-white/50">
          This will add a new class to the schedule. You can later assign instructors by generating the schedule or manually.
        </p>
      </div>
      
      {/* Schedule Visualization */}
      <div className="mb-10" key={`schedule-viz-${refreshKey}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Schedule Visualization</h2>
          </div>
        </div>
        
        <div className="card overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="py-4 px-4 sticky left-0 bg-dark-card z-10 text-white/70 font-medium text-left">Time</th>
                {DAYS_OF_WEEK.map(day => (
                  <th key={day} className="py-4 px-4 text-white/70 font-medium text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduledTimeSlots.map(time => (
                <tr key={time} className="border-b border-dark-border/50 hover:bg-dark-hover/30 transition-colors">
                  <td className="py-3 px-4 font-medium sticky left-0 bg-dark-card z-10 text-white">{time}</td>
                  {DAYS_OF_WEEK.map(day => (
                    <td key={`${day}-${time}`} className="py-3 px-2 relative min-w-[130px]">
                      <div className="flex flex-col gap-2">
                        {CLASS_TYPES.map(type => {
                          const instructorId = schedule[day]?.[type]?.[time];
                          if (!instructorId) return null;
                          
                          // Get the appropriate background color based on class type
                          const bgColorClass = type === 'Lagree' ? 'bg-lagree/10 border-lagree/30' : 
                                              type === 'Strength' ? 'bg-strength/10 border-strength/30' : 
                                              type === 'Boxing' ? 'bg-boxing/10 border-boxing/30' : 
                                              type === 'Stretch' ? 'bg-stretch/10 border-stretch/30' : 
                                              'bg-pt/10 border-pt/30';
                          
                          // Get the appropriate text color based on class type
                          const textColorClass = type === 'Lagree' ? 'text-lagree' : 
                                               type === 'Strength' ? 'text-strength' : 
                                               type === 'Boxing' ? 'text-boxing' : 
                                               type === 'Stretch' ? 'text-stretch' : 
                                               'text-pt';
                          
                          return (
                            <div 
                              key={`${day}-${time}-${type}`}
                              className={`${bgColorClass} border p-2 rounded-lg ${textColorClass} text-sm font-medium relative backdrop-blur-sm transition-all duration-200 hover:scale-105`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold">{type}</span>
                                <div className="flex items-center gap-2">
                                  {instructorId !== 'TBD' && (
                                    <>
                                      <span className="font-medium text-white">{instructorId}</span>
                                      {isAssignmentLocked(day, type, time) ? (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            unlockAssignment(day, type, time);
                                          }}
                                          className="text-xs bg-dark-border text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-dark-hover transition-colors"
                                          title="Unlock this assignment"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            lockAssignment(day, type, time);
                                          }}
                                          className="text-xs bg-dark-border/50 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-dark-hover transition-colors"
                                          title="Lock this assignment"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                                          </svg>
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {instructorId === 'TBD' && (
                                    <span className="text-white/50 italic">TBD</span>
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
      </div>
      
      {/* Schedule Filter */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="flex items-center bg-dark-surface rounded-full px-2 border border-dark-border">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          <select 
            className="bg-transparent text-white py-2 px-3 focus:outline-none select-field border-0"
            value={selectedClassType}
            onChange={(e) => setSelectedClassType(e.target.value)}
          >
            <option value="all" className="bg-dark-surface text-white">All Class Types</option>
            {CLASS_TYPES.map(type => (
              <option key={type} value={type} className="bg-dark-surface text-white">{type}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={exportToExcel}
          className="btn-outline flex items-center gap-2 py-2 px-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export Schedule
        </button>
      </div>
      
      {/* Individual Class Type Schedules */}
      <div className="space-y-10" key={`class-schedules-${refreshKey}`}>
        {(selectedClassType === 'all' ? CLASS_TYPES : [selectedClassType]).map((type) => {
          // Get the appropriate gradient based on class type
          const headerGradient = type === 'Lagree' ? 'from-lagree/20 to-transparent' : 
                               type === 'Strength' ? 'from-strength/20 to-transparent' : 
                               type === 'Boxing' ? 'from-boxing/20 to-transparent' : 
                               type === 'Stretch' ? 'from-stretch/20 to-transparent' : 
                               'from-pt/20 to-transparent';
          
          // Get the appropriate text color based on class type
          const headerTextColor = type === 'Lagree' ? 'text-lagree' : 
                                type === 'Strength' ? 'text-strength' : 
                                type === 'Boxing' ? 'text-boxing' : 
                                type === 'Stretch' ? 'text-stretch' : 
                                'text-pt';
          
          return (
            <div key={type} className="card overflow-hidden">
              <div className={`p-5 bg-gradient-to-r ${headerGradient} border-b border-dark-border flex items-center gap-3`}>
                <h3 className={`text-lg font-bold ${headerTextColor}`}>{type} Classes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-dark-border/50">
                      <th className="py-3 px-4 text-white/70 font-medium text-left">Time</th>
                      {DAYS_OF_WEEK.map((day) => (
                        <th key={day} className="py-3 px-4 text-white/70 font-medium text-center">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CLASS_TIMES.map((time) => (
                      <tr key={time} className="border-b border-dark-border/30 hover:bg-dark-hover/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-white">{time}</td>
                        {DAYS_OF_WEEK.map((day) => {
                          const instructorId = schedule[day]?.[type]?.[time];
                          const hasClass = !!instructorId;
                                                    // Get the appropriate background color based on instructor
                           let bgClass = 'bg-dark-hover/30';
                           let textClass = 'text-white/70';
                           
                           if (hasClass) {
                             if (instructorId === 'TBD') {
                               // For TBD, use grey
                               bgClass = INSTRUCTOR_COLORS['TBD'].bg;
                               textClass = INSTRUCTOR_COLORS['TBD'].text;
                             } else if (instructorId.startsWith('AWD')) {
                               // For Alternate Weekend DM, use white
                               bgClass = INSTRUCTOR_COLORS['AWD3'].bg;
                               textClass = INSTRUCTOR_COLORS['AWD3'].text;
                             } else if (INSTRUCTOR_COLORS[instructorId]) {
                               // Use instructor-specific colors if available
                               bgClass = INSTRUCTOR_COLORS[instructorId].bg;
                               textClass = INSTRUCTOR_COLORS[instructorId].text;
                             } else {
                               // Fallback to class type colors
                               bgClass = `bg-${type.toLowerCase()}/10 border-${type.toLowerCase()}/30`;
                               textClass = 'text-white';
                             }
                           }
                          
                          return (
                            <td key={day} className="py-3 px-4 text-center">
                              {hasClass ? (
                                <div 
                                  className={`${bgClass} border rounded-lg py-2 px-3 ${textClass} cursor-pointer transition-all duration-200 hover:scale-105`}
                                  onClick={() => openAssignModal(day, type, time, instructorId)}
                                  title="Click to reassign instructor"
                                >
                                  {getInstructorName(instructorId)}
                                </div>
                              ) : (
                                <span className="text-white/30">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Manual Assignment Modal */}
      {showAssignModal && selectedClass && (
        <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card-glass p-6 w-full max-w-md border border-dark-border/70 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Assign Instructor
                </h3>
                <p className="text-white/60 text-sm">
                  {selectedClass.type} Class • {selectedClass.day} at {selectedClass.time}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-2">Select Instructor</label>
              <select
                className="select-field w-full"
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
              >
                <option value="" className="bg-dark-surface text-white/50">-- Select an Instructor --</option>
                {getEligibleInstructors(selectedClass.type).map(instructor => (
                  <option key={instructor.id} value={instructor.id} className="bg-dark-surface text-white">
                    {instructor.name} ({instructor.id})
                  </option>
                ))}
              </select>
            </div>
            
            {/* No checkbox needed - manual changes are always overrides */}
            
            <div className="flex flex-wrap justify-between items-center gap-4">
              <button
                onClick={handleDeleteClass}
                className="flex items-center gap-2 btn-outline border-boxing/30 text-boxing hover:bg-boxing/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete Class
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={closeAssignModal}
                  className="btn-outline px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAssign}
                  className={`btn-primary px-4 py-2 flex items-center gap-2 ${!selectedInstructorId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!selectedInstructorId}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
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
          
          {/* Supabase Debug Panel */}
          <div className="mt-8 mb-4">
            <details className="bg-gray-800 rounded-lg">
              <summary className="p-4 text-white font-bold cursor-pointer">
                Data Sharing Diagnostics
              </summary>
              <div className="p-4">
                <SupabaseDebug />
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
