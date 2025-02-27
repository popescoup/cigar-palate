
/*
	•	Provides a logout button that, when clicked, sends a request to the server to log the user out.
	•	Displays a loading state while the logout request is processing and an error message if the logout fails.
	•	Redirects the user to the home page after a successful logout by updating window.location.href.
*/

import { useState } from 'react';
import axios from 'axios';

const Logout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      // Redirect to home page or update app state to reflect logged out status
      window.location.href = '/';
    } catch (err) {
      setError('Failed to logout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleLogout} 
        disabled={loading}
        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700"
      >
        {loading ? 'Logging out...' : 'Logout'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default Logout;