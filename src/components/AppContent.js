import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import InstructorRegistration from './InstructorRegistration';
import InstructorManagement from './InstructorManagement';
import LoadingSpinner from './LoadingSpinner';
import { useClassSchedule } from '../context/ClassScheduleContext';

const AppContent = ({ activeTab, setActiveTab }) => {
  const { loading, error } = useClassSchedule();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <p className="mt-2">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/instructors" element={<InstructorManagement />} />
        <Route path="/register" element={<InstructorRegistration />} />
      </Routes>
    </div>
  );
};

export default AppContent;
