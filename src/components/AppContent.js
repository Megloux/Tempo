import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import InstructorRegistration from './InstructorRegistration';
import InstructorManagement from './instructors/InstructorManagement';
import LoadingSpinner from './LoadingSpinner';
import { useClassSchedule } from '../context/ClassScheduleContext';

const AppContent = ({ activeTab, setActiveTab }) => {
  const { loading, error } = useClassSchedule();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-dark-card border border-boxing/30 text-boxing px-6 py-5 rounded-xl shadow-card" role="alert">
          <div className="flex items-center gap-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <strong className="font-bold text-xl">Error Encountered</strong>
          </div>
          <p className="text-boxing/90 mb-3">{error}</p>
          <p className="text-sm text-white/70">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/instructors" element={<InstructorManagement />} />
          <Route path="/register" element={<InstructorRegistration />} />
        </Routes>
      </div>
    </div>
  );
};

export default AppContent;
