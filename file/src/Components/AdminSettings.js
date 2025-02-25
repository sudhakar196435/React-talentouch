import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/Adminsettings.css'; // Import your CSS for styling
import { Spin,Descriptions } from 'antd';
import AdminNav from './AdminNav';
import Adminsidebar from './Adminsidebar';

import { auth, db } from '../firebase'; // Assuming auth and db are properly initialized
import { doc, getDoc } from 'firebase/firestore';

const AdminSettings = () => {
  const [userData, setUserData] = useState(null); // State to store user data
  const [loading, setLoading] = useState(true); // State to track loading status
  const navigate = useNavigate(); // Hook for navigation

  // Fetch user data from Firestore
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // If there is no logged-in user, redirect to login page
        navigate('/login');
        return;
      }

      // Fetch user data from Firestore if user is authenticated
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // Check if user has the "admin" role
        if (userData.role !== 'admin') {
          // If the user is not an admin, redirect to login page
          navigate('/login');
          return;
        }

        setUserData(userData);
      } else {
        console.log("No such document!");
        navigate('/login');
      }

      setLoading(false);
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, [navigate]); // Dependency on navigate to update when navigation changes

  if (loading) {
    return    <div className="loading-container">
    <Spin size="large" />
  </div>;
  }

  return (
    <div>
      <AdminNav />
      <div className="setting-container">
      <Adminsidebar/>

        {/* Main content */}
        <div className="setting-content">
          <h2 className="admin-home-title">My Account</h2>
        
          {userData ? (
             <div className="admin-info">
             <Descriptions bordered column={2} className="profile-table">
               <Descriptions.Item label="Email">{userData.email}</Descriptions.Item>
               <Descriptions.Item label="Company Name">{userData.companyName}</Descriptions.Item>
               <Descriptions.Item label="Company Address">{userData.companyAddress}</Descriptions.Item>
               <Descriptions.Item label="Industry Type">{userData.industryType}</Descriptions.Item>
               <Descriptions.Item label="Coordinator Name">{userData.coordinatorName}</Descriptions.Item>
               <Descriptions.Item label="Director Name">{userData.directorName}</Descriptions.Item>
               <Descriptions.Item label="Hazardous">{userData.hazardous}</Descriptions.Item>
               <Descriptions.Item label="HP & Man Power">{userData.hpAndManPower}</Descriptions.Item>
               <Descriptions.Item label="License No">{userData.licenseNo}</Descriptions.Item>
               <Descriptions.Item label="Medical Advisor Name">{userData.medicalAdvisorName}</Descriptions.Item>
               <Descriptions.Item label="Occupier Name">{userData.occupierName}</Descriptions.Item>
               <Descriptions.Item label="Safety Officer Name">{userData.safetyOfficerName}</Descriptions.Item>
               <Descriptions.Item label="Welfare Officer Name">{userData.welfareOfficerName}</Descriptions.Item>
             </Descriptions>
           </div>
          ) : (
            <p>Loading user data...</p>
          )}

          <p className="user-mode-message">
            <strong>Click to switch to User Mode: </strong>
            <Link to="/home" className="user-mode-link">User Mode</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
