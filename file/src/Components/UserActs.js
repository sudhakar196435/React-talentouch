import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Ensure this is correctly initialized in firebase.js
import { collection, getDocs, query, where } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import UserNav from "./UserNav"; // Import the navigation bar component
import { onAuthStateChanged } from "firebase/auth"; // For monitoring auth state
import { FaEye, FaClipboardList } from 'react-icons/fa';
import "../Styles/UserActs.css"; // Import CSS for styling

const UserActs = () => {
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // To store the logged-in user
  const navigate = useNavigate(); // For navigation to login if not logged in

  useEffect(() => {
    // Check if the user is logged in
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set user if logged in
      } else {
        navigate("/login"); // Redirect to login page if no user
      }
    });

    return () => unsubscribe(); // Clean up the listener on component unmount
  }, [navigate]);

  useEffect(() => {
    if (!user) return; // If no user is logged in, don't fetch acts

    const fetchActs = async () => {
      try {
        // Query to find the user with the specific email (using user's email)
        const userRef = collection(db, "users");
        const userQuery = query(userRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          const actIds = userData.acts || []; // Get acts IDs

          // Now get the details of each act from the acts collection
          const actsRef = collection(db, "acts");
          const actDocs = await getDocs(actsRef);
          const userActs = actDocs.docs.filter(doc => actIds.includes(doc.id))
                                       .map(doc => ({ id: doc.id, actName: doc.data().actName })); // Use 'actName'
          setActs(userActs); // Set acts data in state
        }

      } catch (error) {
        console.error("Error fetching acts:", error);
      }
      setLoading(false);
    };

    fetchActs();
  }, [user]); // Re-fetch acts when user changes

  if (loading) {
    return  <div className="loading-container">
    <div className="spinner"></div>
  </div>; // Simple loading message
  }

  return (
    <div>
      <UserNav />
      

<div className="acts-container">
  
  <h1 className="admin-home-title">My Acts</h1>

  {acts.length > 0 ? (
    <table className="acts-table">
      <thead>
        <tr>
          <th className="table-header">Act Name</th>
          <th className="table-header">Actions</th>
        </tr>
      </thead>
      <tbody>
        {acts.map((act) => (
          <tr key={act.id}>
            <td className="act-name">{act.actName}</td> {/* Display actName */}
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
    <p className="no-acts-message">No acts assigned yet.</p>
  )}
</div>

    </div>
  );
};

export default UserActs;
