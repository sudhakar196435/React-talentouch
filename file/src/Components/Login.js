import React, { useState } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import "../Styles/Login.css";
import logo from "../Assets/logo.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./Navbar";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 🔐 Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("Please verify your email before logging in.");
        toast.error("Please verify your email.");
        return;
      }

      // 🔍 Check if user exists in "users" collection
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.role === "admin") {
          navigate("/adminhome");
          toast.success("Welcome, Admin!");
          return;
        } else {
          navigate("/home");
          toast.success("Login successful!");
          return;
        }
      }

      // 🔍 Check if user is a Sub-User under any branch
      const usersCollection = await getDocs(collection(db, "users"));

      for (const userDoc of usersCollection.docs) {
        const branchesCollection = collection(db, `users/${userDoc.id}/branches`);
        const branchesSnapshot = await getDocs(branchesCollection);

        for (const branchDoc of branchesSnapshot.docs) {
          const subUsersRef = collection(db, `users/${userDoc.id}/branches/${branchDoc.id}/subUsers`);
          const subUserQuery = query(subUsersRef, where("email", "==", email));
          const subUserSnapshot = await getDocs(subUserQuery);

          if (!subUserSnapshot.empty) {
            navigate("/subuserform");
            toast.success("Welcome, Sub-User!");
            return;
          }
        }
      }

      // ❌ User Not Found
      setError("User data not found.");
      toast.error("User data not found.");
      
    } catch (err) {
      setError("Invalid email or password.");
      toast.error("Invalid email or password.");
    }
  };

  return (
    <div>
      <Navbar/>
      <div className="login-container">
        <form onSubmit={handleLogin} className="login-form">
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

      <ToastContainer />
    </div>
  );
};

export default Login;
