import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore"; // Add missing imports
import { db } from "../firebase"; // Firestore instance
import AdminNav from "./AdminNav";
import { Spin } from 'antd';
import { FaUsers, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'; // Importing React Icons
import '../Styles/AdminHome.css';

function AdminHome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  

  useEffect(() => {
    const checkAdminAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          navigate("/login");
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid)); // Fixed doc and getDoc usage
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
        

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.active) activeCount++;
          else inactiveCount++;

          
        });

        setTotalUsers(querySnapshot.size); // Using querySnapshot.size for total user count
        setActiveUsers(activeCount);
        setInactiveUsers(inactiveCount);
        
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
        <div className="stats-container">
        <div className={`stat-card ${totalUsers > 0 ? 'total' : ''}`}>
            <FaUsers size={40} color="#007BFF" />
            <h2>Total Users</h2>
            <p>{totalUsers}</p>
          </div>
          <div className={`stat-card ${activeUsers > 0 ? 'active' : ''}`}>
            <FaCheckCircle size={40} color="#28a745" />
            <h2>Active Users</h2>
            <p>{activeUsers}</p>
          </div>
          <div className={`stat-card ${inactiveUsers > 0 ? 'inactive' : ''}`}>
            <FaTimesCircle size={40} color="#ffc107" />
            <h2>Inactive Users</h2>
            <p>{inactiveUsers}</p>
          </div>
         
        </div> 
      </div>
    </div>
  );
}

export default AdminHome;