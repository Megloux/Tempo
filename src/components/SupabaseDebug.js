import React, { useEffect, useState } from 'react';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useClassSchedule } from '../context/ClassScheduleContext';

const SupabaseDebug = () => {
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [dataStats, setDataStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // We need a reference to the ClassScheduleContext to load shared data
  // But we'll check if it exists first since the context might not be available in some components
  let classScheduleContext = null;
  try {
    classScheduleContext = useClassSchedule();
  } catch (e) {
    console.log('ClassScheduleContext not available in this component');
  }

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
    
    // Check for last sync timestamp
    const timestamp = localStorage.getItem('last_sync_timestamp');
    if (timestamp) {
      setLastSync(new Date(timestamp));
    }
  }, []);

  // Function to check Supabase connection
  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Checking Supabase connection...');
      
      // Try to connect to Supabase and check if our table exists
      const { data, error } = await supabase
        .from('tempo_app_data')
        .select('id, created_at')
        .order('id', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Connection error:', error);
        
        // Check if the error is because the table doesn't exist
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          setConnectionStatus('Connected, but table missing');
          setError(`The 'tempo_app_data' table doesn't exist. Please create it with columns: 'id' (int8, primary key) and 'data' (jsonb).`);
        } else {
          setConnectionStatus('Connection failed');
          setError(error.message);
        }
        return;
      }
      
      setConnectionStatus('Connected successfully');
      
      if (data && data.length > 0) {
        // Fetch the actual data to get stats
        const { data: fullData, error: dataError } = await supabase
          .from('tempo_app_data')
          .select('*')
          .order('id', { ascending: false })
          .limit(1);
        
        if (dataError) {
          console.error('Error fetching data:', dataError);
          setError(dataError.message);
          return;
        }
        
        if (fullData && fullData.length > 0 && fullData[0].data) {
          const appData = fullData[0].data;
          
          setDataStats({
            instructorsCount: appData.instructors?.length || 0,
            scheduleEntries: countScheduleEntries(appData.schedule),
            recordId: fullData[0].id,
            lastUpdated: appData.timestamp ? new Date(appData.timestamp) : null
          });
        }
      } else {
        setDataStats({
          instructorsCount: 0,
          scheduleEntries: 0,
          recordId: null,
          lastUpdated: null
        });
        setError('No data found in the table. Please sync data first.');
      }
    } catch (err) {
      console.error('Error checking connection:', err);
      setConnectionStatus('Connection error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to count schedule entries
  const countScheduleEntries = (scheduleData) => {
    if (!scheduleData) return 0;
    
    let count = 0;
    Object.keys(scheduleData).forEach(day => {
      Object.keys(scheduleData[day] || {}).forEach(type => {
        Object.keys(scheduleData[day][type] || {}).forEach(time => {
          if (scheduleData[day][type][time]) {
            count++;
          }
        });
      });
    });
    return count;
  };

  // Function to load shared data
  const loadSharedData = async () => {
    if (!classScheduleContext) {
      setError('Cannot load data: ClassScheduleContext not available');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading shared data from Supabase...');
      
      // Get the latest record
      const { data, error } = await supabase
        .from('tempo_app_data')
        .select('*')
        .order('id', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('No shared data found. Someone needs to sync data first.');
      }
      
      const appData = data[0].data;
      
      // Back up current data before loading new data
      try {
        const currentInstructors = localStorage.getItem('instructors');
        const currentSchedule = localStorage.getItem('schedule');
        const currentLocks = localStorage.getItem('lockedAssignments');
        
        if (currentInstructors) localStorage.setItem('instructors_before_load', currentInstructors);
        if (currentSchedule) localStorage.setItem('schedule_before_load', currentSchedule);
        if (currentLocks) localStorage.setItem('lockedAssignments_before_load', currentLocks);
        localStorage.setItem('data_load_timestamp', new Date().toISOString());
      } catch (e) {
        console.warn('Failed to back up data:', e);
        // Continue anyway
      }
      
      // Update localStorage with new data
      localStorage.setItem('instructors', JSON.stringify(appData.instructors || []));
      localStorage.setItem('schedule', JSON.stringify(appData.schedule || {}));
      localStorage.setItem('lockedAssignments', JSON.stringify(appData.lockedAssignments || {}));
      
      // If using ClassScheduleContext, update app state
      if (classScheduleContext) {
        // This will depend on your implementation of the updateFromExternalData method
        if (typeof classScheduleContext.updateScheduleFromExternalData === 'function') {
          await classScheduleContext.updateScheduleFromExternalData(appData);
        } else {
          // Fallback if method doesn't exist
          console.log('updateScheduleFromExternalData method not found, using setState methods');
          
          if (classScheduleContext.setInstructors) {
            classScheduleContext.setInstructors(appData.instructors || []);
          }
          
          if (classScheduleContext.setSchedule) {
            classScheduleContext.setSchedule(appData.schedule || {});
          }
          
          if (classScheduleContext.setLockedAssignments) {
            classScheduleContext.setLockedAssignments(appData.lockedAssignments || {});
          }
        }
      }
      
      setError(null);
      setConnectionStatus('Data loaded successfully');
      
      // Force page refresh to show the new data
      alert('Data loaded successfully! The page will refresh to show the changes.');
      window.location.reload();
      
    } catch (err) {
      console.error('Error loading shared data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 text-white rounded-lg p-4">
      <h3 className="text-lg font-bold mb-4">Supabase Connection Status</h3>
      
      <div className="mb-4">
        <span className="font-medium">Status: </span>
        <span className={connectionStatus.includes('success') ? 'text-green-400' : 'text-red-400'}>
          {connectionStatus}
        </span>
        
        <button
          onClick={checkConnection}
          className="ml-3 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>
      
      {dataStats && (
        <div className="mb-4 p-3 bg-gray-700/50 rounded">
          <h4 className="font-bold mb-2">Data Stats:</h4>
          <ul className="space-y-1 text-sm">
            <li>• Instructors: {dataStats.instructorsCount}</li>
            <li>• Schedule Entries: {dataStats.scheduleEntries}</li>
            {dataStats.lastUpdated && (
              <li>• Last Updated: {dataStats.lastUpdated.toLocaleString()}</li>
            )}
            {dataStats.recordId && (
              <li>• Record ID: {dataStats.recordId}</li>
            )}
          </ul>
        </div>
      )}
      
      {lastSync && (
        <div className="mb-4 p-3 bg-blue-900/30 rounded">
          <h4 className="font-bold mb-1">Your Last Sync:</h4>
          <p className="text-sm">{lastSync.toLocaleString()}</p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 rounded">
          <h4 className="font-bold mb-1">Error:</h4>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="mt-6 mb-2">
        <button
          onClick={loadSharedData}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || connectionStatus !== 'Connected successfully' || !dataStats}
        >
          {loading ? 'Loading...' : 'Load Shared Data'}
        </button>
        
        {!classScheduleContext && (
          <p className="text-red-300 text-sm mt-2">
            Warning: ClassScheduleContext not available. Some functionality may be limited.
          </p>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        <p className="font-medium mb-1">If you're having issues:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Check that tempo_app_data table exists in Supabase</li>
          <li>Verify that RLS policies allow all operations (using "true")</li>
          <li>Confirm environment variables are correctly set</li>
          <li>Make sure all users are using the same Supabase project</li>
        </ol>
      </div>
    </div>
  );
};

export default SupabaseDebug;
