import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Ensure this is correctly initialized in firebase.js
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import { message } from 'antd'; // Import Ant Design message component for notifications
import '../Styles/Actdetail.css'
import AdminNav from "./AdminNav";

const ActDetailPage = () => {
  const [acts, setActs] = useState([]);

  // Fetch acts from Firestore
  useEffect(() => {
    const fetchActs = async () => {
      const querySnapshot = await getDocs(collection(db, "acts"));
      const actData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })); // Include doc.id
      setActs(actData);
    };

    fetchActs();
  }, []);

  // Function to delete all acts
  const deleteAllActs = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete all acts?");
    if (confirmDelete) {
      try {
        const actsCollection = collection(db, "acts");
        const querySnapshot = await getDocs(actsCollection);
        querySnapshot.forEach(async (docSnapshot) => {
          await deleteDoc(doc(db, "acts", docSnapshot.id)); // Delete each document in the collection
        });

        setActs([]); // Clear acts list from UI after deletion
        message.success("All acts have been deleted successfully!");
      } catch (error) {
        console.error("Error deleting acts: ", error);
        message.error("Failed to delete acts.");
      }
    }
  };

  return (
    <div>
      <AdminNav />
      <div className="admin-home-container">
        <div className="act-detail-page">
          <h1 className="page-title">Acts List</h1>

          {/* Button to delete all acts */}
          <button onClick={deleteAllActs} className="delete-all-button">
            Delete All Acts
          </button>

          {/* Table displaying actCode, actName, and action buttons */}
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
                    {/* Existing View Details button */}
                    <Link to={`/act/${act.id}`} className="view-details-button">
                      View Details
                    </Link>
                    {/* New View Questions button */}
                    <Link to={`/act/${act.id}/questions`} className="view-questions-button">
                      Manage Questions
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
