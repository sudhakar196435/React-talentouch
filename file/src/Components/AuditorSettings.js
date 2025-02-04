import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Styles/AuditorSettings.css'; // Import your CSS for styling
import { Spin } from 'antd';
import AuditorNav from './AuditorNav'; // Assuming you have an AuditorNav component
import AuditorSidebar from './AuditorSidebar'; // Assuming you have an Auditorsidebar component

const AuditorSettings = () => {
  const [userData, setUserData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    mobileNumber: '123-456-7890',
  }); // Sample user data for now

  const [loading, setLoading] = useState(false); // Set loading to false, since we're not fetching user data anymore

  if (loading) {
    return <div className="loading-container">
      <Spin size="large" />
    </div>;
  }

  return (
    <div>
      <AuditorNav />
      <div className="setting-container">
        <AuditorSidebar />

        {/* Main content */}
        <div className="setting-content">
          <h2 className="auditor-home-title">My Account</h2>

          {userData ? (
            <div className="auditor-info">
              <p><strong>Name:</strong> {userData.fullName}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Phone Number:</strong> {userData.mobileNumber}</p>
            </div>
          ) : (
            <p>Loading user data...</p>
          )}

         
        </div>
      </div>
    </div>
  );
};

export default AuditorSettings;
