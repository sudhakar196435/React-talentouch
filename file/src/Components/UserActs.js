import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Ensure this is correctly initialized in firebase.js
import { collection, getDocs, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import UserNav from "./UserNav"; // Import the navigation bar component

import "../Styles/UserActs.css"; // Import CSS for styling

const UserActs = () => {
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActs = async () => {
      try {
        // Query to find the user with the specific email
        const userRef = collection(db, "users");
        const userQuery = query(userRef, where("email", "==", "2210030009cse@gmail.com"));
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
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Simple loading message
  }

  return (
    <div>
      <UserNav />
      <div className="user-acts-container">
        <h2>Your Acts</h2>

        {acts.length > 0 ? (
          <table className="acts-table">
            <thead>
              <tr>
                <th>Act Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {acts.map((act) => (
                <tr key={act.id}>
                  <td>{act.actName}</td> {/* Display actName */}
                  <td>
                    <Link to={`/act/${act.id}`} className="view-details-button">View Details</Link>
                    <Link to={`/useraudit/${act.id}`} className="audit-button">Audit</Link> {/* Updated to 'useraudit' */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>This user has no acts assigned yet.</p>
        )}
      </div>
    </div>
  );
};

export default UserActs;
