import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/Adminsettings.css'; // Import your CSS for styling

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
    return  <div className="loading-container">
    <div className="spinner"></div>
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
              <p><strong>Name:</strong> {userData.fullName}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Phone Number:</strong> {userData.mobileNumber}</p>
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
