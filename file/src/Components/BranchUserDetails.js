import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Descriptions, Skeleton, Alert, Breadcrumb } from 'antd';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import '../Styles/BranchUserDetails.css'; // Import CSS file
import { HomeOutlined, UserOutlined, FileOutlined } from '@ant-design/icons';
import AuditorNav from './AuditorNav';

const BranchUserDetails = () => {
  const location = useLocation();
  const { userId } = location.state || {};
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUser(userSnap.data());
      } else {
        throw new Error('User not found.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AuditorNav />
      <div className="admin-container">
        <h1 className="admin-home-title">Company Details</h1>
        {/* Breadcrumb Navigation */}
        <Breadcrumb style={{ marginBottom: '20px' }}>
          <Breadcrumb.Item href="/AuditorHome">
            <HomeOutlined /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/auditorviewacts">
            <UserOutlined /> Assigned Branches
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <FileOutlined /> Company Details
          </Breadcrumb.Item>
        </Breadcrumb>
        
        <div className="profile-container">
          {error ? (
            <Alert message={error} type="error" className="error-alert" />
          ) : loading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <Descriptions bordered column={2} className="profile-table">
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Company Name">{user.companyName}</Descriptions.Item>
              <Descriptions.Item label="Company Address">{user.companyAddress}</Descriptions.Item>
              <Descriptions.Item label="Industry Type">{user.industryType}</Descriptions.Item>
              <Descriptions.Item label="Coordinator Name">{user.coordinatorName}</Descriptions.Item>
              <Descriptions.Item label="Director Name">{user.directorName}</Descriptions.Item>
              <Descriptions.Item label="Hazardous">{user.hazardous}</Descriptions.Item>
              <Descriptions.Item label="HP & Man Power">{user.hpAndManPower}</Descriptions.Item>
              <Descriptions.Item label="License No">{user.licenseNo}</Descriptions.Item>
              <Descriptions.Item label="Medical Advisor Name">{user.medicalAdvisorName}</Descriptions.Item>
              <Descriptions.Item label="Occupier Name">{user.occupierName}</Descriptions.Item>
              <Descriptions.Item label="Safety Officer Name">{user.safetyOfficerName}</Descriptions.Item>
              <Descriptions.Item label="Welfare Officer Name">{user.welfareOfficerName}</Descriptions.Item>
            </Descriptions>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchUserDetails;
