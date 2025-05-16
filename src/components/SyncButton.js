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
      
      // First check the structure of the instructors table
      const { data: tableInfo, error: tableError } = await supabase
        .from('instructors')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('Error checking instructors table:', tableError);
      }
      
      // Prepare instructors data - only include fields that exist in the Supabase table
      const preparedInstructors = instructors.map(instructor => {
        // Create a base object with only id and essential fields
        const prepared = {
          id: instructor.id,
          name: instructor.name || '',
          email: instructor.email || '',
          phone: instructor.phone || '',
          classTypes: Array.isArray(instructor.classTypes) ? instructor.classTypes : []
        };
        
        // Add other fields if they exist in the instructor object
        if (instructor.min_classes !== undefined) prepared.min_classes = instructor.min_classes;
        if (instructor.max_classes !== undefined) prepared.max_classes = instructor.max_classes;
        if (instructor.color !== undefined) prepared.color = instructor.color;
        
        return prepared;
      });
      
      // Upload instructors to Supabase
      const { error: instructorsError } = await supabase
        .from('instructors')
        .upsert(preparedInstructors, { onConflict: 'id' });
      
      if (instructorsError) {
        console.error('Error details:', instructorsError);
        throw new Error(`Error syncing instructors: ${instructorsError.message}`);
      }
      
      // Create a simplified schedule object to avoid schema issues
      const simplifiedSchedule = {
        data: schedule,
        updated_at: new Date().toISOString()
      };
      
      try {
        // Try to delete any existing schedule records first
        await supabase.from('schedule').delete().neq('id', 0);
        
        // Insert new schedule record
        const { error: scheduleError } = await supabase
          .from('schedule')
          .insert([simplifiedSchedule]);
          
        if (scheduleError) {
          console.error('Schedule error details:', scheduleError);
          throw new Error(`Error saving schedule: ${scheduleError.message}`);
        }
      } catch (scheduleError) {
        console.error('Error handling schedule:', scheduleError);
        setMessage(`Warning: Schedule sync had an error: ${scheduleError.message}. Continuing with other data...`);
        // Continue with other operations even if schedule fails
      }
      
      // Create a simplified locked assignments object
      const simplifiedLocks = {
        data: lockedAssignments,
        updated_at: new Date().toISOString()
      };
      
      try {
        // Try to delete any existing locked assignments records first
        await supabase.from('locked_assignments').delete().neq('id', 0);
        
        // Insert new locked assignments record
        const { error: locksError } = await supabase
          .from('locked_assignments')
          .insert([simplifiedLocks]);
          
        if (locksError) {
          console.error('Locks error details:', locksError);
          throw new Error(`Error saving locked assignments: ${locksError.message}`);
        }
      } catch (locksError) {
        console.error('Error handling locked assignments:', locksError);
        setMessage(`Warning: Locked assignments sync had an error: ${locksError.message}. Continuing...`);
        // Continue with other operations even if locked assignments fails
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
