// auth-status-test.js

/*
	•	Sends a test request to an authentication status endpoint to verify if a user is logged in.
	•	Uses an authorization token in the request header and logs the token for debugging purposes.
	•	Checks the response to determine if the user is authenticated, logging relevant details based on the response.
	•	Handles errors by logging detailed information about the issue, including response data, status, and headers if available.
*/

const axios = require('axios');

async function testAuthStatus() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsImlhdCI6MTcyOTE4OTQyNSwiZXhwIjoxNzI5MTkzMDI1fQ.IHU6DMLHVgOI4jVK4QL6EDLc-k3IyRWi9EUEFK_pqPQ'; // Your actual token

  console.log('Token being sent:', token);

  try {
    console.log('Sending request to auth status endpoint...');
    const response = await axios.get('http://localhost:3000/api/auth/status', { 
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Auth Status Response:', response.data);
    console.log('Is user logged in?', response.data.isLoggedIn);
    if (!response.data.isLoggedIn) {
      console.log('Reason:', response.data.reason);
    }
  } catch (error) {
    console.error('Error occurred while checking auth status:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received. Is the server running?');
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testAuthStatus();