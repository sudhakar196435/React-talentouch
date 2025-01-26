import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { db } from "../firebase"; // Firestore instance
import "../Styles/Login.css";
import logo from "../Assets/logo.png";
import Navbar from "./Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.emailVerified) {
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          navigate("/adminhome"); // Redirect to admin home
          toast.success("Welcome, Admin!");
        } else {
          navigate("/home"); // Redirect to user home
          toast.success("Login successful!");
        }
      } else {
        setError("Please verify your email before logging in.");
        toast.error("Please verify your email before logging in.");
      }
    } catch (err) {
      setError("Invalid email or password. Please try again.");
      toast.error("Invalid email or password. Please try again.");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="login-container">
        <form onSubmit={handleLogin} className="login-form">
          {/* Logo Image */}
          <div className="logo-container">
            <img src={logo} alt="Logo" className="login-logo" />
          </div>
          <h2 className="login-heading">Login</h2>

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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />
          <button type="submit" className="login-button">
            Login
          </button>
          {error && <p className="error-message">{error}</p>}
          <p className="register-message">
            Don't have an account? <a href="/register">Register here</a>
          </p>
          <p className="register-message">
            <a href="/forgot-password">Forgot Password</a>
          </p>
        </form>
      </div>

      {/* Toast Container for showing toasts */}
      <ToastContainer />
    </div>
  );
};

export default Login;
