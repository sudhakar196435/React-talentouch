import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { message } from 'antd';
import * as XLSX from 'xlsx';
import '../Styles/Actdetail.css';
import AdminNav from "./AdminNav";

const ActDetailPage = () => {
  const [acts, setActs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate(); // Initialize the useNavigate hook

  useEffect(() => {
    const fetchActs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "acts"));
        const actData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setActs(actData);
      } catch (error) {
        console.error("Error fetching acts: ", error);
      }
    };
    fetchActs();
  }, []);

  const filteredActs = acts.filter(act => {
    const searchLower = searchTerm.toLowerCase();
    return (
      act.actCode.toLowerCase().includes(searchLower) ||
      act.actName.toLowerCase().includes(searchLower)
    );
  });

  const deleteAllActs = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete all acts?");
    if (confirmDelete) {
      try {
        const querySnapshot = await getDocs(collection(db, "acts"));
        const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, "acts", docSnapshot.id)));
        await Promise.all(deletePromises);
        setActs([]);
        message.success("All acts have been deleted successfully!");
      } catch (error) {
        console.error("Error deleting acts: ", error);
        message.error("Failed to delete acts.");
      }
    }
  };

  const handleFileUpload = (event) => {
    // ... (keep existing handleFileUpload implementation)
  };

  const handleBack = () => {
    navigate(-1); // This will navigate back to the previous page
  };

  return (
    <div>
      <AdminNav />
      <div className="admin-home-container">
        <div className="act-detail-page">
          
          <h1 className="page-title">Acts List</h1>
          <div className="action-buttons">
            <input
              type="text"
              placeholder="Search by Act Code or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button onClick={deleteAllActs} className="delete-all-button">
              Delete All Acts
            </button>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="upload-file-input"
            />
          </div>

          <table className="acts-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Act Code</th>
                <th>Act Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredActs.map((act, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{act.actCode}</td>
                  <td>{act.actName}</td>
                  <td>
                    <Link to={`/act/${act.id}`} className="view-details-button">
                      View Details
                    </Link>
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
