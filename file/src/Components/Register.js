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
  const [fullName, setFullName] = useState(""); // State for full name
  const [mobileNumber, setMobileNumber] = useState(""); // State for mobile number
  const [organizationType, setOrganizationType] = useState("");
  const navigate = useNavigate(); // Initialize useNavigate

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!fullName) {
      alert("Please enter your full name.");
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    if (!organizationType) {
      alert("Please select an organization.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName, // Save full name
        email,
        mobileNumber, // Save mobile number
        organizationType,
        createdAt: serverTimestamp(), // Add registration timestamp
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
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="text"
            placeholder="Mobile Number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="password"
            placeholder="Create a Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />
          <select
            className="organization-select"
            value={organizationType}
            onChange={(e) => setOrganizationType(e.target.value)}
            required
          >
            <option value="" disabled>Select an organization</option>
            <option value="Student">Student</option>
            <option value="Company">Company</option>
            <option value="Consultant">Consultant</option>
          </select>
          <button type="submit" className="register-button">Register</button>
          <p className="register-message">
            Already have an account? <a href="/login">Login </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
