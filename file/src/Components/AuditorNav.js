// src/components/AuditorNav.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/Navbar.css'; // Reusing the same CSS file
import logo from '../Assets/logo.png';
import { getAuth, signOut } from 'firebase/auth';

const AuditorNav = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const handleMobileToggle = () => {
    setIsMobile(!isMobile);
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
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
          <li><Link to="/auditorhome" className="nav-link">Home</Link></li>
          <li><Link to="/reports" className="nav-link">Audit Reports</Link></li>
          <li><Link to="/AuditorUsers" className="nav-link">Users</Link></li>
          <li><Link to="/auditorsettings" className="nav-link">Settings</Link></li>
          <li>
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

export default AuditorNav;
