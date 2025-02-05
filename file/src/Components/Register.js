import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import "../Styles/Register.css"; // Import CSS for styling
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import logo from '../Assets/logo.png';
import Navbar from "./Navbar";
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
    <div>
      <Navbar />
      <div className="register-container">
        <form className="register-form" onSubmit={handleRegister}>
          {/* Logo Image */}
          <div className="logo-container">
            <img src={logo} alt="Logo" className="login-logo" />
          </div>
          <h2 className="register-heading">Register</h2>
         
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
            className="input-field"
          />

          {/* Email Input */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />

          {/* Password Input */}
          <input
            type="password"
            placeholder="Create a Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />


          {/* Register Button */}
          <button type="submit" className="register-button">Register</button>
          
          {/* Login Link */}
          <p className="register-message">
            Already have an account? <a href="/login">Login</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
