import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import PartnerLogos from './PartnerLogos';
import '../Styles/Index.css';
import heroImage from '../Assets/hero1.png';
import servicesImage from '../Assets/image.png';
import testimonialsImage from '../Assets/hero1.png';
import contactImage from '../Assets/hero1.png';

function Index() {
  return (
    <div>
      <Navbar />
      <div className="index-container">
        {/* Hero Section */}
        <div className="hero-section">
          <img src={heroImage} alt="Welcome" className="hero-image" />
          <div className="hero-overlay">
            <h1 className="hero-title">Welcome to Talentouch!</h1>
            <p className="hero-subtitle">Providing top-notch talent management solutions for companies worldwide.</p>
            <button className="cta-button">Learn More</button>
          </div>
        </div>  

        {/* Services Section */}
        <div className="section">
          <img src={servicesImage} alt="Our Services" className="section-image" />
          <div className="section-content">
            <h2>Our Services</h2>
            <ul className="services-list">
              <li>Talent Acquisition</li>
              <li>Employee Training</li>
              <li>Performance Management</li>
              <li>HR Consulting</li>
              <li>Leadership Development</li>
              <li>Employee Engagement Programs</li>
            </ul>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="section alternate">
          <div className="section-content">
            <h2>What Our Clients Say</h2>
            <p className="testimonial">"Talentouch helped us streamline our hiring process and build a stronger, more cohesive team."<br /><span>- John Doe, CEO, XYZ Corp.</span></p>
            <p className="testimonial">"The training programs provided by Talentouch have been a game changer for our organization."<br /><span>- Jane Smith, HR Director, ABC Ltd.</span></p>
          </div>
          <img src={testimonialsImage} alt="Testimonials" className="section-image" />
        </div>

        {/* Contact Section */}
        <div className="section">
          <img src={contactImage} alt="Contact Us" className="section-image" />
          <div className="section-content">
            <h2>Contact Us</h2>
            <p>If you're interested in learning more about our services, feel free to reach out!</p>
            <button className="cta-button">Get in Touch</button>
          </div>
        </div>
      </div>
      
      <PartnerLogos />
      <Footer />
    </div>
  );
}

export default Index;
