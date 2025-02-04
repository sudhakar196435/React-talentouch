import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import AuditorNav from "./AuditorNav";
import { Spin } from 'antd';
import { FaFileAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import '../Styles/AuditorHome.css';

function AuditorHome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [totalReports, setTotalReports] = useState(0);
  const [reviewedReports, setReviewedReports] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsCollection = collection(db, "reports");
        const querySnapshot = await getDocs(reportsCollection);

        let reviewedCount = 0;
        let pendingCount = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.reviewed) reviewedCount++;
          else pendingCount++;
        });

        setTotalReports(querySnapshot.size);
        setReviewedReports(reviewedCount);
        setPendingReports(pendingCount);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <AuditorNav />
      <div className="auditor-home-container">
        <h1 className="auditor-home-title">Auditor Dashboard</h1>
        <div className="stats-container">
          <div className={`stat-card ${totalReports > 0 ? 'total' : ''}`}>
            <FaFileAlt size={40} color="#007BFF" />
            <h2>Total Reports</h2>
            <p>{totalReports}</p>
          </div>
          <div className={`stat-card ${reviewedReports > 0 ? 'reviewed' : ''}`}>
            <FaCheckCircle size={40} color="#28a745" />
            <h2>Reviewed Reports</h2>
            <p>{reviewedReports}</p>
          </div>
          <div className={`stat-card ${pendingReports > 0 ? 'pending' : ''}`}>
            <FaExclamationCircle size={40} color="#ffc107" />
            <h2>Pending Reports</h2>
            <p>{pendingReports}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditorHome;
