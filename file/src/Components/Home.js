import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // Ensure Firebase is set up correctly
import { doc, onSnapshot } from "firebase/firestore"; // For fetching and listening to user status
import { Spin,Alert } from 'antd';
import '../Styles/Home.css';
import UserNav from "./UserNav";
import branch from "../Assets/branch.png";
import { Skeleton } from "antd";
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
        navigate("/AccessDenied");
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
            description="Thank you for registering! Your account is currently being reviewed by our team. The verification process may take up to 24-48 hours. You will be notified once your account is activated."
          type="warning"
          showIcon
          className="already-submitted-alert"
          style={{ marginBottom: "20px" }}  // Add bottom margin  
        />
      )}
         <div className="dashboard-container">
      {/* Left Content */}
      <div className="dashboard-info">
        {loading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : (
          <>
            <h1 className="dashboard-title">Welcome, {fullName}!</h1>
            <p className="dashboard-description">
  Manage branches and subusers of your company seamlessly with our intuitive dashboard.  
  Access detailed reports, analyze data, and track performance in real time.
</p>

            <div className="dashboard-actions">
              <button type="primary" className="btn-view-branches" onClick={() => navigate("/branches")}>
                View Branches
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Right Image */}
      <div className="dashboard-image-wrapper">
        {loading ? (
          <Skeleton.Image style={{ width: "100%", height: "auto" }} />
        ) : (
          <img src={branch} alt="Audit Process" className="dashboard-image" />
        )}
      </div>
    </div>
      </div>
    </div>
  );
};

export default Home;
