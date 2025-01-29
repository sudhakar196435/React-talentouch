// src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/Navbar.css'; // Import the CSS file for custom styles
import logo from '../Assets/logo.png';
import { auth } from '../firebase'; // Import the auth object from firebase

const UserNav = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate(); 

  const handleMobileToggle = () => {
    setIsMobile(!isMobile);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login"); // Redirect to the login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="logo">
          <Link to="/" className="logo-text"> <img src={logo} alt="Logo" /></Link>
          
        </div>

        {/* Links Section */}
        <ul className={`nav-links ${isMobile ? 'active' : ''}`}>
          <li><Link to="/home" className="nav-link">Home</Link></li>
        
          <li><Link to="/settings" className="nav-link">Menu</Link></li>
          
            {/* Logout Button */}
            <button className="log-out" onClick={handleLogout}>
              <span className="material-symbols-outlined" style={{ marginRight: '5px' }}>
                logout
              </span>
              Logout
            </button>
          {/* Add more links as needed */}
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

export default UserNav;