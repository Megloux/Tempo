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
      
      // Create a single combined data object with everything
      const allData = {
        app_data: JSON.stringify({
          instructors,
          schedule,
          lockedAssignments,
          lastUpdated: new Date().toISOString()
        }),
        updated_at: new Date().toISOString()
      };
      
      // First check if the app_data table exists
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('app_data')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        // Table probably doesn't exist, create it
        console.log('Creating app_data table...');
        try {
          // Try to create the table (this might fail if user doesn't have permissions)
          const { error: createError } = await supabase.rpc('create_app_data_table');
          if (createError) {
            console.error('Error creating table:', createError);
          }
        } catch (e) {
          console.error('Error creating table:', e);
        }
      }
      
      // Try to save the data
      try {
        // First try to delete any existing records
        await supabase.from('app_data').delete().neq('id', 0);
        
        // Then insert the new data
        const { error: insertError } = await supabase
          .from('app_data')
          .insert([allData]);
        
        if (insertError) {
          throw new Error(`Error saving data: ${insertError.message}`);
        }
        
        setMessage('Data successfully synced to Supabase! Refresh the page to see changes.');
      } catch (saveError) {
        // If that fails, try a different approach - use a stored procedure
        console.error('Error saving data:', saveError);
        
        try {
          // Try to use a stored procedure to save the data as JSON
          const { error: rpcError } = await supabase.rpc('save_app_data', {
            data_json: JSON.stringify({
              instructors,
              schedule,
              lockedAssignments,
              lastUpdated: new Date().toISOString()
            })
          });
          
          if (rpcError) {
            throw new Error(`Error saving data via RPC: ${rpcError.message}`);
          }
          
          setMessage('Data successfully synced to Supabase using alternative method! Refresh the page to see changes.');
        } catch (rpcError) {
          console.error('Error with RPC method:', rpcError);
          throw new Error('Could not save data to Supabase. Please check console for details.');
        }
      }
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
