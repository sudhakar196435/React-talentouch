import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore"; // Firestore imports
import { db } from "../firebase";
import AdminNav from "./AdminNav";
import { Spin } from 'antd';
import { FaUsers, FaCheckCircle, FaTimesCircle, FaUserShield, FaUserTie } from 'react-icons/fa'; // Added Admin & Auditor icons
import '../Styles/AdminHome.css';
import dashboard from "../Assets/dashboard.png";

function AdminHome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [auditorCount, setAuditorCount] = useState(0);

  useEffect(() => {
    const checkAdminAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          navigate("/AccessDenied");
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            console.log("Admin verified");
            await fetchUsers();
          } else {
            navigate("/");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          navigate("/login");
        } finally {
          setIsLoading(false);
        }
      });

      return () => unsubscribe();
    };

    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const querySnapshot = await getDocs(usersCollection);

        let activeCount = 0;
        let inactiveCount = 0;
        let adminRoleCount = 0;
        let auditorRoleCount = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.active) activeCount++;
          else inactiveCount++;

          // Count roles
          if (data.role === "admin") adminRoleCount++;
          if (data.role === "auditor") auditorRoleCount++;
        });

        setTotalUsers(querySnapshot.size);
        setActiveUsers(activeCount);
        setInactiveUsers(inactiveCount);
        setAdminCount(adminRoleCount);
        setAuditorCount(auditorRoleCount);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    checkAdminAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <AdminNav />
      <div className="admin-home-container">
        <h1 className="admin-home-title">Admin Dashboard</h1>
        <div className="dashboard-container">
  {/* Left Content */}
  <div className="dashboard-info">
    <h1 className="dashboard-title">Welcome, Admin!</h1>
    <p className="dashboard-description">
   Take full control of branch management and user access with our advanced dashboard.  
  Monitor activities, generate insightful reports, and optimize performance effortlessly.
</p>
    <div className="dashboard-actions">
      <button type="primary" className="btn-view-branches" onClick={() => navigate("/users")}>
      Manage Users
      </button>
    </div>
  </div>
  
  {/* Right Image */}
  <div className="dashboard-image-wrapper">
    <img src={dashboard} alt="Audit Process" className="dashboard-image" />
  </div>
</div>
<br></br>
        <div className="stats-container">
          <div className="stat-card"  onClick={() => navigate("/users")} style={{ cursor: "pointer" }}>
            <FaUsers size={40} color="#007BFF" />
            <h2>Total Users</h2>
            <p>{totalUsers}</p>
          </div>
          <div className="stat-card">
            <FaCheckCircle size={40} color="#28a745" />
            <h2>Active Users</h2>
            <p>{activeUsers}</p>
          </div>
          <div className="stat-card">
            <FaTimesCircle size={40} color="#ffc107" />
            <h2>Inactive Users</h2>
            <p>{inactiveUsers}</p>
          </div>
          <div className="stat-card">
            <FaUserShield size={40} color="#17a2b8" />
            <h2>Admins</h2>
            <p>{adminCount}</p>
          </div>
          <div className="stat-card" onClick={() => navigate("/aud")} style={{ cursor: "pointer" }}>
  <FaUserTie size={40} color="#6f42c1" />
  <h2>Auditors</h2>
  <p>{auditorCount}</p>
</div>
        </div>
        
      </div>
    </div>
  );
}

export default AdminHome;
