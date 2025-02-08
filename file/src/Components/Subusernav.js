// src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/Navbar.css'; // Import the CSS file for custom styles
import logo from '../Assets/logo.png';
import { getAuth, signOut } from 'firebase/auth'; // Import Firebase auth

const Subusernav = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate(); // For navigation after logout

  const handleMobileToggle = () => {
    setIsMobile(!isMobile);
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        // Redirect to login page after successful logout
        navigate('/login');
      })
      .catch((error) => {
        console.error('Logout failed:', error);
      });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="logo">
          <Link to="/" className="logo-text">
            <img src={logo} alt="Logo" />
          </Link>
        </div>

        {/* Links Section */}
        <ul className={`nav-links ${isMobile ? 'active' : ''}`}>
          <li><Link to="/subuserhome" className="nav-link">Home</Link></li>
          <li><Link to="/Subuserprofile" className="nav-link">Menu</Link></li>
          <li>
            {/* Logout Button */}
            <button className="log-out" onClick={handleLogout}>
              <span className="material-symbols-outlined" style={{ marginRight: '5px' }}>
                logout
              </span>
              Logout
            </button>
          </li>
        </ul>

        {/* Hamburger Menu for Mobile */}
        <div className="hamburger" onClick={handleMobileToggle}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      </div>
    </nav>
  );
};

export default Subusernav;
