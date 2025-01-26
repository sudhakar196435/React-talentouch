import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase"; // Ensure this is correctly initialized in firebase.js
import { doc, getDoc } from "firebase/firestore";
import '../Styles/View.css'
import AdminNav from "./AdminNav";
const ActDetailsView = () => {
  const { id } = useParams(); // Retrieve the act ID from the URL
  const [act, setAct] = useState(null);

  useEffect(() => {
    const fetchActDetails = async () => {
      const docRef = doc(db, "acts", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setAct(docSnap.data());
      } else {
        console.log("No such document!");
      }
    };

    fetchActDetails();
  }, [id]);

  return (
    <div><AdminNav/>
     <div className="admin-home-container">
    <div className="act-detail-page">
      {act ? (
        <div className="act-details">
          <h2 className="details-title">Details for {act.actName}</h2>
          <div className="details-section">
            <p><strong>Act Code:</strong> {act.actCode}</p>
            <p><strong>Act Name:</strong> {act.actName}</p>

            {/* Display details map dynamically */}
           <div className="details-map">
  <h3>Details</h3>
  <table className="details-table">
    <thead>
      <tr>
        <th>Key</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      {act.details && Object.entries(act.details).map(([key, value], index) => (
        <tr key={index}>
          <td><strong>{key}</strong></td>
          <td>{value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

          </div>
        </div>
      ) : (
        <div className="loading-container">
        <div className="spinner"></div>
      </div>
      )}
    </div>
    </div>
    </div>
  );
};

export default ActDetailsView;
