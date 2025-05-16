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
  
  const syncToSupabase = async () => {
    try {
      setSyncing(true);
      setMessage('Syncing data to Supabase...');
      
      // Get data from localStorage
      const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');
      const schedule = JSON.parse(localStorage.getItem('schedule') || '{}');
      const lockedAssignments = JSON.parse(localStorage.getItem('lockedAssignments') || '{}');
      
      // Let's try a different approach - create a special table just for this app's data
      // First check if our special table exists
      const { data: tableInfo, error: tableError } = await supabase
        .from('tempo_app_data')
        .select('id')
        .limit(1);
      
      if (tableError) {
        // Table doesn't exist yet, let's create it
        console.log('Table does not exist yet, creating it...');
        
        // We can't create tables directly from JavaScript, so let's store the data in localStorage
        // and provide instructions to the user
        localStorage.setItem('tempo_backup_data', JSON.stringify({
          instructors,
          schedule,
          lockedAssignments,
          timestamp: new Date().toISOString()
        }));
        
        setMessage('First-time setup: Please create the tempo_app_data table in Supabase. ' +
                   'Your data has been backed up to localStorage.');
        return;
      }
      
      // Table exists, let's save the data
      const { error: insertError } = await supabase
        .from('tempo_app_data')
        .insert([
          {
            data: JSON.stringify({
              instructors,
              schedule,
              lockedAssignments,
              timestamp: new Date().toISOString()
            })
          }
        ]);
      
      if (insertError) {
        console.error('Error inserting data:', insertError);
        throw new Error(`Could not save data: ${insertError.message}`);
      }
      
      setMessage('Data successfully synced to Supabase! Refresh the page to see changes.');
    } catch (error) {
      console.error('Sync error:', error);
      setMessage(`Error syncing data: ${error.message}`);
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
    } else {
      setMessage('Incorrect password. Please try again.');
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
    </div>
  );
};

export default SyncButton;
