import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const SupabaseDebug = () => {
  const [status, setStatus] = useState('Checking connection...');
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("Supabase client initialized:", !!supabase);
        
        // Check if we can connect to Supabase
        const { data, error } = await supabase.from('instructors').select('count');
        
        if (error) {
          console.error("Supabase connection error:", error);
          setStatus('Connection failed');
          setError(error);
        } else {
          console.log("Successfully connected to Supabase");
          setStatus('Connected successfully');
          
          // Get some basic stats
          const { data: instructors } = await supabase.from('instructors').select('*');
          const { data: schedule } = await supabase.from('schedule').select('*');
          
          setData({
            instructorsCount: instructors?.length || 0,
            scheduleEntriesCount: schedule?.length || 0
          });
        }
      } catch (e) {
        console.error("Supabase connection exception:", e);
        setStatus('Connection error');
        setError(e);
      }
    };
    
    checkConnection();
  }, []);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg mt-4">
      <h2 className="text-xl font-bold mb-2">Supabase Connection Status</h2>
      <div className="mb-2">
        <span className="font-semibold">Status: </span>
        <span className={status.includes('success') ? 'text-green-400' : 'text-red-400'}>
          {status}
        </span>
      </div>
      
      {error && (
        <div className="mb-2">
          <span className="font-semibold">Error: </span>
          <pre className="text-red-400 text-sm overflow-auto">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      
      {data && (
        <div className="mb-2">
          <span className="font-semibold">Data Stats: </span>
          <ul className="list-disc list-inside text-sm">
            <li>Instructors: {data.instructorsCount}</li>
            <li>Schedule Entries: {data.scheduleEntriesCount}</li>
          </ul>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-400">
        <p>If connection is successful but you're not seeing shared data:</p>
        <ol className="list-decimal list-inside mt-1">
          <li>Check that all users are using the same Supabase project</li>
          <li>Verify that Row-Level Security (RLS) policies allow data sharing</li>
          <li>Ensure all environment variables are correctly set</li>
        </ol>
      </div>
    </div>
  );
};

export default SupabaseDebug;
