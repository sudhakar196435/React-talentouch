// src/components/Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Styles/Navbar.css'; // Import the CSS file for custom styles
import logo from '../Assets/logo.png';
const Navbar = ()  => {
    const [isMobile, setIsMobile] = useState(false);
  
    const handleMobileToggle = () => {
      setIsMobile(!isMobile);
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
            <li><Link to="/" className="nav-link">Home</Link></li>
            <li><Link to="/services" className="nav-link">Services</Link></li>
            <li><Link to="/about-us" className="nav-link">About us</Link></li>
            <li><Link to="/contact-us" className="nav-link">Contact us</Link></li>
            <li><Link to="/login" className="login-btn">Login</Link></li>
            <li><Link to="/register" className="register-btn">Register</Link></li>
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
  
  export default Navbar;