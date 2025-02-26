import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Skeleton, Button } from "antd";
import "../Styles/AuditorHome.css"; // New CSS
import AuditorNav from "./AuditorNav";
import auditImage from "../Assets/image.png";

const AuditorHome = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeFromStatus;

    unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        unsubscribeFromStatus = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              setFullName(userData.fullName || "Auditor");

              if (userData.role !== "auditor") {
                navigate("/login");
              }
            } else {
              navigate("/login");
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user data:", error);
            setLoading(false);
            navigate("/login");
          }
        );
      } else {
        navigate("/login");
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeFromStatus) unsubscribeFromStatus();
    };
  }, [navigate]);

  return (
    <div>
      <AuditorNav />
      <div className="auditor-home">
        {/* Left Content */}
        <div className="auditor-info">
          {loading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : (
            <>
              <h1 className="auditor-heading">Welcome, {fullName || "Auditor"}!</h1>
              <p className="auditor-description">
                Easily manage your audit tasks with a user-friendly dashboard. View detailed reports, analyze key data, and track performance. Stay organized and make informed decisions with real-time insights.
              </p>
              <div className="auditor-buttons">
                <Button type="primary" className="start-audit-btn" onClick={() => navigate("/auditorviewacts")}>
                  View Branches
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right Image */}
        <div className="auditor-image-container">
          {loading ? <Skeleton.Image style={{ width: 300, height: 200 }} /> : <img src={auditImage} alt="Audit Process" className="auditor-image" />}
        </div>
      </div>
    </div>
  );
};

export default AuditorHome;
