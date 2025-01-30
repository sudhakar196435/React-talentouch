import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Ensure this is correctly initialized in firebase.js
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import UserNav from "./UserNav"; // Import the navigation bar component
import { onAuthStateChanged } from "firebase/auth"; // For monitoring auth state
import { FaEye, FaClipboardList } from 'react-icons/fa';
import "../Styles/UserActs.css"; // Import CSS for styling
import { Empty } from "antd"; // Import Ant Design's Empty component

const UserActs = () => {
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // To store the logged-in user
  const [isActive, setIsActive] = useState(false); // For active status
  
  const navigate = useNavigate(); // For navigation to login if not logged in

  useEffect(() => {
    // Check if the user is logged in
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set user if logged in
      } else {
        navigate("/login"); // Redirect to login page if no user
      }
    });

    return () => unsubscribeAuth(); // Clean up the auth listener on component unmount
  }, [navigate]);

  useEffect(() => {
    if (!user) return; // If no user is logged in, don't fetch acts

    // Fetch real-time data for user and their acts
    const unsubscribeFirestore = onSnapshot(
      query(collection(db, "users"), where("email", "==", user.email)),
      async (querySnapshot) => {
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setIsActive(userData.active || false); // Set active status
         

          if (userData.active) {
            const actIds = userData.acts || []; // Get acts IDs

            // Set up a listener for the acts collection
            onSnapshot(collection(db, "acts"), (actSnapshot) => {
              const userActs = actSnapshot.docs
                .filter((doc) => actIds.includes(doc.id))
                .map((doc) => ({
                  id: doc.id,
                  actName: doc.data().actName,
                  actCode: doc.data().actCode,
                }));
              setActs(userActs); // Update acts state in real-time
            });
          } else {
            setActs([]); // Reset acts if user is inactive or blocked
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeFirestore(); // Clean up the Firestore listener on component unmount
  }, [user]); // Re-run when user changes

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    ); // Simple loading message
  }

  return (
    <div>
      <UserNav />
      <div className="acts-container">
        <h1 className="admin-home-title">My Acts</h1>

       

        {!isActive && (
          <p className="verification-message">Your account is under verification. Please wait for approval.</p>
        )}

        {isActive && acts.length > 0 ? (
          <table className="acts-table">
            <thead>
              <tr>
              <th className="table-header">Act Code</th>
                <th className="table-header">Act Name</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {acts.map((act) => (
                <tr key={act.id}>
                   <td className="act-name">{act.actCode}</td>
                  <td className="act-name">{act.actName}</td>
                  <td className="action-buttons">
                    <Link to={`/act/${act.id}`} className="view-details-button">
                      <FaEye /> View Details
                    </Link>
                    <Link to={`/useraudit/${act.id}`} className="audit-button">
                      <FaClipboardList /> Audit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          isActive && (
            <Empty description="No Acts available" className="empty-state" />
          )
        )}
      </div>
    </div>
  );
};

export default UserActs;
