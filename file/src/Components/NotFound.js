import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // Assuming you have firebase setup
import '../Styles/Pagenotfound.css';
import notFoundImage from '../Assets/404.png'; 

const NotFound = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user); // Set isLoggedIn to true if user is logged in
    });

    return () => unsubscribe();
  }, []);

  const handleGoToHome = () => {
    if (isLoggedIn) {
      navigate('/home'); // Navigate to user's home page
    } else {
      navigate('/'); // Navigate to public home page
    }
  };

  return (
    <div className="not-found-container">
      <img 
        src={notFoundImage} 
        alt="Page Not Found" 
        className="not-found-image" 
      />
      <h1 className="not-found-heading">Oops! Page Not Found</h1>
      <p className="not-found-paragraph">
        We couldn't find the page you were looking for. It might have been removed, had its name changed, or is temporarily unavailable. 
      </p>
      <p className="not-found-paragraph">Please check the URL or return to the homepage.</p>
      <button onClick={handleGoToHome} className="not-found-home-link">
        Go to Homepage
      </button> 
    </div>
  );
};

export default NotFound;