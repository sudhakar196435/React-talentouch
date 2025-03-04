import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import '../Styles/SubUserHome.css';
import auditImage from "../Assets/image.png";
import { ToastContainer, toast } from 'react-toastify';
import { Spin,Button } from 'antd';
import Subusernav from "./Subusernav";

const SubUserHome = () => {
  const [branch, setBranch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserAuthenticated(true);
        setUserEmail(user.email);
      } else {
        setUserAuthenticated(false);
        navigate("/AccessDenied");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (userAuthenticated && userEmail) {
      const fetchBranch = async () => {
        setIsLoading(true);
        
        const usersSnapshot = await getDocs(collection(db, "users"));
        for (const userDoc of usersSnapshot.docs) {
          const branchesSnapshot = await getDocs(collection(userDoc.ref, "branches"));
          for (const branchDoc of branchesSnapshot.docs) {
            const subUsersRef = collection(branchDoc.ref, "subUsers");
            const subUsersSnapshot = await getDocs(subUsersRef);
            
            for (const subUser of subUsersSnapshot.docs) {
              if (subUser.data().email === userEmail) {
                setBranch({ id: branchDoc.id, ...branchDoc.data() });
                setIsLoading(false);
                return;
              }
            }
          }
        }
        setIsLoading(false);
        toast.error("Branch not found.");
      };
      fetchBranch();
    }
  }, [userAuthenticated, userEmail]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Subusernav/>

    
      <div className="auditor-home">

        {/* Left Content */}
        <div className="auditor-info">
        <div className="subuser-container">
       
       {branch ? (
         <div className="branch-details">
           <h2>Branch Name: {branch.branchName}</h2>
           <p>Location: {branch.location}</p>
          
         </div>
       ) : (
         <p>No branch assigned.</p>
       )}
     </div>
       

        <p className="auditor-description">
  Easily manage your audit tasks with a user-friendly dashboard.  
  View detailed reports, analyze key data, and track performance.  
  Stay organized and make informed decisions with real-time insights.  
</p>

         
          <div className="auditor-buttons">
            <Button type="primary" className="start-audit-btn" onClick={() => navigate("/ss")}>
              My Branch Audits
            </Button>
          </div>
        </div>

        {/* Right Image */}
        <div className="auditor-image-container">
          <img src={auditImage} alt="Audit Process" className="auditor-image" />
        </div>
      </div>
      

      <ToastContainer />
    </div>
  );
};

export default SubUserHome;
