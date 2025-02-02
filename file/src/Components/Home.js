import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // Ensure Firebase is set up correctly
import { doc, onSnapshot } from "firebase/firestore"; // For fetching and listening to user status
import { Spin,Alert } from 'antd';
import '../Styles/Home.css';
import UserNav from "./UserNav";

const Home = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(""); // Full name state
  const [user, setUser] = useState({ active: false, blocked: false });
  const [loading, setLoading] = useState(true);

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
              setUser({ active: userData.active });
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

  


  if (loading) {
    return (
       <div className="loading-container">
              <Spin size="large" />
            </div>
    );
  }

  return (
    <div>
      <UserNav />
     
      <div className="home-container">
      {!user.active && (
        <Alert
          message="Your account is under verification"
            description="Thank you for registering! Your account is currently being reviewed by our team. The verification process may take up to 24-48 hours."
          type="warning"
          showIcon
          className="already-submitted-alert"
        />
      )}
        <div className="status-message-container">
          {fullName && <p><strong>Hello</strong>, {fullName}!</p>}
        </div>
      </div>
    </div>
  );
};

export default Home;
