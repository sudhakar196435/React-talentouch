import React from 'react'
import Navbar from './Navbar'
import '../Styles/Index.css'
function Index() {
  return (
    <div>
         <Navbar />
<div className="index-container">
   
      <div className="full-width-card">
        <div className="card-content">
          <h1 className="card-title">Welcome to Talentouch!</h1>
          <p className="card-description">At Talentouch, we are committed to providing top-notch talent management solutions for companies worldwide.</p>

        

          {/* Our Services */}
          <div className="card-details">
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

          {/* Testimonials */}
          <div className="card-details">
            <h2>What Our Clients Say</h2>
            <p className="testimonial">
              "Talentouch helped us streamline our hiring process and build a stronger, more cohesive team. Their insights and professionalism are unmatched!"
              <br />
              <span>- John Doe, CEO, XYZ Corp.</span>
            </p>
            <p className="testimonial">
              "The training programs provided by Talentouch have been a game changer for our organization. Our employees are more engaged and productive."
              <br />
              <span>- Jane Smith, HR Director, ABC Ltd.</span>
            </p>
          </div>

          {/* Contact Info */}
          <div className="card-footer">
            <h2>Contact Us</h2>
            <p>If you're interested in learning more about our services, feel free to reach out!</p>
            <button className="cta-button">Get in Touch</button>
          </div>
        </div>
      </div>
    </div>

   
    </div>
  )
}

export default Index
