import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // Ensure Firebase is set up correctly
import { doc, onSnapshot } from "firebase/firestore"; // For fetching and listening to user status

import '../Styles/Home.css';
import UserNav from "./UserNav";

const Home = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(""); // Full name state
  const [user, setUser] = useState({ active: false, blocked: false });
  const [loading, setLoading] = useState(true);
  const [messageVisible, setMessageVisible] = useState(true); // To manage message visibility

  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeFromStatus;

    unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);

        // Use onSnapshot to listen for changes in user status and full name
        unsubscribeFromStatus = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              setFullName(userData.fullName || "User"); // Update full name
              setUser({ active: userData.active, blocked: userData.blocked });
            } else {
              console.log("No user data found!");
            }
            setLoading(false); // Stop loading once data is fetched
          },
          (error) => {
            console.error("Error fetching user data:", error);
            setLoading(false); // Stop loading even if an error occurs
          }
        );
      } else {
        // If no user is logged in, redirect to the login page
        navigate("/login");
      }
    });

    // Clean up the listeners on unmount
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeFromStatus) unsubscribeFromStatus();
    };
  }, [navigate]);

  const handleCloseMessage = () => {
    setMessageVisible(false); // Hide the message box when OK is clicked
  };

  const renderStatusMessage = () => {
    if (!messageVisible) return null;

    if (user.blocked) {
      return (
        <div className="status-message blocked">
          <p>Your account has been blocked. Please contact support.</p>
          <button className="close-btn" onClick={handleCloseMessage}>OK</button>
        </div>
      );
    } else if (!user.active) {
      return (
        <div className="status-message inactive">
          <p>Your account is under verification.</p>
          <button className="close-btn" onClick={handleCloseMessage}>OK</button>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <UserNav />
      {renderStatusMessage()}
      <div className="home-container">
        <div className="status-message-container">
          {fullName && <p><strong>Hello</strong>, {fullName}!</p>}
        </div>
      </div>
    </div>
  );
};

export default Home;
