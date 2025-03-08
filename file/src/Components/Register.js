import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import "../Styles/Register.css"; // Import CSS for styling
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import logo from '../Assets/logo.png';
import loginIllustration from "../Assets/signup.jpg"; // Update the path if needed
import { serverTimestamp } from "firebase/firestore";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState(""); 
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!/^\d{10}$/.test(mobileNumber)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        mobileNumber,
        createdAt: serverTimestamp(), 
      });

      // Send verification email
      await sendEmailVerification(user);
      alert("Registration successful! Please check your email for verification.");

      // Redirect to login page
      navigate("/login");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered.");
      } else {
        alert(error.message);
      }
    }
  };

  return (
    <div className="auth-page">
    <div className="auth-container">
      {/* Left Section - Register Form */}
      <div className="auth-left">
        <div className="auth-logo">
          <img src={logo} alt="Logo" className="auth-logo-img" />
        </div>
        <form className="auth-form" onSubmit={handleRegister}>
          <h2 className="auth-heading">Sign up</h2>

          {/* Mobile Number Input */}
          <input
            type="text"
            placeholder="Mobile Number"
            value={mobileNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 10) {
                setMobileNumber(value);
              }
            }}
            required
            className="auth-input"
          />

          {/* Email Input */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />

          {/* Password Input */}
          <input
            type="password"
            placeholder="Create a Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />

          {/* Register Button */}
          <button type="submit" className="auth-button">Register</button>
          {/* Login Link */}
          <p className="auth-message">
            Already have an account? <a href="/login">Login</a>
          </p>
        </form>
      </div>

      {/* Right Section - Login Illustration */}
      <div className="auth-right">
        <img
          src={loginIllustration}
          alt="Login Illustration"
          className="auth-illustration"
        />
      </div>
    </div>
  </div>
  );
};

export default Register;
