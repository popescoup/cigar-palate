// src/app/token-test/page.tsx

/*
	•	Defines a React component for testing authentication by sending a request to an auth status API.
	•	Uses axios to make a GET request to http://localhost:3000/api/auth/status, including credentials (cookies) in the request.
	•	Displays a button labeled “Test Auth Status” which, when clicked, triggers the request and updates testResult with the server’s response or error message.
	•	Renders a basic UI with a title, a description about the token storage in cookies, and the result of the auth status check.
*/

"use client";

import React, { useState } from 'react';
import axios from 'axios';

const TokenTest = () => {
  const [testResult, setTestResult] = useState('');

  const testTokenSending = async () => {
    try {
      const response = await axios.get('/api/auth/status', {
        withCredentials: true
      });
      setTestResult(`Auth check successful. Server response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setTestResult(`Error checking auth status: ${error.response?.data || error.message}`);
      } else {
        setTestResult(`Error checking auth status: ${(error as Error).message}`);
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Token Test</h1>
      <p>Token is stored in an HTTP-only cookie (not visible here)</p>
      <button 
        onClick={testTokenSending}
        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Test Auth Status
      </button>
      <p className="mt-4">Test Result: {testResult}</p>
    </div>
  );
};

export default TokenTest;