import React, { useState } from "react";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../Styles/Forgotpasword.css";
import logo from "../Assets/logo.png";
import Navbar from "./Navbar";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDisabled, setIsDisabled] = useState(false); // Button disabled state
  const [showFullScreenPopup, setShowFullScreenPopup] = useState(false); // Full-screen popup state
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsDisabled(true); // Disable button

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("A password reset email has been sent to your email address. Please check your inbox and follow the instructions to reset your password.");

      setShowFullScreenPopup(true); // Show the full-screen popup
    } catch (error) {
      setErrorMessage("Failed to send reset email. Please check the email address and try again.");
      setIsDisabled(false); // Re-enable button if error occurs
    }
  };

  const handleOkClick = () => {
    setShowFullScreenPopup(false); // Hide the full-screen popup
    navigate("/login"); // Redirect to login page
  };

  return (
    <div>
      <Navbar />
      <div className="forgot-password-container">
        <form onSubmit={handleForgotPassword} className="forgot-password-form">
          {/* Logo */}
          <div className="logo-container">
            <img src={logo} alt="Logo" className="forgot-password-logo" />
          </div>
          <h2 className="forgot-password-heading">Forgot Password</h2>
          <p className="forgot-password-instructions">
            Enter your email address below and we'll send you a link to reset your password.
          </p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
          <button
            type="submit"
            className="forgot-password-button"
            disabled={isDisabled} // Disable button if `isDisabled` is true
          >
            {isDisabled ? "Send Reset Email" : "Send Reset Email"}
          </button>
          {/* Error message */}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <p className="back-to-login">
            Remembered your password? <a href="/login">Back to Login</a>
          </p>
        </form>

        {/* Full-screen success popup */}
        {showFullScreenPopup && (
  <div className="full-screen-popup">
    <div className="popup-content">
      {/* Circular Success Tick Icon */}
      <div className="circle-tick">
        <span className="tick-icon">✔</span>
      </div>
      <h3>{successMessage}</h3>
      <button onClick={handleOkClick} className="ok-button">OK</button>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default ForgotPassword;
