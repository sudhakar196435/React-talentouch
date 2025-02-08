import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import '../Styles/SubUserHome.css';

import { ToastContainer, toast } from 'react-toastify';
import { Spin } from 'antd';
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
        navigate("/login");
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
      <div className="subuser-container">
        <h1 className="subuser-title">Welcome to Your Branch</h1>
        {branch ? (
          <div className="branch-details">
            <h2>Branch Name: {branch.branchName}</h2>
            <p>Location: {branch.location}</p>
           
          </div>
        ) : (
          <p>No branch assigned.</p>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default SubUserHome;
