import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Ensure this is correctly initialized in firebase.js
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import '../Styles/Actdetail.css'
import AdminNav from "./AdminNav";
const ActDetailPage = () => {
  const [acts, setActs] = useState([]);

  // Fetch acts from Firestore
  useEffect(() => {
    const fetchActs = async () => {
      const querySnapshot = await getDocs(collection(db, "acts"));
      const actData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));  // Include doc.id
      setActs(actData);
    };

    fetchActs();
  }, []);

  return (
    <div><AdminNav/>
    <div className="admin-home-container">
    <div className="act-detail-page">
      <h1 className="page-title">Acts List</h1>

      {/* Table displaying actCode, actName, and a View Details button */}
      <table className="acts-table">
        <thead>
          <tr>
            <th>Act Code</th>
            <th>Act Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {acts.map((act, index) => (
            <tr key={index}>
              <td>{act.actCode}</td>
              <td>{act.actName}</td>
              <td>
                <Link to={`/act/${act.id}`} className="view-details-button">
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
    </div>
  );
};

export default ActDetailPage;
