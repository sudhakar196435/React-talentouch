import React from "react";
import { Link } from "react-router-dom";
import "../Styles/Footer.css";
import { FaFacebookF, FaGlobe, FaTwitter, FaLinkedinIn } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-left">
          <h2 className="footer-logo">Talentouch</h2>
          <p>
          We help professionals connect with the right opportunities. Our 
          expertise in audits and talent acquisition ensures quality recruitment.
          </p>
          <div className="social-icons">
            <Link to="https://x.com/i/flow/login?redirect_after_login=%2Ftalentouch" className="social-link" target="_blank" rel="noopener noreferrer"><FaTwitter /></Link>
            <Link to="https://www.facebook.com/talentouch" className="social-link" target="_blank" rel="noopener noreferrer"><FaFacebookF /></Link>
            <Link to="https://talentouchcs.com/" className="social-link" target="_blank" rel="noopener noreferrer"><FaGlobe /></Link>
            <Link to="https://in.linkedin.com/company/talentouch-corporate-services-private-ltd" className="social-link"  target="_blank" rel="noopener noreferrer"><FaLinkedinIn /></Link>
          </div>
        </div>
        <div className="footer-links">
          <h3>Company</h3>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/portfolio">Portfolio</Link></li>
            <li><Link to="/careers">Careers</Link></li>
          </ul>
        </div>
        <div className="footer-links">
          <h3>Help</h3>
          <ul>
            <li><Link to="/support">Customer Support</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
        <div className="footer-signup">
  <h3>New Here?</h3>
  <p>Join us today and explore endless opportunities!</p>
  <a href="/register" className="signup-link">Sign Up</a>
</div>

      </div>
      <div className="footer-bottom">
  <p>© {new Date().getFullYear()} Talentouch. All Rights Reserved.</p>
</div>

    </footer>
  );
};

export default Footer;
