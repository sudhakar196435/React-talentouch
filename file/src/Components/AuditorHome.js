import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // Ensure Firebase is set up correctly
import { doc, onSnapshot } from "firebase/firestore"; // For fetching and listening to user status
import { Spin } from "antd";
import "../Styles/Home.css";

import AuditorNav from "./AuditorNav";

const AuditorHome = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(""); // Full name state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeFromStatus;

    unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);

        // Use onSnapshot to listen for changes in user data
        unsubscribeFromStatus = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              setFullName(userData.fullName || "Auditor"); // Update full name

              // Redirect if the user is not an auditor
              if (userData.role !== "auditor") {
                navigate("/login");
              }
            } else {
              console.log("No user data found!");
              navigate("/login"); // Redirect if user data is missing
            }
            setLoading(false); // Stop loading once data is fetched
          },
          (error) => {
            console.error("Error fetching user data:", error);
            setLoading(false);
            navigate("/login"); // Redirect on error
          }
        );
      } else {
        navigate("/login"); // Redirect if no user is logged in
      }
    });

    // Clean up the listeners on unmount
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeFromStatus) unsubscribeFromStatus();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <AuditorNav/>
      <div className="home-container">
        <h2>Welcome, Auditor!</h2>
        <p>This is your home page.</p>
        {fullName && <p><strong>Hello</strong>, {fullName}!</p>}
      </div>
    </div>
  );
};

export default AuditorHome;
