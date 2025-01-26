import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import '../Styles/Login.css';
import logo from '../Assets/logo.png';
import Navbar from "./Navbar";
import { ToastContainer, toast } from "react-toastify"; // Import ToastContainer and toast
import "react-toastify/dist/ReactToastify.css"; // Import the default toast styles

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous errors

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.emailVerified) {
        navigate("/home");
        toast.success("Login successful!"); // Show success toast
      } else {
        setError("Please verify your email before logging in.");
        toast.error("Please verify your email before logging in."); // Show error toast
      }
    } catch (err) {
      setError("Invalid email or password. Please try again.");
      toast.error("Invalid email or password. Please try again."); // Show error toast
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
