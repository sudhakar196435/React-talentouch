import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import AdminNav from "./AdminNav";
import "../Styles/UserDetail.css"; // Updated CSS file

const UserDetail = () => {
  const { userId } = useParams(); // Get userId from route
  const [user, setUser] = useState(null);
  const [acts, setActs] = useState([]); // Acts from Firestore
  const [selectedActs, setSelectedActs] = useState([]); // Acts selected for the user

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUser(userDoc.data());
        setSelectedActs(userDoc.data().acts || []); // Prepopulate selected acts
      } else {
        console.error("User not found");
      }
    };

    fetchUser();
  }, [userId]);

  // Fetch all acts
  useEffect(() => {
    const fetchActs = async () => {
      const querySnapshot = await getDocs(collection(db, "acts"));
      const actData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setActs(actData);
    };

    fetchActs();
  }, []);

  // Handle checkbox toggle
  const handleCheckboxChange = (actId) => {
    setSelectedActs((prevSelected) =>
      prevSelected.includes(actId)
        ? prevSelected.filter((id) => id !== actId) // Remove if already selected
        : [...prevSelected, actId] // Add if not selected
    );
  };

  // Save selected acts to the user
  const handleSave = async () => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { acts: selectedActs });
      alert("Selected acts saved successfully!");
    } catch (error) {
      console.error("Error saving acts:", error);
      alert("Failed to save selected acts. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <AdminNav />
      <div className="user-detail-container">
      <h1 className="admin-home-title">User Details</h1>
        <div className="user-info">
          <p><strong>Full Name:</strong> {user.fullName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Mobile Number:</strong> {user.mobileNumber}</p>
        </div>

        <div className="acts-section">
          <h3>Assign Acts</h3>
          <table className="acts-table">
            <thead>
              <tr>
                <th>Act Code</th>
                <th>Act Name</th>
                <th>Assign</th>
              </tr>
            </thead>
            <tbody>
              {acts.map((act) => (
                <tr key={act.id}>
                  <td>{act.actCode}</td>
                  <td>{act.actName}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedActs.includes(act.id)}
                      onChange={() => handleCheckboxChange(act.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="save-btn" onClick={handleSave}>Save Selected Acts</button>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
