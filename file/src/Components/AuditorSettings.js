import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Adminsettings.css'; // Import CSS for styling
import { Skeleton, Descriptions } from 'antd';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import AuditorNav from './AuditorNav';
import Auditorsidebar from './Auditorsidebar';

const AuditorSettings = () => {
  const [userData, setUserData] = useState(null); // Store user data
  const [loading, setLoading] = useState(true); // Track loading state
  const navigate = useNavigate(); // React Router navigation hook

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/AccessDenied'); // Redirect if no user is logged in
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // Redirect if not an auditor
          if (userData.role !== 'auditor') {
            navigate('/login');
            return;
          }

          setUserData(userData);
        } else {
          console.log("No such document!");
          navigate('/login');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div>
      <AuditorNav />
      <div className="setting-container">
        <Auditorsidebar />
        <div className="setting-content">
          <h2 className="admin-home-title">My Account</h2>

          {loading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : userData ? (
            <div className="admin-info">
              <Descriptions bordered column={1} >
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
            <p>No user data found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditorSettings;
