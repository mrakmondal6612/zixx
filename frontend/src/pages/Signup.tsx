
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const Signup = () => {
  useEffect(() => {
    // Redirect to the new auth page
  }, []);

  return <Navigate to="/auth" replace />;
};

export default Signup;
