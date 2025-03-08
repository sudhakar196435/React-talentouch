import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import "../Styles/Login.css";
import logo from "../Assets/logo.png";
import login from "../Assets/login.jpg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load saved email from localStorage when component mounts
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true); // Start loading

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("Please verify your email before logging in.");
        toast.error("Please verify your email.");
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.role === "admin") {
          navigate("/adminhome");
          toast.success("Welcome, Admin!");
        } else if (userData.role === "auditor") {
          navigate("/auditorhome");
          toast.success("Welcome, Auditor!");
        } else {
          navigate("/home");
          toast.success("Login successful!");
        }

        // Store email in localStorage if "Remember Me" is checked
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        setLoading(false);
        return;
      }

      // Check if user is a Sub-User under any branch
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
            setLoading(false);
            return;
          }
        }
      }

      setError("User data not found.");
      toast.error("User data not found.");
    } catch (err) {
      setError("Invalid email or password.");
      toast.error("Invalid email or password.");
    }

    setLoading(false); // Stop loading
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="logo-container">
            <img src={logo} alt="TheCubeFactory" className="login-logo" />
          </div>
          <h2 className="login-back">Welcome back !</h2>
          <form onSubmit={handleLogin} className="login-form">
            <label>Email address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="inputfield"
            />
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="inputfield"
            />
            <div className="remember-forgot">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />{" "}
                Remember for 30 days
              </label>
              <a href="/forgot-password" className="forgot-password">
                Forgot password?
              </a>
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : "Sign in"}
            </button>

            {error && <p className="error-message">{error}</p>}
            <p className="signup-text">
              Don't have an account? <a href="/register">Sign up</a>
            </p>
          </form>
        </div>
        <div className="login-right">
          <img src={login} alt="Login Illustration" className="login-illustration" />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;
