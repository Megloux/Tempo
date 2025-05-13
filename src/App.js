import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppContent from './components/AppContent';
import { ClassScheduleProvider } from './context/ClassScheduleContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <ClassScheduleProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-2xl font-bold text-indigo-600">Fitness Class Scheduler</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <Link 
                to="/" 
                className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'dashboard' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </Link>
              <Link 
                to="/instructors" 
                className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'instructors' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('instructors')}
              >
                Instructors
              </Link>
              <Link 
                to="/register" 
                className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'register' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('register')}
              >
                Instructor Registration
              </Link>
            </div>
          </div>
        </nav>

        {/* Use AppContent component to handle loading states */}
        <AppContent activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </ClassScheduleProvider>
  );
}

export default App;
