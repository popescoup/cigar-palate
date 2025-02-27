// src/app/components/AuthTest.tsx

/*
	•	Checks the user’s authentication status on load by sending a request to the server.
	•	Displays the status as “Logged In” or “Not Logged In” based on the server’s response, or shows an error message if the check fails.
	•	Uses a loading message (“Checking…”) initially, and updates the status message after the response is received.
*/

"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';

const AuthTest = () => {
  const [authStatus, setAuthStatus] = useState<string>('Checking...');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/status', { 
          withCredentials: true 
        });
        setAuthStatus(response.data.isLoggedIn ? 'Logged In' : 'Not Logged In');
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthStatus('Error checking status');
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded">
      <h2 className="text-lg font-semibold">Auth Status: {authStatus}</h2>
    </div>
  );
};

export default AuthTest;