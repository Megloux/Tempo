import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

// Admin password for data syncing - only admins should be able to push data
const ADMIN_PASSWORD = 'tempo2025';

const SyncButton = () => {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);
  
  const syncToSupabase = async () => {
    try {
      setSyncing(true);
      setMessage('Syncing data to Supabase...');
      setError(null);
      
      // Back up current data to localStorage first (safety measure)
      try {
        const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');
        const schedule = JSON.parse(localStorage.getItem('schedule') || '{}');
        const lockedAssignments = JSON.parse(localStorage.getItem('lockedAssignments') || '{}');
        
        localStorage.setItem('tempo_backup_instructors', JSON.stringify(instructors));
        localStorage.setItem('tempo_backup_schedule', JSON.stringify(schedule));
        localStorage.setItem('tempo_backup_locks', JSON.stringify(lockedAssignments));
        localStorage.setItem('tempo_backup_timestamp', new Date().toISOString());
        
        console.log('Created backup in localStorage before syncing');
      } catch (backupError) {
        console.warn('Failed to create backup:', backupError);
        // Continue anyway, this is just a precaution
      }
      
      // Get data from localStorage
      const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');
      const schedule = JSON.parse(localStorage.getItem('schedule') || '{}');
      const lockedAssignments = JSON.parse(localStorage.getItem('lockedAssignments') || '{}');
      
      // Package the data
      const appData = {
        instructors,
        schedule,
        lockedAssignments,
        timestamp: new Date().toISOString()
      };
      
      console.log('Attempting to sync data to Supabase...');
      
      // First check if our table exists
      const { data: checkData, error: checkError } = await supabase
        .from('tempo_app_data')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking for table:', checkError);
        // If the error is that the table doesn't exist
        if (checkError.code === '42P01' || checkError.message.includes('does not exist')) {
          setError(`The tempo_app_data table doesn't exist in Supabase. Please create it with columns 'id' (primary key) and 'data' (jsonb type).`);
          
          // Store backup in localStorage for recovery
          localStorage.setItem('tempo_full_backup', JSON.stringify(appData));
          setMessage('Backup created in localStorage. Please set up the table in Supabase.');
          return;
        }
        throw checkError;
      }
      
      // Check if we have data already
      if (checkData && checkData.length > 0) {
        // Update existing record
        console.log('Updating existing record with ID:', checkData[0].id);
        const { error: updateError } = await supabase
          .from('tempo_app_data')
          .update({
            data: appData // IMPORTANT: Do NOT stringify - Supabase expects a JavaScript object for JSONB columns
          })
          .eq('id', checkData[0].id);
        
        if (updateError) throw updateError;
      } else {
        // Insert new record
        console.log('Creating new record');
        const { error: insertError } = await supabase
          .from('tempo_app_data')
          .insert([
            {
              data: appData // IMPORTANT: Do NOT stringify - Supabase expects a JavaScript object for JSONB columns
            }
          ]);
        
        if (insertError) throw insertError;
      }
      
      console.log('Data successfully synced to Supabase!');
      setMessage('✅ Data successfully synced to Supabase! Others can now see your changes.');
      localStorage.setItem('last_sync_timestamp', new Date().toISOString());
    } catch (error) {
      console.error('Sync error:', error);
      setError(error.message || 'Unknown error occurred');
      setMessage(`Error syncing data. See details below.`);
    } finally {
      setSyncing(false);
    }
  };
  
  // Verify admin password
  const verifyPassword = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
      setMessage('Admin access granted. You can now sync data.');
      setError(null);
    } else {
      setMessage('Incorrect password. Please try again.');
      setError('Invalid admin password');
    }
  };

  // Handle button click
  const handleSyncClick = () => {
    if (isAdmin) {
      syncToSupabase();
    } else {
      setShowPasswordPrompt(true);
    }
  };
  
  return (
    <div className="mt-4 p-4 bg-blue-900 rounded-lg">
      <h3 className="text-white text-lg font-bold mb-2">Data Sharing</h3>
      <p className="text-white/80 mb-4">
        Push your current schedule data to the shared database so others can see it.
        <br />
        <span className="text-yellow-300 text-sm">Note: Only admins can push data to prevent accidental overwrites.</span>
      </p>
      
      {showPasswordPrompt ? (
        <div className="mb-4">
          <label className="block text-white mb-2">Admin Password:</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 bg-blue-800 text-white rounded border border-blue-600 w-full mb-2"
            placeholder="Enter admin password"
          />
          <div className="flex space-x-2">
            <button
              onClick={verifyPassword}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Verify
            </button>
            <button
              onClick={() => setShowPasswordPrompt(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSyncClick}
          disabled={syncing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : isAdmin ? 'Sync My Data to Supabase (Admin)' : 'Sync My Data to Supabase'}
        </button>
      )}
      
      {message && (
        <div className="mt-2 p-2 rounded bg-blue-800/50 text-white">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 rounded bg-red-900/50 text-white">
          <p className="font-bold">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default SyncButton;
